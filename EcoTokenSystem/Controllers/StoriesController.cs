using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace EcoTokenSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class StoriesController : BaseController
    {
        private readonly IStoryInterface _storyService;

        public StoriesController(IStoryInterface storyService)
        {
            _storyService = storyService;
        }

        /// <summary>
        /// GET /api/Stories - Get all active stories (within 24 hours)
        /// Public endpoint - no authentication required
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetActiveStories()
        {
            try
            {
                var response = await _storyService.GetActiveStoriesAsync();

                if (response.IsSuccess)
                {
                    return Ok(response);
                }
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi Server: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// GET /api/Stories/user/{userId} - Get stories for a specific user
        /// Public endpoint
        /// </summary>
        [HttpGet("user/{userId:Guid}")]
        public async Task<IActionResult> GetUserStories([FromRoute] Guid userId)
        {
            try
            {
                var response = await _storyService.GetUserStoriesAsync(userId);

                if (response.IsSuccess)
                {
                    return Ok(response);
                }
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi Server: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// POST /api/Stories - Upload a new story
        /// Requires authentication
        /// </summary>
        [HttpPost]
        [Consumes("multipart/form-data")]
        [Authorize]
        public async Task<IActionResult> UploadStory([FromForm] StoryUploadRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                Guid userId = GetUserIdFromToken();
                var response = await _storyService.UploadStoryAsync(userId, request);

                if (response.IsSuccess)
                {
                    return StatusCode(201, response); // 201 Created
                }
                return BadRequest(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi Server: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// POST /api/Stories/{storyId}/view - Mark a story as viewed
        /// Requires authentication
        /// </summary>
        [HttpPost("{storyId:Guid}/view")]
        [Authorize]
        public async Task<IActionResult> ViewStory([FromRoute] Guid storyId, [FromBody] StoryViewRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var response = await _storyService.ViewStoryAsync(storyId, request.ViewerId);

                if (response.IsSuccess)
                {
                    return Ok(response);
                }
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi Server: {ex.Message}"
                });
            }
        }

        /// <summary>
        /// DELETE /api/Stories/{storyId} - Delete a story
        /// Requires authentication - only story owner can delete
        /// </summary>
        [HttpDelete("{storyId:Guid}")]
        [Authorize]
        public async Task<IActionResult> DeleteStory([FromRoute] Guid storyId)
        {
            try
            {
                Guid userId = GetUserIdFromToken();
                var response = await _storyService.DeleteStoryAsync(storyId, userId);

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
                return StatusCode(500, new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi Server: {ex.Message}"
                });
            }
        }
    }
}
