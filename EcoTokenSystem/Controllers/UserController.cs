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
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequestDTO request )
        {
            try
            {
                var response = await userService.ChangePasswordAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex);
            }

        }

        [HttpGet]
        [Route("{id:Guid}")]
        public async Task<IActionResult> GetProfile([FromRoute] Guid id)
        {
            try
            {
                var response = await userService.GetProfileAsync(id);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex);
            }
        }

        [HttpPatch]
        [Route("{id:Guid}")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequestDTO request, [FromRoute] Guid id)
        {

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            try
            {
                var response = await userService.UpdateProfileAsync(request,id);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex);
            }

        }
    }
}
