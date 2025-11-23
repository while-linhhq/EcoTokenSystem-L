using EcoTokenSystem.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EcoTokenSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PointsController : ControllerBase
    {
        private readonly IPoints pointsService;

        public PointsController(IPoints pointsService)
        {
            this.pointsService = pointsService;
        }

        [HttpGet("point-history")]
        public async Task<IActionResult> PointHistory([FromQuery] Guid? userId)
        {
            try
            {
                var response = await pointsService.PointsHistoryAsync(userId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
