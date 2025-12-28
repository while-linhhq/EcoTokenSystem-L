using Azure;
//using EcoTokenSystem.API.DTOs;
using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Application.Services;
using EcoTokenSystem.Domain.Entities;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.Linq;
using System.Security.Claims;

namespace EcoTokenSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class UserController : ControllerBase
    {
        private readonly ApplicationDbContext dbContext;
        private readonly IUserInterface userService;

        public UserController(ApplicationDbContext dbContext, IUserInterface userService)
        {
            this.dbContext = dbContext;
            this.userService = userService;
        }
        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequestDTO request)
        {
            if(!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var response =await userService.RegisterAsync(request);
                if(response.IsSuccess) return Ok(response);
                else return BadRequest(response);
            }
            catch(Exception ex)
            {
                return BadRequest(ex);
            }
        }

        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            try
            {
                var response = await userService.LoginAsync(request);
                return Ok(response);
            }
            catch (Exception ex) 
            { 
                // Log lỗi chi tiết
                return StatusCode(500, new ResponseDTO 
                { 
                    IsSuccess = false, 
                    Message = "Lỗi Server khi đăng nhập: " + ex.Message + (ex.InnerException != null ? " Chi tiết: " + ex.InnerException.Message : "")
                });
            }

        }

        [HttpPost("change-password")]
        [Authorize]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDTO request )
        {
            try
            {
                Guid userId = GetUserIdFromToken();
                var response = await userService.ChangePasswordAsync(request, userId);
                return Ok(response);
            }
            catch (UnauthorizedAccessException ex)
            {
                // Xử lý lỗi nếu Token không chứa User ID (dù [Authorize] đã chặn)
                return Unauthorized(ex.Message);
            }
            catch (Exception ex)
            {
                // Xử lý lỗi Server chung
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = "Lỗi Server: " + ex.Message });
            }

        }

        [HttpGet("me")]
        [Authorize] // Cần authorize để lấy token
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                Guid userId = GetUserIdFromToken();
                var response = await userService.GetProfileAsync(userId);
                if (response.IsSuccess) return Ok(response.Data);  
                else return NotFound(response);
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

        [HttpPatch("me")]
        [Authorize] // Cần authorize để lấy token
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDTO request)
        {

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            try
            {
                Guid userId = GetUserIdFromToken();
                var response = await userService.UpdateProfileAsync(request, userId);
                if (response.IsSuccess) return Ok(response);
                else return BadRequest(response);
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

        [HttpGet("leaderboard")]
        public async Task<IActionResult> GetLeaderboard([FromQuery] string sortBy = "tokens", [FromQuery] int? limit = null)
        {
            try
            {
                IQueryable<LeaderboardDTO> query = dbContext.Users
                    .Where(u => u.RoleId == 1) // Only regular users, exclude Admin/Moderator
                    .Select(u => new LeaderboardDTO
                    {
                        UserId = u.Id,
                        UserName = u.Name,
                        CurrentPoints = u.CurrentPoints,
                        Streak = u.Streak,
                        Rank = 0 // Will be set after materialization
                    });

                // Sort by streak or tokens
                if (sortBy?.ToLower() == "streak")
                {
                    query = query.OrderByDescending(u => u.Streak)
                                 .ThenByDescending(u => u.CurrentPoints);
                }
                else // Default: sort by tokens
                {
                    query = query.OrderByDescending(u => u.CurrentPoints)
                                 .ThenByDescending(u => u.Streak);
                }

                // Apply limit if specified, otherwise return all
                if (limit.HasValue && limit.Value > 0)
                {
                    query = query.Take(limit.Value);
                }

                var topUsers = await query.ToListAsync();

                // Set rank after materialization
                for (int i = 0; i < topUsers.Count; i++)
                {
                    topUsers[i].Rank = i + 1;
                }

                return Ok(new ResponseDTO<List<LeaderboardDTO>>
                {
                    IsSuccess = true,
                    Message = "Lấy bảng xếp hạng thành công",
                    Data = topUsers
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO<List<LeaderboardDTO>>
                {
                    IsSuccess = false,
                    Message = "Lỗi Server: " + ex.Message,
                    Data = new List<LeaderboardDTO>()
                });
            }
        }

        [HttpGet("me/posts")]
        [Authorize]  
        public async Task<IActionResult> GetMyPosts([FromQuery] int? statusId)
        {
            try
            {
                Guid userId = GetUserIdFromToken();
                var response = await userService.UserPostsAsync(userId, statusId);

                if (response.IsSuccess) return Ok(response.Data);
                else return NotFound(response);
            }
            catch (UnauthorizedAccessException)
            {
                return Unauthorized("Token không hợp lệ hoặc thiếu User ID.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = "Lỗi Server: " + ex.Message });
            }
        }

        // Admin: Get all users
        [HttpGet("all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var response = await userService.GetAllUsersAsync();
                if (response.IsSuccess) return Ok(response);
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = "Lỗi Server: " + ex.Message });
            }
        }

        // Admin: Update user
        [HttpPatch("{userId:Guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminUpdateUser([FromRoute] Guid userId, [FromBody] AdminUpdateUserDTO request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var response = await userService.AdminUpdateUserAsync(userId, request);
                if (response.IsSuccess) return Ok(response);
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = "Lỗi Server: " + ex.Message });
            }
        }

        // Admin: Create user (có thể dùng để tạo moderator)
        [HttpPost("admin/create")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminCreateUser([FromBody] RegisterRequestDTO request, [FromQuery] int roleId = 1)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            try
            {
                var response = await userService.AdminCreateUserAsync(request, roleId);
                if (response.IsSuccess) return Ok(response);
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = "Lỗi Server: " + ex.Message });
            }
        }

        // Admin: Delete user
        [HttpDelete("{userId:Guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AdminDeleteUser([FromRoute] Guid userId)
        {
            try
            {
                var response = await userService.AdminDeleteUserAsync(userId);
                if (response.IsSuccess) return Ok(response);
                return BadRequest(response);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new ResponseDTO { IsSuccess = false, Message = "Lỗi Server: " + ex.Message });
            }
        }

        protected Guid GetUserIdFromToken()
        {
            // User là property của ControllerBase, chứa Claims từ Token đã xác thực
            var userIdClaim = User.FindFirstValue(System.Security.Claims.ClaimTypes.NameIdentifier);
            // Trong TokenService, bạn đã gán UserId vào ClaimTypes.NameIdentifier (hoặc JwtRegisteredClaimNames.Sub)

            if (Guid.TryParse(userIdClaim, out Guid userId))
            {
                return userId;
            }
            // Ném Exception hoặc xử lý lỗi nếu không tìm thấy ID (không nên xảy ra nếu đã [Authorize])
            throw new UnauthorizedAccessException("Không tìm thấy User ID trong Token.");
        }
    }
}
