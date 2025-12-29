using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using EcoTokenSystem.Infrastructure.Data;

namespace EcoTokenSystem.API.Controllers
{
    public class DatabaseHealthStatus
    {
        public string Status { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime Timestamp { get; set; }
    }

    [ApiController]
    [Route("api/[controller]")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<HealthController> _logger;

        public HealthController(ApplicationDbContext context, ILogger<HealthController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var healthStatus = new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow,
                database = await CheckDatabaseConnection()
            };

            if (healthStatus.database.Status == "connected")
            {
                return Ok(healthStatus);
            }
            else
            {
                return StatusCode(503, healthStatus);
            }
        }

        [HttpGet("database")]
        public async Task<IActionResult> CheckDatabase()
        {
            var dbStatus = await CheckDatabaseConnection();
            if (dbStatus.Status == "connected")
            {
                return Ok(dbStatus);
            }
            else
            {
                return StatusCode(503, dbStatus);
            }
        }

        private async Task<DatabaseHealthStatus> CheckDatabaseConnection()
        {
            try
            {
                // Kiểm tra kết nối database bằng cách thực hiện một query đơn giản
                var canConnect = await _context.Database.CanConnectAsync();

                if (canConnect)
                {
                    // Thực hiện một query đơn giản để đảm bảo database thực sự hoạt động
                    await _context.Database.ExecuteSqlRawAsync("SELECT 1");

                    return new DatabaseHealthStatus
                    {
                        Status = "connected",
                        Message = "Database connection successful",
                        Timestamp = DateTime.UtcNow
                    };
                }
                else
                {
                    return new DatabaseHealthStatus
                    {
                        Status = "disconnected",
                        Message = "Cannot connect to database",
                        Timestamp = DateTime.UtcNow
                    };
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database connection check failed");
                return new DatabaseHealthStatus
                {
                    Status = "error",
                    Message = ex.Message,
                    Timestamp = DateTime.UtcNow
                };
            }
        }
    }
}

