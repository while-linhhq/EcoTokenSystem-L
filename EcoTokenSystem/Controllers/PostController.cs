using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;

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
        // Sửa: Yêu cầu quyền Admin hoặc Moderator và lấy AdminId từ Token
        [HttpPatch]
        [Route("{id:Guid}")]
        [Authorize(Roles = "Admin,Moderator")]
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

        // --- 3. API XEM POSTS ---
        // - Public: Chỉ xem được approved posts (statusId = 2)
        // - Admin/Moderator: Xem được tất cả posts (pending, approved, rejected)
        [HttpGet]
        public async Task<IActionResult> GetPosts([FromQuery] int? statusId = null)
        {
            try
            {
                // Nếu không có statusId, mặc định là approved (2) cho public
                // Admin/Moderator có thể truyền statusId=1 để xem pending posts
                int? finalStatusId = statusId;
                
                // Nếu không có statusId và không phải Admin/Moderator, chỉ cho xem approved
                if (!statusId.HasValue)
                {
                    // Kiểm tra role từ token - thử nhiều cách để lấy role
                    var userRole = User?.FindFirst(ClaimTypes.Role)?.Value 
                        ?? User?.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value
                        ?? User?.FindFirst("role")?.Value;
                    
                    if (userRole != "Admin" && userRole != "Moderator")
                    {
                        finalStatusId = 2; // Chỉ cho xem approved posts
                    }
                }
                else
                {
                    // Nếu có statusId được truyền vào, kiểm tra quyền truy cập
                    // Chỉ Admin/Moderator mới được xem pending (statusId=1) hoặc rejected (statusId=3)
                    if (statusId.Value == 1 || statusId.Value == 3)
                    {
                        var userRole = User?.FindFirst(ClaimTypes.Role)?.Value 
                            ?? User?.FindFirst("http://schemas.microsoft.com/ws/2008/06/identity/claims/role")?.Value
                            ?? User?.FindFirst("role")?.Value;
                        
                        if (userRole != "Admin" && userRole != "Moderator")
                        {
                            // Không có quyền, chỉ cho xem approved
                            finalStatusId = 2;
                        }
                    }
                }

                // Lấy posts - dùng Guid.Empty để lấy tất cả posts
                // Lấy currentUserId từ token nếu có (để check like status)
                Guid? currentUserId = null;
                if (User?.Identity?.IsAuthenticated == true)
                {
                    try
                    {
                        currentUserId = GetUserIdFromToken();
                    }
                    catch
                    {
                        // Nếu không lấy được userId, giữ null (public access)
                    }
                }

                var response = await _postService.GetPostsAsync(Guid.Empty, finalStatusId, currentUserId);

                if (response.IsSuccess) return Ok(response);
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