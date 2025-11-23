using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Application.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EcoTokenSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemsController : ControllerBase
    {
        private readonly IPointsAndItems pointsAndItemsService;

        public ItemsController(IPointsAndItems pointsAndItemsService)
        {
            this.pointsAndItemsService = pointsAndItemsService;
        }

        [HttpGet]
        public async Task<IActionResult> Items()
        {
            try
            {
                var response = await pointsAndItemsService.ItemsAsync();
                return Ok(response);
            }
            catch (Exception ex) 
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpGet("point-history")]
        public async Task<IActionResult> PointHistory([FromQuery] Guid ?userId)
        {
            try
            {
                var response = await pointsAndItemsService.ItemsHistoryAsync(userId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
