using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;

namespace EcoTokenSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class CommentController : BaseController
    {
        private readonly ICommentInterface _commentService;

        public CommentController(ICommentInterface commentService)
        {
            _commentService = commentService;
        }

        [HttpPost("{postId:Guid}")]
        [Authorize]
        public async Task<IActionResult> CreateComment([FromRoute] Guid postId, [FromBody] CommentCreateRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                Guid userId = GetUserIdFromToken();
                var response = await _commentService.CreateCommentAsync(userId, postId, request);
                
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
        public async Task<IActionResult> GetPostComments([FromRoute] Guid postId)
        {
            try
            {
                var response = await _commentService.GetPostCommentsAsync(postId);
                
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

        [HttpDelete("{commentId:Guid}")]
        [Authorize]
        public async Task<IActionResult> DeleteComment([FromRoute] Guid commentId)
        {
            try
            {
                Guid userId = GetUserIdFromToken();
                var response = await _commentService.DeleteCommentAsync(commentId, userId);
                
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
    }
}

