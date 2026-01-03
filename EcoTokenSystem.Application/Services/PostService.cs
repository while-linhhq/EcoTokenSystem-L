using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Domain.Entities;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http; // Cần IFormFile
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
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
        private readonly IStorageService _storageService;
        private readonly ILogger<PostService> _logger;
        // Giữ nguyên hằng số Max File Size
        private const long MaxFileSize = 5 * 1024 * 1024;
        private const int ApprovedStatusId = 2; // Dùng hằng số để dễ bảo trì
        private const int PendingStatusId = 1; // Pending status
        private const int RejectedStatusId = 3; // Rejected status

        public PostService(ApplicationDbContext context, IStorageService storageService, ILogger<PostService> logger)
        {
            _context = context;
            _storageService = storageService;
            _logger = logger;
        }

        // --- HÀM PRIVATE: XỬ LÝ FILE UPLOAD ---
        private async Task<string> SaveNewImageAsync(IFormFile imageFile)
        {
            return await _storageService.UploadImageAsync(imageFile, "posts");
        }

        // --- 1. TẠO BÀI ĐĂNG (CreatePostAsync) ---
        // Sửa: Lấy UserId từ tham số
        public async Task<ResponseDTO> CreatePostAsync(Guid userId, PostCreateRequestDTO request)
        {
            _logger.LogInformation($"[CreatePostAsync] Bắt đầu tạo post cho userId: {userId}, Title: {request.Title?.Substring(0, Math.Min(50, request.Title?.Length ?? 0))}");

            // Validate input
            if (string.IsNullOrWhiteSpace(request.Title))
            {
                _logger.LogWarning("[CreatePostAsync] Title rỗng");
                return new ResponseDTO { IsSuccess = false, Message = "Tiêu đề không được để trống." };
            }

            if (string.IsNullOrWhiteSpace(request.Content))
            {
                _logger.LogWarning("[CreatePostAsync] Content rỗng");
                return new ResponseDTO { IsSuccess = false, Message = "Nội dung không được để trống." };
            }

            string? imageUrl = null;
            if (request.ImageFile != null)
            {
                try
                {
                    _logger.LogInformation($"[CreatePostAsync] Đang upload image, size: {request.ImageFile.Length} bytes");
                    imageUrl = await SaveNewImageAsync(request.ImageFile);
                    _logger.LogInformation($"[CreatePostAsync] Upload image thành công: {imageUrl}");
                }
                catch (InvalidOperationException ex)
                {
                    _logger.LogError(ex, "[CreatePostAsync] Lỗi upload image");
                    return new ResponseDTO { IsSuccess = false, Message = ex.Message };
                }
            }

            // Tạo post với StatusId = 1 (Pending) - BẮT BUỘC
            var newPost = new Post
            {
                Id = Guid.NewGuid(),
                Title = request.Title.Trim(),
                Content = request.Content.Trim(),
                ImageUrl = imageUrl,
                UserId = userId, // Dùng UserId từ Token
                StatusId = PendingStatusId, // 1: Pending - BẮT BUỘC phải là Pending để moderator duyệt
                SubmittedAt = DateTime.UtcNow,
                AwardedPoints = 0, // Chưa có điểm vì chưa được duyệt
                AdminId = null, // Chưa có admin duyệt
                ApprovedRejectedAt = null, // Chưa được xử lý
                RejectionReason = null // Chưa bị từ chối
            };

            _logger.LogInformation($"[CreatePostAsync] Tạo post object với StatusId = {newPost.StatusId} (Pending), PostId: {newPost.Id}");

            try
            {
                await _context.Posts.AddAsync(newPost);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"[CreatePostAsync] Đã save post vào database, PostId: {newPost.Id}");

                // Verify post was created with correct status
                var savedPost = await _context.Posts
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == newPost.Id);

                if (savedPost == null)
                {
                    _logger.LogError($"[CreatePostAsync] Không tìm thấy post sau khi save, PostId: {newPost.Id}");
                    return new ResponseDTO { IsSuccess = false, Message = "Lỗi: Không thể tìm thấy post sau khi tạo." };
                }

                _logger.LogInformation($"[CreatePostAsync] Post đã được lưu với StatusId = {savedPost.StatusId}, PostId: {savedPost.Id}");

                if (savedPost.StatusId != PendingStatusId)
                {
                    _logger.LogError($"[CreatePostAsync] LỖI: Post được tạo với StatusId = {savedPost.StatusId} thay vì {PendingStatusId} (Pending). PostId: {savedPost.Id}");
                    return new ResponseDTO
                    {
                        IsSuccess = false,
                        Message = $"Lỗi: Post được tạo với StatusId = {savedPost.StatusId} thay vì {PendingStatusId} (Pending). PostId: {savedPost.Id}"
                    };
                }

                _logger.LogInformation($"[CreatePostAsync] ✅ Post được tạo thành công với StatusId = {PendingStatusId} (Pending), PostId: {savedPost.Id}");
                return new ResponseDTO
                {
                    IsSuccess = true,
                    Message = "Bài đăng đã được gửi chờ duyệt."
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"[CreatePostAsync] Exception khi tạo post: {ex.Message}");
                return new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi tạo bài đăng: {ex.Message}"
                };
            }
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
                _logger.LogInformation($"[ApproveRejectPostAsync] Approving post {postId}, AwardedPoints: {request.AwardedPoints}");

                if (request.AwardedPoints <= 0)
                {
                    _logger.LogWarning($"[ApproveRejectPostAsync] AwardedPoints <= 0: {request.AwardedPoints}");
                    return new ResponseDTO { IsSuccess = false, Message = "Điểm thưởng phải lớn hơn 0 khi duyệt bài." };
                }

                postDomain.AwardedPoints = request.AwardedPoints;

                // ✅ SỬA LỖI STREAK: Lưu post vào DB TRƯỚC KHI tính streak
                // Để query trong UpdateUserStreakAsync có thể thấy post mới được approve
                _context.Posts.Update(postDomain);
                await _context.SaveChangesAsync();
                _logger.LogInformation($"[ApproveRejectPostAsync] Saved post {postId} with ApprovedRejectedAt before calculating streak");

                // A. CẬP NHẬT ĐIỂM
                var oldPoints = authorDomain.CurrentPoints;
                authorDomain.CurrentPoints += request.AwardedPoints;
                _logger.LogInformation($"[ApproveRejectPostAsync] Updating user {authorDomain.Id} points: {oldPoints} + {request.AwardedPoints} = {authorDomain.CurrentPoints}");
                _context.Users.Update(authorDomain);

                // B. GHI LỊCH SỬ ĐIỂM
                var pointHistory = new PointHistory
                {
                    Id = Guid.NewGuid(),
                    UserId = authorDomain.Id,
                    AdminId = adminId, // Dùng AdminId từ tham số
                    PostId = postDomain.Id,
                    PointsChange = request.AwardedPoints,
                    TransactionDate = DateTime.UtcNow
                };
                await _context.PointHistories.AddAsync(pointHistory);
                _logger.LogInformation($"[ApproveRejectPostAsync] Added PointHistory: {pointHistory.Id}, PointsChange: {pointHistory.PointsChange}");

                // C. XỬ LÝ LOGIC STREAK (sau khi post đã được lưu vào DB)
                await UpdateUserStreakAsync(authorDomain); // Bây giờ query sẽ bao gồm post mới được approve

                // LƯU CÁC THAY ĐỔI CÒN LẠI: points, pointHistory, streak
                await _context.SaveChangesAsync();
                _logger.LogInformation($"[ApproveRejectPostAsync] Saved user points, pointHistory, and streak updates");
            }
            else if (request.StatusId == 3) // REJECT (3)
            {
                postDomain.RejectionReason = request.RejectReason;
                _context.Posts.Update(postDomain);
                await _context.SaveChangesAsync();
            }

            return new ResponseDTO()
            {
                IsSuccess = true,
                Message = request.StatusId == ApprovedStatusId ? "Duyệt bài thành công và điểm đã được cộng!" : "Từ chối bài viết thành công"
            };
        }

        // --- 3. LOGIC STREAK (UpdateUserStreakAsync) ---
        private async Task UpdateUserStreakAsync(User userDomain)
        {
            var today = DateTime.UtcNow.Date;
            var yesterday = today.AddDays(-1);

            // Lấy tất cả các ngày unique có bài được duyệt, sắp xếp giảm dần (mới nhất trước)
            var approvedDates = await _context.Posts
                .Where(p => p.UserId == userDomain.Id && p.StatusId == ApprovedStatusId && p.ApprovedRejectedAt.HasValue)
                .Select(p => p.ApprovedRejectedAt.Value.Date)
                .Distinct()
                .OrderByDescending(d => d)
                .ToListAsync();

            if (approvedDates == null || !approvedDates.Any())
            {
                // Trường hợp không có bài nào được duyệt, streak = 0
                userDomain.Streak = 0;
                _context.Users.Update(userDomain);
                return;
            }

            var mostRecentDate = approvedDates[0];
            int daysSinceMostRecent = (today - mostRecentDate).Days;

            // Chỉ tính streak nếu ngày gần nhất là hôm nay hoặc hôm qua
            // Nếu ngày gần nhất cách quá xa (hơn 1 ngày), streak = 0 (không còn streak liên tiếp)
            if (daysSinceMostRecent > 1)
            {
                // Bài được duyệt cách quá xa, không còn streak liên tiếp
                userDomain.Streak = 0;
                _context.Users.Update(userDomain);
                return;
            }

            // Tính số ngày liên tiếp từ ngày gần nhất ngược lại về quá khứ
            int streak = 1; // Bắt đầu từ 1 (ngày gần nhất)
            
            // Bắt đầu từ ngày đầu tiên (gần nhất)
            DateTime currentDate = mostRecentDate;
            
            // Đếm số ngày liên tiếp
            for (int i = 1; i < approvedDates.Count; i++)
            {
                DateTime nextDate = approvedDates[i];
                int daysDiff = (currentDate - nextDate).Days;
                
                if (daysDiff == 1)
                {
                    // Ngày liên tiếp, tăng streak
                    streak++;
                    currentDate = nextDate;
                }
                else
                {
                    // Bị đứt quãng, dừng lại
                    break;
                }
            }

            userDomain.Streak = streak;
            _context.Users.Update(userDomain);
        }

        // --- 4. XEM BÀI ĐĂNG CÓ ĐIỀU KIỆN (GetPostsAsync) ---
        // Giữ nguyên logic IQueryable linh hoạt
        // Nếu userId = Guid.Empty: Lấy tất cả posts (public posts)
        // Nếu userId != Guid.Empty: Lấy posts của user đó
        public async Task<ResponseDTO<List<PostsDTO>>> GetPostsAsync(Guid userId, int? statusId, Guid? currentUserId = null)
        {
            IQueryable<Post> postsQuery;

            // Nếu userId = Guid.Empty, lấy tất cả posts (public)
            if (userId == Guid.Empty)
            {
                postsQuery = _context.Posts.AsQueryable();
            }
            else
            {
                postsQuery = _context.Posts.Where(post => post.UserId.Equals(userId)).AsQueryable();
            }

            if (statusId.HasValue)
            {
                postsQuery = postsQuery.Where(post => post.StatusId.Equals(statusId.Value));
            }

            var postsDomain = await postsQuery
                .Include(p => p.User) // Include User để lấy thông tin user
                .Include(p => p.Likes) // Include Likes
                .Include(p => p.Comments) // Include Comments
                    .ThenInclude(c => c.User) // Include User for each Comment
                .OrderByDescending(p => p.ApprovedRejectedAt ?? p.SubmittedAt) // Sắp xếp mới nhất trước
                .ToListAsync();

            // Get all post IDs to check likes in one query (chỉ khi có posts)
            var postIds = postsDomain.Select(p => p.Id).ToList();
            var userLikes = currentUserId.HasValue && postIds.Any()
                ? await _context.Likes
                    .Where(l => l.UserId == currentUserId.Value && postIds.Contains(l.PostId))
                    .Select(l => l.PostId)
                    .ToListAsync()
                : new List<Guid>();

            var postsDtoList = postsDomain.Select(post => new PostsDTO
            {
                Id = post.Id, // Thêm Id
                Title = post.Title,
                Content = post.Content,
                ImageUrl = post.ImageUrl,
                UserId = post.UserId, // Dùng post.UserId thay vì userId parameter
                StatusId = post.StatusId,
                AdminId = post.AdminId,
                AwardedPoints = post.AwardedPoints,
                SubmittedAt = post.SubmittedAt,
                ApprovedRejectedAt = post.ApprovedRejectedAt,
                RejectionReason = post.RejectionReason,
                // Thêm thông tin User nếu có
                UserName = post.User?.Name ?? string.Empty,
                // Phân biệt avatar: nếu là URL (http/https) hoặc base64 (data:image) → UserAvatarImage, còn lại (emoji) → UserAvatar
                UserAvatar = !string.IsNullOrEmpty(post.User?.Avatar) && 
                             !post.User.Avatar.StartsWith("data:image") && 
                             !post.User.Avatar.StartsWith("http://") && 
                             !post.User.Avatar.StartsWith("https://") 
                             ? post.User.Avatar : "🌱", // Emoji default nếu là URL hoặc base64
                UserAvatarImage = !string.IsNullOrEmpty(post.User?.Avatar) && 
                                 (post.User.Avatar.StartsWith("data:image") || 
                                  post.User.Avatar.StartsWith("http://") || 
                                  post.User.Avatar.StartsWith("https://")) 
                                 ? post.User.Avatar : null,
                // Like and Comment information
                LikesCount = post.Likes?.Count ?? 0,
                Comments = post.Comments?.Select(c => new CommentDTO
                {
                    Id = c.Id,
                    PostId = c.PostId,
                    UserId = c.UserId,
                    UserName = c.User?.Name ?? "Người dùng",
                    // Phân biệt avatar: nếu là URL (http/https) hoặc base64 (data:image) → UserAvatarImage, còn lại (emoji) → UserAvatar
                    UserAvatar = !string.IsNullOrEmpty(c.User?.Avatar) && 
                                 !c.User.Avatar.StartsWith("data:image") && 
                                 !c.User.Avatar.StartsWith("http://") && 
                                 !c.User.Avatar.StartsWith("https://") 
                                 ? c.User.Avatar : "🌱", // Emoji default nếu là URL hoặc base64
                    UserAvatarImage = !string.IsNullOrEmpty(c.User?.Avatar) && 
                                     (c.User.Avatar.StartsWith("data:image") || 
                                      c.User.Avatar.StartsWith("http://") || 
                                      c.User.Avatar.StartsWith("https://")) 
                                     ? c.User.Avatar : null,
                    Content = c.Content,
                    CreatedAt = c.CreatedAt
                }).ToList() ?? new List<CommentDTO>(),
                IsLikedByCurrentUser = currentUserId.HasValue && userLikes.Contains(post.Id)
            }).ToList();

            return new ResponseDTO<List<PostsDTO>>
            {
                IsSuccess = true,
                Message = postsDtoList.Any()
                    ? "Lấy danh sách bài đăng thành công."
                    : "Không có bài đăng nào phù hợp.",
                Data = postsDtoList
            };
        }

    }
}
