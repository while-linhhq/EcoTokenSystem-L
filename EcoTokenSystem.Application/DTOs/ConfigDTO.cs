using System;
using System.Collections.Generic;

namespace EcoTokenSystem.Application.DTOs
{
    public class ConfigDTO
    {
        public Dictionary<string, int> GiftPrices { get; set; } = new Dictionary<string, int>();
        public Dictionary<string, StreakMilestoneDTO> StreakMilestones { get; set; } = new Dictionary<string, StreakMilestoneDTO>();
        public ActionRewardsDTO ActionRewards { get; set; } = new ActionRewardsDTO();
    }

    public class StreakMilestoneDTO
    {
        public string Color { get; set; } = string.Empty;
        public string Emoji { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
    }

    public class ActionRewardsDTO
    {
        public ActionRewardDTO Default { get; set; } = new ActionRewardDTO();
        public Dictionary<string, ActionRewardDTO> Tags { get; set; } = new Dictionary<string, ActionRewardDTO>();
    }

    public class ActionRewardDTO
    {
        public int Streak { get; set; } = 1;
        public int EcoTokens { get; set; } = 10;
    }

    public class UpdateGiftPriceRequestDTO
    {
        public string GiftId { get; set; } = string.Empty;
        public int Price { get; set; }
    }

    public class UpdateStreakMilestoneRequestDTO
    {
        public string Streak { get; set; } = string.Empty;
        public StreakMilestoneDTO Milestone { get; set; } = new StreakMilestoneDTO();
    }

    public class UpdateActionRewardRequestDTO
    {
        public string? Tag { get; set; } // null = update default
        public ActionRewardDTO Reward { get; set; } = new ActionRewardDTO();
    }
}

