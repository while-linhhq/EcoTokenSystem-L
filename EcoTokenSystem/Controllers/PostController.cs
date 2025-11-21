using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace EcoTokenSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PostController : ControllerBase
    {
        private readonly IPostInterface _postService;

        public PostController(IPostInterface postService)
        {
            _postService = postService;
        }

        [HttpPost]
        [Consumes("multipart/form-data")]
        [Route("{id:Guid}")]

        public async Task<IActionResult> CreatePost([FromRoute] Guid id,[FromForm] PostCreateRequestDTO request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            //Guid userId = new Guid("F3E09F3D-6A2A-47C1-80F1-622ABCE815CA");  

            var response = await _postService.CreatePostAsync(id, request);

            if (response.IsSuccess)
            {
                return CreatedAtAction(nameof(CreatePost), response);
            }
            return BadRequest(response);
        }

        [HttpPatch]
        [Route("{id:Guid}")]
        public async Task<IActionResult> ApprovePost([FromRoute] Guid id, [FromBody] ApproveAndRejectPostDTO request)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            try
            {
                var response = await _postService.ApproveRejectPost(id, request);
                return Ok(response);
            }
            catch (Exception ex) { 
                return BadRequest(ex);
            }
        }
    }
}
