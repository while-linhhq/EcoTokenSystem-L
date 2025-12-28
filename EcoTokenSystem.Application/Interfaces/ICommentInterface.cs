using EcoTokenSystem.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Interfaces
{
    public interface ICommentInterface
    {
        Task<ResponseDTO<CommentDTO>> CreateCommentAsync(Guid userId, Guid postId, CommentCreateRequestDTO request);
        Task<ResponseDTO<List<CommentDTO>>> GetPostCommentsAsync(Guid postId);
        Task<ResponseDTO> DeleteCommentAsync(Guid commentId, Guid userId);
    }
}

