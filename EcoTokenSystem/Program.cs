
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Application.Services;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;
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
                options.UseSqlServer(connectionString));
            builder.Services.AddScoped<IUserInterface, UserService>();
            builder.Services.AddScoped<IPostInterface, PostService>();
            builder.Services.AddScoped<IItemsInterface, ItemsService>();
            builder.Services.AddScoped<IPoints, PointsService>();
            builder.Services.AddScoped<ITokenService, TokenService>();
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
                        //ClockSkew = TimeSpan.Zero // Không cho phép độ lệch thời gian
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

                // Tự động áp dụng tất cả các Migration đang chờ xử lý
                // Bỏ qua khối try-catch nếu bạn không muốn xử lý lỗi database lúc khởi động
                try
                {
                    context.Database.Migrate();
                }
                catch (Exception ex)
                {
                    // Ghi lại lỗi nếu quá trình Migration thất bại
                    var logger = services.GetRequiredService<ILogger<Program>>();
                    logger.LogError(ex, "An error occurred while migrating the database.");
                }
            }
            // Configure the HTTP request pipeline.
            if (app.Environment.IsDevelopment())
            {
                app.UseSwagger();
                app.UseSwaggerUI();
            }

            app.UseHttpsRedirection();
            app.UseCors(MyAllowSpecificOrigins);

            app.UseAuthentication();
            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
