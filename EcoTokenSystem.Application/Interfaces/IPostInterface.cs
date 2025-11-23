using EcoTokenSystem.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Interfaces
{
    public interface IPostInterface
    {
        Task<ResponseDTO> CreatePostAsync(Guid userId, PostCreateRequestDTO request);
        Task<ResponseDTO> ApproveRejectPost(Guid id ,ApproveAndRejectPostDTO request);

        Task<ResponseDTO<List<PostsDTO>>> GetPostsAsync(Guid userId, int? statusId);
    }
}
