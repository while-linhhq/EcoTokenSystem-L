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
            catch (Exception ex) { 
                return BadRequest(ex);
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
