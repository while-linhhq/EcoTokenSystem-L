using System.ComponentModel.DataAnnotations;

namespace EcoTokenSystem.Application.DTOs
{
    public class RegisterRequestDTO
    {
        [Required]
        public string Username { get; set; }

        [Required]
        [MinLength(8)]
        public string Password { get; set; }

        [Compare(nameof(Password))]
        public string PasswordConfirm { get; set; }

        // Optional name/nickname for admin creating users
        public string? Name { get; set; }
    }
}
