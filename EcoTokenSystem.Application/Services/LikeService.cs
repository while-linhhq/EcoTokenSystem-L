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
    public class LikeService : ILikeInterface
    {
        private readonly ApplicationDbContext _context;

        public LikeService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ResponseDTO> ToggleLikeAsync(Guid userId, Guid postId)
        {
            try
            {
                // Check if post exists
                var post = await _context.Posts.FindAsync(postId);
                if (post == null)
                {
                    return new ResponseDTO
                    {
                        IsSuccess = false,
                        Message = "Bài viết không tồn tại"
                    };
                }

                // Check if like already exists
                var existingLike = await _context.Likes
                    .FirstOrDefaultAsync(l => l.PostId == postId && l.UserId == userId);

                if (existingLike != null)
                {
                    // Remove like
                    _context.Likes.Remove(existingLike);
                    await _context.SaveChangesAsync();
                    return new ResponseDTO
                    {
                        IsSuccess = true,
                        Message = "Đã bỏ thích bài viết"
                    };
                }
                else
                {
                    // Add like
                    var newLike = new Like
                    {
                        Id = Guid.NewGuid(),
                        PostId = postId,
                        UserId = userId,
                        CreatedAt = DateTime.UtcNow
                    };
                    _context.Likes.Add(newLike);
                    await _context.SaveChangesAsync();
                    return new ResponseDTO
                    {
                        IsSuccess = true,
                        Message = "Đã thích bài viết"
                    };
                }
            }
            catch (Exception ex)
            {
                return new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi thực hiện thích/bỏ thích: {ex.Message}"
                };
            }
        }

        public async Task<ResponseDTO<List<LikeDTO>>> GetPostLikesAsync(Guid postId)
        {
            try
            {
                var likes = await _context.Likes
                    .Include(l => l.User)
                    .Where(l => l.PostId == postId)
                    .OrderByDescending(l => l.CreatedAt)
                    .Select(l => new LikeDTO
                    {
                        Id = l.Id,
                        PostId = l.PostId,
                        UserId = l.UserId,
                        UserName = l.User.Name,
                        CreatedAt = l.CreatedAt
                    })
                    .ToListAsync();

                return new ResponseDTO<List<LikeDTO>>
                {
                    IsSuccess = true,
                    Message = "Lấy danh sách lượt thích thành công",
                    Data = likes
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO<List<LikeDTO>>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi lấy danh sách lượt thích: {ex.Message}",
                    Data = new List<LikeDTO>()
                };
            }
        }
    }
}

