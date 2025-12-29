using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Application.Services;
using EcoTokenSystem.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EcoTokenSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemsController : BaseController
    {
        private readonly IItemsInterface pointsAndItemsService;

        public ItemsController(IItemsInterface pointsAndItemsService)
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

        [HttpPost]
        [Route("{itemId:Guid}")]
        [Authorize(Roles = "User,Admin")]
        public async Task<IActionResult> ChangeItems( [FromRoute] Guid itemId)
        {
            try
            {
                Guid userId = GetUserIdFromToken();
                var response = await pointsAndItemsService.ChangeItemsAsync(userId,itemId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        //[Consumes("multipart/form-data")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> AddItem([FromForm] AddItemRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest();
            }
            try
            {
                var response = await pointsAndItemsService.AddItemsAsync(request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
        [HttpDelete]
        [Route("{itemId:Guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteItem([FromRoute] Guid itemId)
        {
            
            try
            {
                var response = await pointsAndItemsService.DeleteItemAsync(itemId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }


        [HttpPatch]
        [Route("{itemId:Guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateItem([FromRoute] Guid itemId,[FromForm] UpdateItemRequestDTO request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest();
            }
            try
            {
                var response = await pointsAndItemsService.UpdateItemAsync(itemId,request);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        [Route("history")]
        [Authorize]
        public async Task<IActionResult> GetItemsHistory()
        {
            try
            {
                Guid userId = GetUserIdFromToken();
                var response = await pointsAndItemsService.GetItemsHistoryAsync(userId);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet]
        [Route("history/all")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAllItemsHistory()
        {
            try
            {
                var response = await pointsAndItemsService.GetAllItemsHistoryAsync();
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPatch]
        [Route("history/{historyId:Guid}/shipped")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateShippedStatus([FromRoute] Guid historyId, [FromBody] bool isShipped)
        {
            try
            {
                var response = await pointsAndItemsService.UpdateItemsHistoryShippedStatusAsync(historyId, isShipped);
                return Ok(response);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }
}
