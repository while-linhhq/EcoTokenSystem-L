using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Domain.Entities
{
    public class User
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string PasswordHash { get; set; } = string.Empty;  

        // --- Role (FK) ---
        public int RoleId { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }  
        public string Gender { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;

        public int CurrentPoints { get; set; } = 0;
        public int Streak { get; set; } = 0;  
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // --- Navigation Properties (Quan hệ 1-N) ---

        public Role Role { get; set; }  

        public ICollection<Post> Posts { get; set; } = new List<Post>();
        public ICollection<PointHistory> PointsHistory { get; set; } = new List<PointHistory>();

        public ICollection<ItemsHistory> ItemsHistory { get; set; } = new List<ItemsHistory>();

        //// Quan hệ 1-N: User (Admin) duyệt nhiều bài đăng
        public ICollection<Post> PostsApproved { get; set; } = new List<Post>();

        //// Quan hệ 1-N: User (Admin) tạo nhiều giao dịch điểm
        public ICollection<PointHistory> TransactionsMade { get; set; } = new List<PointHistory>();

        // Like and Comment relationships
        public ICollection<Like> Likes { get; set; } = new List<Like>();
        public ICollection<Comment> Comments { get; set; } = new List<Comment>();

        // Story relationship
        public ICollection<Story> Stories { get; set; } = new List<Story>();
    }
}
