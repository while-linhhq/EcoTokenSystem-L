using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Domain.Entities;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Services
{
    public class StoryService : IStoryInterface
    {
        private readonly ApplicationDbContext _context;
        private readonly IStorageService _storageService;

        public StoryService(ApplicationDbContext context, IStorageService storageService)
        {
            _context = context;
            _storageService = storageService;
        }

        /// <summary>
        /// Get all active stories (within 24 hours)
        /// </summary>
        public async Task<ResponseDTO<List<StoryDTO>>> GetActiveStoriesAsync()
        {
            try
            {
                var now = DateTime.UtcNow;
                var cutoffTime = now.AddHours(-24);

                var stories = await _context.Stories
                    .Include(s => s.User)
                    .Where(s => s.CreatedAt >= cutoffTime)
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => new StoryDTO
                    {
                        Id = s.Id,
                        ImageUrl = s.ImageUrl,
                        UserId = s.UserId,
                        UserName = s.User.Name,
                        UserAvatar = s.User.Avatar,
                        CreatedAt = s.CreatedAt,
                        ExpiresAt = s.ExpiresAt,
                        Viewers = s.Viewers,
                        ViewCount = s.ViewCount
                    })
                    .ToListAsync();

                return new ResponseDTO<List<StoryDTO>>
                {
                    IsSuccess = true,
                    Message = "Lấy stories thành công",
                    Data = stories
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO<List<StoryDTO>>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi lấy stories: {ex.Message}",
                    Data = new List<StoryDTO>()
                };
            }
        }

        /// <summary>
        /// Get stories for a specific user
        /// </summary>
        public async Task<ResponseDTO<List<StoryDTO>>> GetUserStoriesAsync(Guid userId)
        {
            try
            {
                var now = DateTime.UtcNow;
                var cutoffTime = now.AddHours(-24);

                var stories = await _context.Stories
                    .Include(s => s.User)
                    .Where(s => s.UserId == userId && s.CreatedAt >= cutoffTime)
                    .OrderByDescending(s => s.CreatedAt)
                    .Select(s => new StoryDTO
                    {
                        Id = s.Id,
                        ImageUrl = s.ImageUrl,
                        UserId = s.UserId,
                        UserName = s.User.Name,
                        UserAvatar = s.User.Avatar,
                        CreatedAt = s.CreatedAt,
                        ExpiresAt = s.ExpiresAt,
                        Viewers = s.Viewers,
                        ViewCount = s.ViewCount
                    })
                    .ToListAsync();

                return new ResponseDTO<List<StoryDTO>>
                {
                    IsSuccess = true,
                    Message = "Lấy stories của user thành công",
                    Data = stories
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO<List<StoryDTO>>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi lấy stories: {ex.Message}",
                    Data = new List<StoryDTO>()
                };
            }
        }

        /// <summary>
        /// Upload a new story
        /// </summary>
        public async Task<ResponseDTO<StoryDTO>> UploadStoryAsync(Guid userId, StoryUploadRequestDTO request)
        {
            try
            {
                // Validate image
                if (request.Image == null || request.Image.Length == 0)
                {
                    return new ResponseDTO<StoryDTO>
                    {
                        IsSuccess = false,
                        Message = "Vui lòng chọn ảnh để đăng story",
                        Data = null
                    };
                }

                // Validate file type
                var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
                var fileExtension = Path.GetExtension(request.Image.FileName).ToLowerInvariant();
                if (!allowedExtensions.Contains(fileExtension))
                {
                    return new ResponseDTO<StoryDTO>
                    {
                        IsSuccess = false,
                        Message = "Chỉ chấp nhận file ảnh (.jpg, .jpeg, .png, .gif, .webp)",
                        Data = null
                    };
                }

                // Validate file size (max 5MB)
                if (request.Image.Length > 5 * 1024 * 1024)
                {
                    return new ResponseDTO<StoryDTO>
                    {
                        IsSuccess = false,
                        Message = "Kích thước ảnh không được vượt quá 5MB",
                        Data = null
                    };
                }

                // Verify user exists
                var user = await _context.Users.FindAsync(userId);
                if (user == null)
                {
                    return new ResponseDTO<StoryDTO>
                    {
                        IsSuccess = false,
                        Message = "Người dùng không tồn tại",
                        Data = null
                    };
                }

                // Upload image to storage
                var imageUrl = await _storageService.UploadImageAsync(request.Image, "stories");

                // Create story
                var now = DateTime.UtcNow;
                var story = new Story
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    ImageUrl = imageUrl,
                    CreatedAt = now,
                    ExpiresAt = now.AddHours(24),
                    Viewers = new List<Guid>(),
                    ViewCount = 0
                };

                _context.Stories.Add(story);
                await _context.SaveChangesAsync();

                // Return DTO
                var storyDto = new StoryDTO
                {
                    Id = story.Id,
                    ImageUrl = story.ImageUrl,
                    UserId = story.UserId,
                    UserName = user.Name,
                    UserAvatar = user.Avatar,
                    CreatedAt = story.CreatedAt,
                    ExpiresAt = story.ExpiresAt,
                    Viewers = story.Viewers,
                    ViewCount = story.ViewCount
                };

                return new ResponseDTO<StoryDTO>
                {
                    IsSuccess = true,
                    Message = "Đăng story thành công",
                    Data = storyDto
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO<StoryDTO>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi đăng story: {ex.Message}",
                    Data = null
                };
            }
        }

        /// <summary>
        /// Mark a story as viewed by a user
        /// </summary>
        public async Task<ResponseDTO<object>> ViewStoryAsync(Guid storyId, Guid viewerId)
        {
            try
            {
                var story = await _context.Stories.FindAsync(storyId);
                if (story == null)
                {
                    return new ResponseDTO<object>
                    {
                        IsSuccess = false,
                        Message = "Story không tồn tại",
                        Data = null
                    };
                }

                // Check if story is still active
                if (DateTime.UtcNow > story.ExpiresAt)
                {
                    return new ResponseDTO<object>
                    {
                        IsSuccess = false,
                        Message = "Story đã hết hạn",
                        Data = null
                    };
                }

                // Don't count owner's views
                if (story.UserId == viewerId)
                {
                    return new ResponseDTO<object>
                    {
                        IsSuccess = true,
                        Message = "Không tính lượt xem của chủ story",
                        Data = null
                    };
                }

                // Add viewer if not already viewed
                if (!story.Viewers.Contains(viewerId))
                {
                    story.Viewers.Add(viewerId);
                    story.ViewCount = story.Viewers.Count;

                    _context.Stories.Update(story);
                    await _context.SaveChangesAsync();
                }

                return new ResponseDTO<object>
                {
                    IsSuccess = true,
                    Message = "Đã đánh dấu đã xem story",
                    Data = new { ViewCount = story.ViewCount }
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO<object>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi đánh dấu story: {ex.Message}",
                    Data = null
                };
            }
        }

        /// <summary>
        /// Delete a story (only owner can delete)
        /// </summary>
        public async Task<ResponseDTO> DeleteStoryAsync(Guid storyId, Guid userId)
        {
            try
            {
                var story = await _context.Stories.FindAsync(storyId);
                if (story == null)
                {
                    return new ResponseDTO
                    {
                        IsSuccess = false,
                        Message = "Story không tồn tại"
                    };
                }

                // Only owner can delete
                if (story.UserId != userId)
                {
                    return new ResponseDTO
                    {
                        IsSuccess = false,
                        Message = "Bạn không có quyền xóa story này"
                    };
                }

                // Delete image from storage
                await _storageService.DeleteImageAsync(story.ImageUrl);

                // Delete story from database
                _context.Stories.Remove(story);
                await _context.SaveChangesAsync();

                return new ResponseDTO
                {
                    IsSuccess = true,
                    Message = "Xóa story thành công"
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi xóa story: {ex.Message}"
                };
            }
        }
    }
}
