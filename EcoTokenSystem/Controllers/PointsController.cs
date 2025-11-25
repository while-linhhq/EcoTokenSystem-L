using EcoTokenSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EcoTokenSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PointsController : BaseController
    {
        private readonly IPoints pointsService;

        public PointsController(IPoints pointsService)
        {
            this.pointsService = pointsService;
        }

        [HttpGet("point-history")]
        [Authorize]
        public async Task<IActionResult> PointHistory()
        {
            try
            {
                Guid userId = GetUserIdFromToken();
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
