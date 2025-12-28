using System;

namespace EcoTokenSystem.Application.DTOs
{
    public class UserListDTO
    {
        public Guid Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Gender { get; set; } = string.Empty;
        public DateTime? DateOfBirth { get; set; }
        public string RoleName { get; set; } = string.Empty;
        public int RoleId { get; set; }
        public int CurrentPoints { get; set; }
        public int Streak { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}

