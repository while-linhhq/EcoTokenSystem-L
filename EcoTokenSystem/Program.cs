
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Application.Services;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
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
            builder.Services.AddSwaggerGen();
            var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
            builder.Services.AddDbContext<ApplicationDbContext>(options =>
                options.UseSqlServer(connectionString));
            builder.Services.AddScoped<IUserInterface, UserService>();
            builder.Services.AddScoped<IPostInterface, PostService>();
            builder.Services.AddScoped<IPointsAndItems, PointsAndItemsServices>();

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

            app.UseAuthorization();


            app.MapControllers();

            app.Run();
        }
    }
}
