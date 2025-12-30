using System;
using System.Collections.Generic;

namespace EcoTokenSystem.Domain.Entities
{
    public class Story
    {
        public Guid Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;

        public Guid UserId { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime ExpiresAt { get; set; } // Auto-calculated as CreatedAt + 24 hours

        // Track who viewed this story (stored as JSON array or separate table)
        public List<Guid> Viewers { get; set; } = new List<Guid>();
        public int ViewCount { get; set; } = 0;

        // Navigation Properties
        public User User { get; set; }
    }
}
