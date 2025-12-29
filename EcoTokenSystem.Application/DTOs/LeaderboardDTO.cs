using System;
using System.Text.Json.Serialization;

namespace EcoTokenSystem.Application.DTOs
{
    public class LeaderboardDTO
    {
        [JsonPropertyName("userId")]
        public Guid UserId { get; set; }
        
        [JsonPropertyName("userName")]
        public string UserName { get; set; } = string.Empty;
        
        [JsonPropertyName("userAvatar")]
        public string UserAvatar { get; set; } = string.Empty;
        
        [JsonPropertyName("userAvatarImage")]
        public string? UserAvatarImage { get; set; }
        
        [JsonPropertyName("currentPoints")]
        public int CurrentPoints { get; set; }
        
        [JsonPropertyName("streak")]
        public int Streak { get; set; }
        
        [JsonPropertyName("rank")]
        public int Rank { get; set; }
    }
}

