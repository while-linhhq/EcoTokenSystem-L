using Microsoft.AspNetCore.Http;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.DTOs
{
    public class UpdateItemRequestDTO
    {
        [Required]
        public string Name { get; set; } = string.Empty;
        [Required]
        [Range(1, int.MaxValue, ErrorMessage = "Điểm yêu cầu phải lớn hơn 0.")]
        public int RequiredPoints { get; set; }
        public IFormFile? ImageItem { get; set; }
    }
}
