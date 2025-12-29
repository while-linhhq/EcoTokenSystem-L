using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Http;

namespace EcoTokenSystem.Application.DTOs
{
    /// <summary>
    /// Story response DTO - returned to client
    /// </summary>
    public class StoryDTO
    {
        public Guid Id { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserAvatar { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime ExpiresAt { get; set; }
        public List<Guid> Viewers { get; set; } = new List<Guid>();
        public int ViewCount { get; set; }
    }

    /// <summary>
    /// Story upload request DTO
    /// </summary>
    public class StoryUploadRequestDTO
    {
        public IFormFile Image { get; set; } = null!;
    }

    /// <summary>
    /// Story view request DTO
    /// </summary>
    public class StoryViewRequestDTO
    {
        public Guid ViewerId { get; set; }
    }
}
