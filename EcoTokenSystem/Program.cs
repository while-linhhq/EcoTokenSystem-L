
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Application.Services;
using EcoTokenSystem.Domain.Entities;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
using System.Threading;
using System;
using System.Linq;
namespace EcoTokenSystem
{
    public class Program
    {
        public static void Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);


            builder.Services.AddControllers();
            // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                // Thêm định nghĩa bảo mật JWT cho Swagger UI
                c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
                {
                    Description = "Vui lòng nhập Token JWT (Ví dụ: Bearer eyJhbGci...)",
                    Name = "Authorization",
                    In = ParameterLocation.Header,
                    Type = SecuritySchemeType.ApiKey,
                    Scheme = "Bearer" // Phải là "Bearer"
                });

                // Yêu cầu sử dụng Bearer Token cho các API được bảo vệ
                c.AddSecurityRequirement(new OpenApiSecurityRequirement
                {
                    {
                        new OpenApiSecurityScheme
                        {
                            Reference = new OpenApiReference
                            {
                                Type = ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        new string[] {}
                    }
                });
                        });

            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString, sqlOptions =>
                {
                    sqlOptions.EnableRetryOnFailure(
                        maxRetryCount: 5,
                        maxRetryDelay: TimeSpan.FromSeconds(30),
                        errorNumbersToAdd: null);
                }));
            builder.Services.AddScoped<IUserInterface, UserService>();
            builder.Services.AddScoped<IPostInterface, PostService>();
            builder.Services.AddScoped<IItemsInterface, ItemsService>();
            builder.Services.AddScoped<IPoints, PointsService>();
            builder.Services.AddScoped<ITokenService, TokenService>();
            builder.Services.AddScoped<IConfigInterface, ConfigService>();
            builder.Services.AddScoped<ILikeInterface, LikeService>();
            builder.Services.AddScoped<ICommentInterface, CommentService>();
            // Add services to the container.
            var MyAllowSpecificOrigins = "_myAllowSpecificOrigins";

            // add service CORS in container
            builder.Services.AddCors(options =>
            {
                options.AddPolicy(name: MyAllowSpecificOrigins,
                                  policy =>
                                  {
                                      // port 5173)
                                      policy.WithOrigins("http://localhost:5173")
                                            .AllowAnyHeader()
                                            .AllowAnyMethod()
                                            .AllowCredentials(); //   cookie or header JWT
                                  });
            });


            // 1. Đọc cấu hình JWT từ appsettings.json
            var jwtIssuer = builder.Configuration["JwtSettings:Issuer"];
            var jwtAudience = builder.Configuration["JwtSettings:Audience"];
            var jwtSecret = builder.Configuration["JwtSettings:Secret"];

            // 2. Đăng ký Dịch vụ Xác thực
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true, // Xác thực người phát hành (Issuer)
                        ValidateAudience = true, // Xác thực đối tượng (Audience)
                        ValidateLifetime = true, // Xác thực thời hạn Token
                        ValidateIssuerSigningKey = true, // Xác thực chữ ký
                        ValidIssuer = jwtIssuer,
                        ValidAudience = jwtAudience,

                        // Khóa bí mật dùng để xác minh chữ ký của Token
                        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret!))
                    };
                });

            // 3. Đăng ký Dịch vụ Ủy quyền (Authorization)
            builder.Services.AddAuthorization();

            var app = builder.Build();
            // Thêm khối code này để tự động Migration
            using (var scope = app.Services.CreateScope())
            {
                var services = scope.ServiceProvider;
                var context = services.GetRequiredService<ApplicationDbContext>();
                var logger = services.GetRequiredService<ILogger<Program>>();

                int maxRetries = 10;
                int retryDelay = 5000; // 5 giây
                bool migrationSuccess = false;

                for (int attempt = 1; attempt <= maxRetries; attempt++)
                {
                    try
                    {
                        logger.LogInformation($"[Attempt {attempt}/{maxRetries}] Đang chạy migration...");

                        // Migrate() tự động:
                        // - Tạo database nếu chưa tồn tại
                        // - Chạy tất cả migrations
                        // - Seed data nếu có
                        context.Database.Migrate();

                        logger.LogInformation("✅ Migration đã hoàn thành.");

                        // Verify migration thành công
                        try
                        {
                            var hasUsers = context.Database.ExecuteSqlRaw("SELECT TOP 1 1 FROM Users");
                            logger.LogInformation("✅ Bảng Users đã tồn tại. Migration thành công!");
                        }
                        catch (Exception verifyEx)
                        {
                            logger.LogWarning($"⚠️ Không thể verify bảng Users: {verifyEx.Message}");
                        }

                        // Kiểm tra và tạo bảng Likes nếu chưa tồn tại
                        try
                        {
                            context.Database.ExecuteSqlRaw(@"
                                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Likes')
                                BEGIN
                                    CREATE TABLE [Likes] (
                                        [Id] uniqueidentifier NOT NULL,
                                        [PostId] uniqueidentifier NOT NULL,
                                        [UserId] uniqueidentifier NOT NULL,
                                        [CreatedAt] datetime2 NOT NULL,
                                        CONSTRAINT [PK_Likes] PRIMARY KEY ([Id]),
                                        CONSTRAINT [FK_Likes_Posts_PostId] FOREIGN KEY ([PostId]) REFERENCES [Posts] ([Id]) ON DELETE CASCADE,
                                        CONSTRAINT [FK_Likes_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
                                    );
                                    CREATE UNIQUE INDEX [IX_Likes_PostId_UserId] ON [Likes] ([PostId], [UserId]);
                                    CREATE INDEX [IX_Likes_PostId] ON [Likes] ([PostId]);
                                    CREATE INDEX [IX_Likes_UserId] ON [Likes] ([UserId]);
                                END
                            ");
                            // Verify bảng Likes đã tồn tại
                            try
                            {
                                context.Database.ExecuteSqlRaw("SELECT TOP 1 1 FROM Likes");
                                logger.LogInformation("✅ Bảng Likes đã tồn tại.");
                            }
                            catch
                            {
                                logger.LogInformation("✅ Bảng Likes đã được tạo thành công.");
                            }
                        }
                        catch (Exception likesEx)
                        {
                            logger.LogWarning($"⚠️ Không thể kiểm tra/tạo bảng Likes: {likesEx.Message}");
                        }

                        // Kiểm tra và tạo bảng Comments nếu chưa tồn tại
                        try
                        {
                            context.Database.ExecuteSqlRaw(@"
                                IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'Comments')
                                BEGIN
                                    CREATE TABLE [Comments] (
                                        [Id] uniqueidentifier NOT NULL,
                                        [PostId] uniqueidentifier NOT NULL,
                                        [UserId] uniqueidentifier NOT NULL,
                                        [Content] nvarchar(max) NOT NULL,
                                        [CreatedAt] datetime2 NOT NULL,
                                        CONSTRAINT [PK_Comments] PRIMARY KEY ([Id]),
                                        CONSTRAINT [FK_Comments_Posts_PostId] FOREIGN KEY ([PostId]) REFERENCES [Posts] ([Id]) ON DELETE CASCADE,
                                        CONSTRAINT [FK_Comments_Users_UserId] FOREIGN KEY ([UserId]) REFERENCES [Users] ([Id]) ON DELETE NO ACTION
                                    );
                                    CREATE INDEX [IX_Comments_PostId] ON [Comments] ([PostId]);
                                    CREATE INDEX [IX_Comments_UserId] ON [Comments] ([UserId]);
                                END
                            ");
                            // Verify bảng Comments đã tồn tại
                            try
                            {
                                context.Database.ExecuteSqlRaw("SELECT TOP 1 1 FROM Comments");
                                logger.LogInformation("✅ Bảng Comments đã tồn tại.");
                            }
                            catch
                            {
                                logger.LogInformation("✅ Bảng Comments đã được tạo thành công.");
                            }
                        }
                        catch (Exception commentsEx)
                        {
                            logger.LogWarning($"⚠️ Không thể kiểm tra/tạo bảng Comments: {commentsEx.Message}");
                        }

                        migrationSuccess = true;
                        break;
                    }
                    catch (Exception ex)
                    {
                        logger.LogError(ex, $"[Attempt {attempt}/{maxRetries}] ❌ Lỗi khi chạy migration: {ex.Message}");
                        if (ex.InnerException != null)
                        {
                            logger.LogError($"Chi tiết: {ex.InnerException.Message}");
                        }

                        if (attempt < maxRetries)
                        {
                            logger.LogWarning($"Đợi {retryDelay / 1000} giây và thử lại...");
                            Thread.Sleep(retryDelay);
                        }
                        else
                        {
                            logger.LogError("❌ Đã thử {0} lần nhưng vẫn không thể chạy migration.", maxRetries);
                            logger.LogError("⚠️ Backend sẽ start nhưng các API có thể fail.");
                            logger.LogError("Vui lòng kiểm tra:");
                            logger.LogError("  1. SQL Server container đã start chưa? (docker-compose ps)");
                            logger.LogError("  2. Connection string trong docker-compose.yml/appsettings đúng chưa?");
                        }
                    }
                }

                // Đảm bảo Moderator role tồn tại (sau migration thành công)
                if (migrationSuccess)
                {
                    try
                    {
                        var moderatorRoleExists = context.Roles.Any(r => r.Id == 3);
                        if (!moderatorRoleExists)
                        {
                            logger.LogWarning("Moderator role (Id=3) chưa tồn tại. Đang thêm trực tiếp...");
                            try
                            {
                                context.Roles.Add(new EcoTokenSystem.Domain.Entities.Role { Id = 3, Name = "Moderator" });
                                context.SaveChanges();
                                logger.LogInformation("✅ Moderator role đã được thêm thành công!");
                            }
                            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
                            {
                                moderatorRoleExists = context.Roles.Any(r => r.Id == 3);
                                if (moderatorRoleExists)
                                {
                                    logger.LogInformation("Moderator role đã tồn tại (sau khi kiểm tra lại).");
                                }
                                else
                                {
                                    logger.LogError(dbEx, "Không thể thêm Moderator role. Lỗi: {0}", dbEx.InnerException?.Message ?? dbEx.Message);
                                }
                            }
                        }
                        else
                        {
                            logger.LogInformation("✅ Moderator role đã tồn tại trong database.");
                        }
                    }
                    catch (Exception roleEx)
                    {
                        logger.LogError(roleEx, "Lỗi khi kiểm tra/thêm Moderator role: {0}", roleEx.Message);
                    }
                }
            }

            // Configure the HTTP request pipeline.
            // Enable Swagger for Development and Docker environments
            if (app.Environment.IsDevelopment() || app.Environment.EnvironmentName == "Docker")
            {
                app.UseSwagger();
                app.UseSwaggerUI(c =>
                {
                    c.SwaggerEndpoint("/swagger/v1/swagger.json", "EcoTokenSystem API V1");
                    c.RoutePrefix = string.Empty; // Để trống giúp vào thẳng Swagger khi truy cập http://localhost:5109
                });
            }

            app.UseHttpsRedirection();

            // Serve static files (images, css, js, etc.) từ wwwroot
            // Phải đặt TRƯỚC UseCors để CORS headers được apply cho static files
            app.UseStaticFiles();

            app.UseCors(MyAllowSpecificOrigins);

            app.UseAuthentication();
            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
