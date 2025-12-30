using EcoTokenSystem.Application.Interfaces;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace EcoTokenSystem.Application.Services
{
    /// <summary>
    /// Legacy filesystem-based storage service for backward compatibility
    /// </summary>
    public class FileSystemStorageService : IStorageService
    {
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly ILogger<FileSystemStorageService> _logger;
        private const long MaxFileSize = 5 * 1024 * 1024;

        public FileSystemStorageService(
            IWebHostEnvironment webHostEnvironment,
            ILogger<FileSystemStorageService> logger)
        {
            _webHostEnvironment = webHostEnvironment;
            _logger = logger;
        }

        public async Task<string> UploadImageAsync(IFormFile imageFile, string folder)
        {
            if (imageFile.Length > MaxFileSize)
                throw new InvalidOperationException("Dung lượng tệp tối đa là 5MB.");

            var uploadFolder = folder == "posts" ? "images" : "imagesItem";
            var uploadPath = Path.Combine(_webHostEnvironment.WebRootPath, uploadFolder);

            if (!Directory.Exists(uploadPath))
                Directory.CreateDirectory(uploadPath);

            var extension = Path.GetExtension(imageFile.FileName);
            var uniqueFileName = Guid.NewGuid().ToString() + extension;
            var filePath = Path.Combine(uploadPath, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(fileStream);
            }

            _logger.LogInformation($"[FileSystem] Uploaded {uniqueFileName} to {uploadFolder}");
            return $"/{uploadFolder}/{uniqueFileName}";
        }

        public Task DeleteImageAsync(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl) || IsCloudUrl(imageUrl))
                return Task.CompletedTask;

            try
            {
                var filePath = Path.Combine(_webHostEnvironment.WebRootPath, imageUrl.TrimStart('/'));
                if (File.Exists(filePath))
                {
                    File.Delete(filePath);
                    _logger.LogInformation($"[FileSystem] Deleted {imageUrl}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"[FileSystem] Error deleting {imageUrl}");
            }

            return Task.CompletedTask;
        }

        public bool IsCloudUrl(string? url) =>
            !string.IsNullOrWhiteSpace(url) && (url.StartsWith("http://") || url.StartsWith("https://"));
    }
}
