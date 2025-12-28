using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Domain.Entities;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Services
{
    public class CommentService : ICommentInterface
    {
        private readonly ApplicationDbContext _context;

        public CommentService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ResponseDTO<CommentDTO>> CreateCommentAsync(Guid userId, Guid postId, CommentCreateRequestDTO request)
        {
            try
            {
                // Check if post exists
                var post = await _context.Posts.FindAsync(postId);
                if (post == null)
                {
                    return new ResponseDTO<CommentDTO>
                    {
                        IsSuccess = false,
                        Message = "Bài viết không tồn tại"
                    };
                }

                // Validate content
                if (string.IsNullOrWhiteSpace(request.Content))
                {
                    return new ResponseDTO<CommentDTO>
                    {
                        IsSuccess = false,
                        Message = "Nội dung bình luận không được để trống"
                    };
                }

                // Create comment
                var comment = new Comment
                {
                    Id = Guid.NewGuid(),
                    PostId = postId,
                    UserId = userId,
                    Content = request.Content.Trim(),
                    CreatedAt = DateTime.UtcNow
                };

                _context.Comments.Add(comment);
                await _context.SaveChangesAsync();

                // Load user info for response
                var user = await _context.Users.FindAsync(userId);
                var commentDto = new CommentDTO
                {
                    Id = comment.Id,
                    PostId = comment.PostId,
                    UserId = comment.UserId,
                    UserName = user?.Name ?? "Người dùng",
                    Content = comment.Content,
                    CreatedAt = comment.CreatedAt
                };

                return new ResponseDTO<CommentDTO>
                {
                    IsSuccess = true,
                    Message = "Bình luận đã được thêm thành công",
                    Data = commentDto
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO<CommentDTO>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi thêm bình luận: {ex.Message}"
                };
            }
        }

        public async Task<ResponseDTO<List<CommentDTO>>> GetPostCommentsAsync(Guid postId)
        {
            try
            {
                var comments = await _context.Comments
                    .Include(c => c.User)
                    .Where(c => c.PostId == postId)
                    .OrderBy(c => c.CreatedAt)
                    .Select(c => new CommentDTO
                    {
                        Id = c.Id,
                        PostId = c.PostId,
                        UserId = c.UserId,
                        UserName = c.User.Name,
                        Content = c.Content,
                        CreatedAt = c.CreatedAt
                    })
                    .ToListAsync();

                return new ResponseDTO<List<CommentDTO>>
                {
                    IsSuccess = true,
                    Message = "Lấy danh sách bình luận thành công",
                    Data = comments
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO<List<CommentDTO>>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi lấy danh sách bình luận: {ex.Message}",
                    Data = new List<CommentDTO>()
                };
            }
        }

        public async Task<ResponseDTO> DeleteCommentAsync(Guid commentId, Guid userId)
        {
            try
            {
                var comment = await _context.Comments.FindAsync(commentId);
                if (comment == null)
                {
                    return new ResponseDTO
                    {
                        IsSuccess = false,
                        Message = "Bình luận không tồn tại"
                    };
                }

                // Check if user is the owner of the comment
                if (comment.UserId != userId)
                {
                    return new ResponseDTO
                    {
                        IsSuccess = false,
                        Message = "Bạn không có quyền xóa bình luận này"
                    };
                }

                _context.Comments.Remove(comment);
                await _context.SaveChangesAsync();

                return new ResponseDTO
                {
                    IsSuccess = true,
                    Message = "Đã xóa bình luận thành công"
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi xóa bình luận: {ex.Message}"
                };
            }
        }
    }
}

