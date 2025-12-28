using EcoTokenSystem.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Interfaces
{
    public interface ILikeInterface
    {
        Task<ResponseDTO> ToggleLikeAsync(Guid userId, Guid postId);
        Task<ResponseDTO<List<LikeDTO>>> GetPostLikesAsync(Guid postId);
    }
}

