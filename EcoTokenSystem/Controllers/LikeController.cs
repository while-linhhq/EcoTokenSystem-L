using EcoTokenSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;

namespace EcoTokenSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LikeController : BaseController
    {
        private readonly ILikeInterface _likeService;

        public LikeController(ILikeInterface likeService)
        {
            _likeService = likeService;
        }

        [HttpPost("{postId:Guid}")]
        [Authorize]
        public async Task<IActionResult> ToggleLike([FromRoute] Guid postId)
        {
            try
            {
                Guid userId = GetUserIdFromToken();
                var response = await _likeService.ToggleLikeAsync(userId, postId);
                
                if (response.IsSuccess)
                {
                    return Ok(response);
                }
                return BadRequest(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { IsSuccess = false, Message = "Lỗi Server: " + ex.Message });
            }
        }

        [HttpGet("{postId:Guid}")]
        public async Task<IActionResult> GetPostLikes([FromRoute] Guid postId)
        {
            try
            {
                var response = await _likeService.GetPostLikesAsync(postId);
                
                if (response.IsSuccess)
                {
                    return Ok(response);
                }
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { IsSuccess = false, Message = "Lỗi Server: " + ex.Message });
            }
        }
    }
}

