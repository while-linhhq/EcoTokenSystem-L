using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Application.Services;
using EcoTokenSystem.Domain.Entities;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EcoTokenSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ItemsController : ControllerBase
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
        [Route("{userId:Guid}/{itemId:Guid}")]
        public async Task<IActionResult> ChangeItems([FromRoute]Guid userId, [FromRoute] Guid itemId)
        {
            try
            {
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
    }
}
