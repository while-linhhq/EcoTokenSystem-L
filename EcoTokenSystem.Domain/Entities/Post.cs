using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Domain.Entities
{
    public class Post
    {
        public Guid Id { get; set; }
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

        // --- Navigation Properties ---
        public User User { get; set; }
        public PostStatus Status { get; set; }
        public User? Admin { get; set; }
        public ICollection<Like> Likes { get; set; } = new List<Like>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();  
    }
}
