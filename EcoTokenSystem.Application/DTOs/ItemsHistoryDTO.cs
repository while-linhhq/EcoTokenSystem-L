using System;

namespace EcoTokenSystem.Application.DTOs
{
    public class ItemsHistoryDTO
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid ItemId { get; set; }
        public DateTime RedemptionDate { get; set; }
        
        // Item details (from navigation property)
        public string ItemName { get; set; } = string.Empty;
        public string ItemImageUrl { get; set; } = string.Empty;
        public int ItemRequiredPoints { get; set; }
        
        // User details (optional, for admin view)
        public string UserName { get; set; } = string.Empty;
    }
}

