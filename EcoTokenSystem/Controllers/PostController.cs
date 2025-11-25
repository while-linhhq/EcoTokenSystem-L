using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;

namespace EcoTokenSystem.API.Controllers
{
    // Kế thừa BaseController để sử dụng GetUserIdFromToken()
    [Route("api/[controller]")]
    [ApiController]
    public class PostController : BaseController
    {
        private readonly IPostInterface _postService;

        public PostController(IPostInterface postService)
        {
            _postService = postService;
        }

        // --- 1. TẠO BÀI ĐĂNG (CreatePost) ---
        // Sửa: Lấy UserId từ Token, Endpoint là POST /api/Post
        [HttpPost]
        [Consumes("multipart/form-data")]
        [Authorize]
        public async Task<IActionResult> CreatePost([FromForm] PostCreateRequestDTO request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                Guid userId = GetUserIdFromToken(); // Lấy ID an toàn từ Token
                var response = await _postService.CreatePostAsync(userId, request); // Truyền userId vào Service

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
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = "Lỗi Server: " + ex.Message });
            }
        }

        // --- 2. DUYỆT/TỪ CHỐI BÀI ĐĂNG (ApproveRejectPost) ---
        // Sửa: Yêu cầu quyền Admin và lấy AdminId từ Token
        [HttpPatch]
        [Route("{id:Guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> ApproveRejectPost([FromRoute] Guid id, [FromBody] ApproveAndRejectPostDTO request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                Guid adminId = GetUserIdFromToken(); // Lấy AdminId an toàn từ Token

                // Truyền cả request và AdminId vào Service
                var response = await _postService.ApproveRejectPostAsync(id, request, adminId);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = "Lỗi Server: " + ex.Message });
            }
        }

        // --- 3. API XEM CÔNG KHAI (Posts) ---
        // BỔ SUNG: Cho phép xem tất cả bài đã duyệt (StatusId = 2)
        [HttpGet]
        public async Task<IActionResult> GetApprovedPosts(int statusId)
        {
            try
            {
                // Dùng Guid.Empty hoặc logic khác nếu muốn lấy PUBLIC POSTS
                // Nếu Service cho phép lọc theo StatusId = 2 (Approved)
                Guid userId = GetUserIdFromToken();
                var response = await _postService.GetPostsAsync(userId, statusId);

                if (response.IsSuccess) return Ok(response.Data);
                return NotFound(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = "Lỗi Server: " + ex.Message });
            }
        }

        // --- 4. API Thừa (Đã XÓA) ---
        // (Bỏ qua API GET /api/Post/{userId}/{statusId} vì nó đã được chuyển sang /api/User/me/posts)
    }
}