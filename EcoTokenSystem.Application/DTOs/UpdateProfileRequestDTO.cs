using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace EcoTokenSystem.Application.DTOs
{
    public class UpdateProfileRequestDTO
    {
        public string? Name { get; set; }
        public string? Email { get; set; }

        // Avatar image file upload (multipart/form-data)
        public IFormFile? Avatar { get; set; }

        // Avatar emoji selection (for emoji avatars)
        public string? AvatarEmoji { get; set; }

        public DateOnly? DateOfBirth { get; set; }
        public string? Gender { get; set; }
        [MaxLength(11)]
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
    }
}
