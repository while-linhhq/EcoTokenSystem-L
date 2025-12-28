using System.ComponentModel.DataAnnotations;

namespace EcoTokenSystem.Application.DTOs
{
    public class CommentCreateRequestDTO
    {
        [Required(ErrorMessage = "Nội dung bình luận không được để trống")]
        [MinLength(1, ErrorMessage = "Nội dung bình luận phải có ít nhất 1 ký tự")]
        public string Content { get; set; } = string.Empty;
    }
}

