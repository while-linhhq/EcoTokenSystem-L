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
    [Route("api/health")]
    public class HealthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly ILogger<HealthController> _logger;
        private static DateTime _lastDbCheck = DateTime.MinValue;
        private static DatabaseHealthStatus? _cachedDbStatus = null;
        private static readonly TimeSpan _cacheExpiration = TimeSpan.FromSeconds(10);
        private static readonly object _cacheLock = new object();

        public HealthController(ApplicationDbContext context, ILogger<HealthController> logger)
        {
            _context = context;
            _logger = logger;
        }

        [HttpGet]
        public IActionResult Get()
        {
            // Simple health check for ECS - always returns 200 OK
            // This ensures the container passes health checks even if database is temporarily unavailable
            var healthStatus = new
            {
                status = "healthy",
                timestamp = DateTime.UtcNow
            };

            return Ok(healthStatus);
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
            // Return cached status if still valid
            lock (_cacheLock)
            {
                if (_cachedDbStatus != null && DateTime.UtcNow - _lastDbCheck < _cacheExpiration)
                {
                    return _cachedDbStatus;
                }
            }

            try
            {
                // Use a simple and fast query with timeout
                var cts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                var canConnect = await _context.Database.CanConnectAsync(cts.Token);

                DatabaseHealthStatus status;
                if (canConnect)
                {
                    status = new DatabaseHealthStatus
                    {
                        Status = "connected",
                        Message = "Database connection successful",
                        Timestamp = DateTime.UtcNow
                    };
                }
                else
                {
                    status = new DatabaseHealthStatus
                    {
                        Status = "disconnected",
                        Message = "Cannot connect to database",
                        Timestamp = DateTime.UtcNow
                    };
                }

                // Cache the result
                lock (_cacheLock)
                {
                    _cachedDbStatus = status;
                    _lastDbCheck = DateTime.UtcNow;
                }

                return status;
            }
            catch (OperationCanceledException)
            {
                _logger.LogWarning("Database connection check timed out");
                var status = new DatabaseHealthStatus
                {
                    Status = "timeout",
                    Message = "Database connection check timed out",
                    Timestamp = DateTime.UtcNow
                };

                // Don't cache timeout errors
                return status;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Database connection check failed");
                var status = new DatabaseHealthStatus
                {
                    Status = "error",
                    Message = ex.Message,
                    Timestamp = DateTime.UtcNow
                };

                // Don't cache errors
                return status;
            }
        }
    }
}

