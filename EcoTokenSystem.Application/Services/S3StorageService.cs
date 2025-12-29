using Amazon.S3;
using Amazon.S3.Model;
using Amazon.S3.Transfer;
using EcoTokenSystem.Application.Configuration;
using EcoTokenSystem.Application.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace EcoTokenSystem.Application.Services
{
    public class S3StorageService : IStorageService
    {
        private readonly IAmazonS3 _s3Client;
        private readonly S3StorageSettings _settings;
        private readonly ILogger<S3StorageService> _logger;
        private const long MaxFileSize = 5 * 1024 * 1024; // 5MB

        private static readonly HashSet<string> AllowedExtensions = new()
        {
            ".jpg", ".jpeg", ".png", ".gif", ".webp"
        };

        public S3StorageService(
            IAmazonS3 s3Client,
            IOptions<S3StorageSettings> settings,
            ILogger<S3StorageService> logger)
        {
            _s3Client = s3Client;
            _settings = settings.Value;
            _logger = logger;
        }

        public async Task<string> UploadImageAsync(IFormFile imageFile, string folder)
        {
            if (imageFile == null || imageFile.Length == 0)
                throw new InvalidOperationException("File không hợp lệ.");

            if (imageFile.Length > MaxFileSize)
                throw new InvalidOperationException("Dung lượng tệp tối đa là 5MB.");

            var extension = Path.GetExtension(imageFile.FileName).ToLowerInvariant();
            if (!AllowedExtensions.Contains(extension))
                throw new InvalidOperationException($"Chỉ chấp nhận: {string.Join(", ", AllowedExtensions)}");

            // Generate key: posts/guid.jpg or items/guid.jpg
            var fileName = $"{Guid.NewGuid()}{extension}";
            var key = $"{folder.TrimEnd('/')}/{fileName}";

            try
            {
                _logger.LogInformation($"[S3] Uploading {key}, size: {imageFile.Length} bytes");

                var putRequest = new PutObjectRequest
                {
                    BucketName = _settings.BucketName,
                    Key = key,
                    InputStream = imageFile.OpenReadStream(),
                    ContentType = imageFile.ContentType
                };
                putRequest.Headers.CacheControl = "public, max-age=31536000, immutable";

                await _s3Client.PutObjectAsync(putRequest);

                // Return CloudFront URL
                var publicUrl = !string.IsNullOrEmpty(_settings.CloudFrontDomain)
                    ? $"https://{_settings.CloudFrontDomain}/{key}"
                    : $"https://{_settings.BucketName}.s3.{_settings.Region}.amazonaws.com/{key}";

                _logger.LogInformation($"[S3] Uploaded: {publicUrl}");
                return publicUrl;
            }
            catch (AmazonS3Exception ex)
            {
                _logger.LogError(ex, $"[S3] Error uploading {key}");
                throw new InvalidOperationException($"Lỗi upload S3: {ex.Message}", ex);
            }
        }

        public async Task DeleteImageAsync(string? imageUrl)
        {
            if (string.IsNullOrWhiteSpace(imageUrl) || !IsCloudUrl(imageUrl))
                return;

            try
            {
                var uri = new Uri(imageUrl);
                var key = uri.AbsolutePath.TrimStart('/');

                _logger.LogInformation($"[S3] Deleting {key}");

                await _s3Client.DeleteObjectAsync(new DeleteObjectRequest
                {
                    BucketName = _settings.BucketName,
                    Key = key
                });
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, $"[S3] Error deleting {imageUrl}");
            }
        }

        public bool IsCloudUrl(string? url)
        {
            if (string.IsNullOrWhiteSpace(url)) return false;
            return url.Contains(".s3.") ||
                   url.Contains(".cloudfront.net") ||
                   (!string.IsNullOrEmpty(_settings.CloudFrontDomain) && url.Contains(_settings.CloudFrontDomain));
        }
    }
}
