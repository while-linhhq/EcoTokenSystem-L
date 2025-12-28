using System;

namespace EcoTokenSystem.Domain.Entities
{
    public class Config
    {
        public Guid Id { get; set; }
        public string Key { get; set; } = string.Empty; // "GiftPrices", "StreakMilestones", "ActionRewards"
        public string Value { get; set; } = string.Empty; // JSON string
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}

