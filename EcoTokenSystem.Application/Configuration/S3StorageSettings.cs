namespace EcoTokenSystem.Application.Configuration
{
    public class S3StorageSettings
    {
        public string Region { get; set; } = "us-east-1";
        public string BucketName { get; set; } = string.Empty;
        public string CloudFrontDomain { get; set; } = string.Empty;
        public bool UseS3Storage { get; set; } = false;
    }
}
