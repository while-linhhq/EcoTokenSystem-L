using System.ComponentModel.DataAnnotations;

namespace EcoTokenSystem.Application.DTOs
{
    public class UpdateProfileRequestDTO
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
        [Required]
        public DateOnly? DateOfBirth { get; set; }
        [Required]
        public string Gender { get; set; } = string.Empty;
        [Required]
        [MaxLength(11)]
        public string PhoneNumber { get; set; } = string.Empty;
        [Required]
        public string Address { get; set; } = string.Empty;
    }
}
