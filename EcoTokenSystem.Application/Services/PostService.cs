using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Domain.Entities;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Services
{
    public class PostService : IPostInterface
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private const long MaxFileSize = 5 * 1024 * 1024; 
        public PostService(ApplicationDbContext context, IWebHostEnvironment webHostEnvironment)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
        }

        public async Task<ResponseDTO> CreatePostAsync(Guid userId, PostCreateRequestDTO request)
        {
            string? imageUrl = null;
            if (request.ImageFile != null)
            {
                if (request.ImageFile.Length > MaxFileSize)
                {
                    return new ResponseDTO { IsSuccess = false, Message = "Dung lượng tệp tối đa là 5MB." };
                }

                // Tạo thư mục Images nếu chưa có
                string uploadFolder = Path.Combine(_webHostEnvironment.WebRootPath, "images");
                if (!Directory.Exists(uploadFolder))
                {
                    Directory.CreateDirectory(uploadFolder);
                }

                // Tạo tên file duy nhất
                string uniqueFileName = Guid.NewGuid().ToString() + "_" + request.ImageFile.FileName;
                string filePath = Path.Combine(uploadFolder, uniqueFileName);

                // Lưu file vào thư mục wwwroot/images
                using (var fileStream = new FileStream(filePath, FileMode.Create))
                {
                    await request.ImageFile.CopyToAsync(fileStream);
                }

                // Tạo URL để lưu vào DB (ví dụ: /images/ten_file.jpg)
                imageUrl = "/images/" + uniqueFileName;
            }

            // 2. TẠO ENTITY POST
            var newPost = new Post
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Content = request.Content,
                ImageUrl = imageUrl,
                UserId = userId, 
                StatusId = 1, 
                SubmittedAt = DateTime.UtcNow
            };

            await _context.Posts.AddAsync(newPost);
            await _context.SaveChangesAsync();

            return new ResponseDTO { IsSuccess = true, Message = "Bài đăng đã được gửi chờ duyệt." };
        }

        public async Task<ResponseDTO> ApproveRejectPost(Guid id  ,ApproveAndRejectPostDTO request)
        {
            var postDomain = await  _context.Posts.FindAsync(id);
            if (postDomain == null)
            {
                return new ResponseDTO
                {
                    IsSuccess = false,
                    Message = "Lỗi khi lấy id bài đăng"
                };
            }

            
            if (request.StatusId == 2)//approve
            {
                postDomain.AwardedPoints = request.awardedPoints;
                var authorDomain = await _context.Users.FirstOrDefaultAsync(u => u.Id == postDomain.UserId);
                if (authorDomain != null)
                {
                    authorDomain.CurrentPoints += request.awardedPoints;
                    _context.Users.Update(authorDomain);
                    await _context.SaveChangesAsync();
                    var pointHistory = new PointHistory
                    {
                        Id = Guid.NewGuid(),
                        UserId = authorDomain.Id,
                        AdminId = new Guid("F3E09F3D-6A2A-47C1-80F1-622ABCE815CA"),
                        PostId = postDomain.Id,
                        PointsChange = request.awardedPoints,
                        TransactionDate = DateTime.UtcNow
                    };
                    await _context.PointHistories.AddAsync(pointHistory);
                }
            }
            else if (request.StatusId == 3)
            {
                postDomain.RejectionReason = request.RejectReason;
            }
            postDomain.StatusId = request.StatusId;
            postDomain.AdminId = new Guid("F3E09F3D-6A2A-47C1-80F1-622ABCE815CA");
            postDomain.ApprovedRejectedAt = DateTime.UtcNow;
            _context.Posts.Update(postDomain);
            await _context.SaveChangesAsync();

            return new ResponseDTO()
            {
                IsSuccess = true,
                Message = request.StatusId == 2 ?"Duyệt bài thành công" : "Từ chối bài viết thành công"
            };
        }

        public async Task<ResponseDTO<List<PostsDTO>>> GetPostsAsync(Guid userId, int? statusId)
        {
            
            var postsQuery =  _context.Posts.Where(post => post.UserId.Equals(userId)).AsQueryable();
            if (statusId.HasValue)
            {
                postsQuery = postsQuery.Where(post => post.StatusId.Equals(statusId.Value));
             }

            var postsDomain = await postsQuery.ToListAsync();

            if (postsDomain == null || !postsDomain.Any())
            {
                return new ResponseDTO<List<PostsDTO>>
                {
                    IsSuccess = false,
                    Message = "Người dùng không có bài đăng nào phù hợp với trạng thái",
                    Data = new List<PostsDTO>()
                };
            }

            var postsDtoList = postsDomain.Select(post => new PostsDTO
            {
                Title = post.Title,
                Content = post.Content,
                ImageUrl = post.ImageUrl,
                UserId = userId,
                StatusId = post.StatusId,
                AdminId = new Guid("F3E09F3D-6A2A-47C1-80F1-622ABCE815CA"),
                AwardedPoints = post.AwardedPoints,
                SubmittedAt = post.SubmittedAt,
                ApprovedRejectedAt = post.ApprovedRejectedAt,
                RejectionReason  = post.RejectionReason
            }).ToList();

            return new ResponseDTO<List<PostsDTO>>
            {
                IsSuccess = true,
                Message = "Lấy danh sách bài đăng thành công.",
                Data = postsDtoList
            };
        }
    }
}
