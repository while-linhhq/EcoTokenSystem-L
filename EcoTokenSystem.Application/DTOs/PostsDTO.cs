using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.DTOs
{
    public class PostsDTO
    {
        public Guid Id { get; set; } // Thêm Id để frontend có thể identify post
        public string Title { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public string? ImageUrl { get; set; }


        public Guid UserId { get; set; }
        public int StatusId { get; set; }
        public Guid? AdminId { get; set; }
        public int AwardedPoints { get; set; } = 0; // Số điểm Admin cộng
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public DateTime? ApprovedRejectedAt { get; set; }
        public string? RejectionReason { get; set; }
        
        // Thông tin User (cho Moderator/Admin xem)
        public string UserName { get; set; } = string.Empty;
        public string UserAvatar { get; set; } = string.Empty;
        public string? UserAvatarImage { get; set; }

        // Like and Comment information
        public int LikesCount { get; set; } = 0;
        public List<CommentDTO> Comments { get; set; } = new List<CommentDTO>();
        public bool IsLikedByCurrentUser { get; set; } = false;
    }
}
