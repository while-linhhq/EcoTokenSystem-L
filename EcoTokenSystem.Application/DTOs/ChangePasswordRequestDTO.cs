using System.ComponentModel.DataAnnotations;

namespace EcoTokenSystem.Application.DTOs
{
    public class ChangePasswordRequestDTO
    {
        //public Guid UserId { get; set; }
        [Required]
        public string OldPassword { get; set; }
        [Required]
        [MinLength(8)]
        public string NewPassword { get; set; }
        [Required]
        [Compare(nameof(NewPassword))]
        public string NewPasswordConfirm { get; set; }
    }
}
