using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Domain.Entities;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http; // Cần IFormFile
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Services
{
    public class PostService : IPostInterface
    {
        private readonly ApplicationDbContext _context;
        private readonly IWebHostEnvironment _webHostEnvironment;
        // Giữ nguyên hằng số Max File Size
        private const long MaxFileSize = 5 * 1024 * 1024;
        private const int ApprovedStatusId = 2; // Dùng hằng số để dễ bảo trì

        public PostService(ApplicationDbContext context, IWebHostEnvironment webHostEnvironment)
        {
            _context = context;
            _webHostEnvironment = webHostEnvironment;
        }

        // --- HÀM PRIVATE: XỬ LÝ FILE UPLOAD ---
        private async Task<string> SaveNewImageAsync(IFormFile imageFile)
        {
            if (imageFile.Length > MaxFileSize)
            {
                throw new InvalidOperationException("Dung lượng tệp tối đa là 5MB.");
            }

            string uploadFolder = Path.Combine(_webHostEnvironment.WebRootPath, "images"); // Thư mục chung
            if (!Directory.Exists(uploadFolder))
            {
                Directory.CreateDirectory(uploadFolder);
            }

            // Khắc phục LỖI BẢO MẬT: Tạo tên file DUY NHẤT bằng GUID
            string extension = Path.GetExtension(imageFile.FileName);
            string uniqueFileName = Guid.NewGuid().ToString() + extension;
            string filePath = Path.Combine(uploadFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(fileStream);
            }

            return $"/images/{uniqueFileName}";
        }

        // --- 1. TẠO BÀI ĐĂNG (CreatePostAsync) ---
        // Sửa: Lấy UserId từ tham số
        public async Task<ResponseDTO> CreatePostAsync(Guid userId, PostCreateRequestDTO request)
        {
            string? imageUrl = null;
            if (request.ImageFile != null)
            {
                try
                {
                    imageUrl = await SaveNewImageAsync(request.ImageFile);
                }
                catch (InvalidOperationException ex)
                {
                    // Bắt lỗi kích thước file từ hàm private
                    return new ResponseDTO { IsSuccess = false, Message = ex.Message };
                }
            }

            var newPost = new Post
            {
                Id = Guid.NewGuid(),
                Title = request.Title,
                Content = request.Content,
                ImageUrl = imageUrl,
                UserId = userId, // Dùng UserId từ Token
                StatusId = 1, // 1: Pending
                SubmittedAt = DateTime.UtcNow
            };

            await _context.Posts.AddAsync(newPost);
            await _context.SaveChangesAsync();

            return new ResponseDTO { IsSuccess = true, Message = "Bài đăng đã được gửi chờ duyệt." };
        }

        // --- 2. DUYỆT/TỪ CHỐI BÀI ĐĂNG (ApproveRejectPost) ---
        // Sửa: Nhận AdminId từ tham số (ID từ Token)
        public async Task<ResponseDTO> ApproveRejectPostAsync(Guid postId, ApproveAndRejectPostDTO request, Guid adminId)
        {
            var postDomain = await _context.Posts.FindAsync(postId);
            if (postDomain == null)
            {
                return new ResponseDTO { IsSuccess = false, Message = "Lỗi khi lấy id bài đăng" };
            }

            // Kiểm tra bài đã được xử lý chưa
            if (postDomain.StatusId != 1)
            {
                return new ResponseDTO { IsSuccess = false, Message = "Bài viết đã được xử lý trước đó." };
            }

            var authorDomain = await _context.Users.FirstOrDefaultAsync(u => u.Id == postDomain.UserId);
            if (authorDomain == null)
            {
                // Nên có cơ chế log lỗi, nhưng vẫn trả về lỗi người dùng
                return new ResponseDTO { IsSuccess = false, Message = "Không tìm thấy tác giả bài viết." };
            }

            // Cập nhật các trường bắt buộc
            postDomain.StatusId = request.StatusId;
            postDomain.ApprovedRejectedAt = DateTime.UtcNow;
            postDomain.AdminId = adminId; // Gán AdminId từ tham số (Token)

            if (request.StatusId == ApprovedStatusId) // APPROVE (2)
            {
                if (request.awardedPoints <= 0)
                {
                    return new ResponseDTO { IsSuccess = false, Message = "Điểm thưởng phải lớn hơn 0 khi duyệt bài." };
                }

                postDomain.AwardedPoints = request.awardedPoints;

                // A. CẬP NHẬT ĐIỂM
                authorDomain.CurrentPoints += request.awardedPoints;
                _context.Users.Update(authorDomain);

                // B. GHI LỊCH SỬ ĐIỂM
                var pointHistory = new PointHistory
                {
                    Id = Guid.NewGuid(),
                    UserId = authorDomain.Id,
                    AdminId = adminId, // Dùng AdminId từ tham số
                    PostId = postDomain.Id,
                    PointsChange = request.awardedPoints,
                    TransactionDate = DateTime.UtcNow
                };
                await _context.PointHistories.AddAsync(pointHistory);

                // C. XỬ LÝ LOGIC STREAK
                await UpdateUserStreakAsync(authorDomain); // Bỏ qua SubmittedAt, dùng ApprovedAt/UtcNow
            }
            else if (request.StatusId == 3) // REJECT (3)
            {
                postDomain.RejectionReason = request.RejectReason;
            }

            // LƯU TRANSACTION DUY NHẤT
            _context.Posts.Update(postDomain);
            await _context.SaveChangesAsync();

            return new ResponseDTO()
            {
                IsSuccess = true,
                Message = request.StatusId == ApprovedStatusId ? "Duyệt bài thành công và điểm đã được cộng!" : "Từ chối bài viết thành công"
            };
        }

        // --- 3. LOGIC STREAK (UpdateUserStreakAsync) ---
        private async Task UpdateUserStreakAsync(User userDomain)
        {
            var currentApprovedDate = DateTime.UtcNow.Date;

            // 1. Tìm ngày ApprovedRejectedAt gần nhất của User
            // Lấy 2 bài gần nhất để so sánh (bài vừa duyệt, và bài trước đó)
            var lastApprovedPostDate = await _context.Posts
                .Where(p => p.UserId == userDomain.Id && p.StatusId == ApprovedStatusId)
                .OrderByDescending(p => p.ApprovedRejectedAt)
                .Select(p => p.ApprovedRejectedAt)
                .FirstOrDefaultAsync();

            // 2. Xử lý logic Streak

            // Kiểm tra và lấy giá trị Date, nếu nó có giá trị
            DateTime? previousApprovedDate = lastApprovedPostDate?.Date;

            if (!previousApprovedDate.HasValue)
            {
                // Trường hợp lần đầu được duyệt thành công
                userDomain.Streak = 1;
            }
            else
            {
                // Bây giờ đã chắc chắn previousApprovedDate có giá trị (DateTime)
                var previousDate = previousApprovedDate.Value; // Lấy giá trị DateTime
                var timeDifference = currentApprovedDate - previousDate;

                if (timeDifference.Days == 1)
                {
                    // Duyệt liên tiếp 1 ngày
                    userDomain.Streak += 1;
                }
                else if (timeDifference.Days > 1)
                {
                    // Bị đứt quãng
                    userDomain.Streak = 1;
                }
                // timeDifference.Days == 0: Giữ nguyên Streak
            }

            _context.Users.Update(userDomain);
        }

        // --- 4. XEM BÀI ĐĂNG CÓ ĐIỀU KIỆN (GetPostsAsync) ---
        // Giữ nguyên logic IQueryable linh hoạt
        public async Task<ResponseDTO<List<PostsDTO>>> GetPostsAsync(Guid userId, int? statusId)
        {
            var postsQuery = _context.Posts.Where(post => post.UserId.Equals(userId)).AsQueryable();
            //var postsQuery = _context.Posts.AsQueryable();
            if (statusId.HasValue)
            {
                postsQuery = postsQuery.Where(post => post.StatusId.Equals(statusId.Value));
            }

            var postsDomain = await postsQuery.ToListAsync();

            if (!postsDomain.Any())
            {
                return new ResponseDTO<List<PostsDTO>>
                {
                    IsSuccess = false,
                    Message = "Không có bài đăng nào phù hợp.",
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
                AdminId = post.AdminId,
                AwardedPoints = post.AwardedPoints,
                SubmittedAt = post.SubmittedAt,
                ApprovedRejectedAt = post.ApprovedRejectedAt,
                RejectionReason = post.RejectionReason
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