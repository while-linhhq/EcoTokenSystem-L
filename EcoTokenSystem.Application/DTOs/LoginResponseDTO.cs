namespace EcoTokenSystem.Application.DTOs
{
    public class LoginResponseDTO
    {
        //public bool IsSuccess { get; set; }

        //public string Message { get; set; }
        public Guid? UserId { get; set; }
        public string? Username { get; set; }
        public string? RoleName { get; set; }
        public int? CurrentPoints { get; set; }
        public string? Token { get; set; }
        public int? RoleId { get; set; }
    }
}
