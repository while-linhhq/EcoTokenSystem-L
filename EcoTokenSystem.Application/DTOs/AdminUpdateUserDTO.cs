using System;
using System.ComponentModel.DataAnnotations;

namespace EcoTokenSystem.Application.DTOs
{
    public class AdminUpdateUserDTO
    {
        public string? Name { get; set; }
        public string? PhoneNumber { get; set; }
        public string? Address { get; set; }
        public string? Gender { get; set; }
        public DateOnly? DateOfBirth { get; set; }
        public int? CurrentPoints { get; set; }
        public int? Streak { get; set; }
        public int? RoleId { get; set; }
    }
}

