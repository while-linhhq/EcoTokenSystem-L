using Microsoft.AspNetCore.Http;

namespace EcoTokenSystem.Application.Interfaces
{
    public interface IStorageService
    {
        /// <summary>
        /// Uploads an image file and returns the public URL
        /// </summary>
        /// <param name="imageFile">The image file to upload</param>
        /// <param name="folder">The folder path (e.g., "posts" or "items")</param>
        /// <returns>Public URL to access the image</returns>
        Task<string> UploadImageAsync(IFormFile imageFile, string folder);

        /// <summary>
        /// Deletes an image from storage
        /// </summary>
        /// <param name="imageUrl">The URL or path of the image to delete</param>
        Task DeleteImageAsync(string? imageUrl);

        /// <summary>
        /// Checks if a URL is an S3/CloudFront URL
        /// </summary>
        bool IsCloudUrl(string? url);
    }
}
