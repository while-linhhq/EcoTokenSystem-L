using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace EcoTokenSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ConfigController : BaseController
    {
        private readonly IConfigInterface configService;

        public ConfigController(IConfigInterface configService)
        {
            this.configService = configService;
        }

        [HttpGet]
        public async Task<IActionResult> GetConfig()
        {
            try
            {
                var response = await configService.GetConfigAsync();
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = $"Lỗi Server: {ex.Message}" });
            }
        }

        [HttpPatch("gift-prices")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateGiftPrice([FromBody] UpdateGiftPriceRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await configService.UpdateGiftPriceAsync(request.GiftId, request.Price);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = $"Lỗi Server: {ex.Message}" });
            }
        }

        [HttpPatch("streak-milestones")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateStreakMilestone([FromBody] UpdateStreakMilestoneRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await configService.UpdateStreakMilestoneAsync(request.Streak, request.Milestone);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = $"Lỗi Server: {ex.Message}" });
            }
        }

        [HttpPatch("action-rewards")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateActionReward([FromBody] UpdateActionRewardRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await configService.UpdateActionRewardAsync(request.StreakMilestone, request.BonusTokens);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = $"Lỗi Server: {ex.Message}" });
            }
        }

        [HttpPatch("action-rewards/default")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateDefaultActionReward([FromBody] ActionRewardDTO reward)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await configService.UpdateDefaultActionRewardAsync(reward);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = $"Lỗi Server: {ex.Message}" });
            }
        }

        [HttpDelete("streak-milestones/{streak}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteStreakMilestone([FromRoute] string streak)
        {
            try
            {
                var response = await configService.DeleteStreakMilestoneAsync(streak);
                if (response.IsSuccess) return Ok(response);
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = $"Lỗi Server: {ex.Message}" });
            }
        }

        [HttpDelete("action-rewards/{streakMilestone}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteActionReward([FromRoute] string streakMilestone)
        {
            try
            {
                var response = await configService.DeleteActionRewardAsync(streakMilestone);
                if (response.IsSuccess) return Ok(response);
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = $"Lỗi Server: {ex.Message}" });
            }
        }
    }
}

