namespace EcoTokenSystem.Application.DTOs
{
    public class LoginResponseDTO
    {
        public bool IsSuccess { get; set; }

        public string Message { get; set; }
        public Guid? UserId { get; set; }
        public string? Username { get; set; }
        public int? RoleId { get; set; }
    }
}
