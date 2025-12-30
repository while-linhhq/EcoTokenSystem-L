using EcoTokenSystem.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Interfaces
{
    public interface IStoryInterface
    {
        /// <summary>
        /// Get all active stories (within 24 hours)
        /// </summary>
        Task<ResponseDTO<List<StoryDTO>>> GetActiveStoriesAsync();

        /// <summary>
        /// Get stories for a specific user
        /// </summary>
        Task<ResponseDTO<List<StoryDTO>>> GetUserStoriesAsync(Guid userId);

        /// <summary>
        /// Upload a new story
        /// </summary>
        Task<ResponseDTO<StoryDTO>> UploadStoryAsync(Guid userId, StoryUploadRequestDTO request);

        /// <summary>
        /// Mark a story as viewed by a user
        /// </summary>
        Task<ResponseDTO<object>> ViewStoryAsync(Guid storyId, Guid viewerId);

        /// <summary>
        /// Delete a story (only owner can delete)
        /// </summary>
        Task<ResponseDTO> DeleteStoryAsync(Guid storyId, Guid userId);
    }
}
