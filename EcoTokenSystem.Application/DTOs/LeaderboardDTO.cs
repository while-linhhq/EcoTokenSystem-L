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
        
        [JsonPropertyName("currentPoints")]
        public int CurrentPoints { get; set; }
        
        [JsonPropertyName("streak")]
        public int Streak { get; set; }
        
        [JsonPropertyName("rank")]
        public int Rank { get; set; }
    }
}

