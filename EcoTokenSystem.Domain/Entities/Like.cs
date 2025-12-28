using System;

namespace EcoTokenSystem.Domain.Entities
{
    public class Like
    {
        public Guid Id { get; set; }
        public Guid PostId { get; set; }
        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        // Navigation Properties
        public Post Post { get; set; }
        public User User { get; set; }
    }
}

