using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.DTOs
{
    public class ApproveAndRejectPostDTO : IValidatableObject
    {
        [Required]
        public int StatusId { get; set; }
        
        [JsonPropertyName("awardedPoints")]
        public int AwardedPoints { get; set; } = 0;

        public string? RejectReason { get; set; }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            // RejectReason chỉ required khi StatusId = 3 (Reject)
            if (StatusId == 3 && string.IsNullOrWhiteSpace(RejectReason))
            {
                yield return new ValidationResult(
                    "Lý do từ chối là bắt buộc khi từ chối bài viết.",
                    new[] { nameof(RejectReason) }
                );
            }

            // AwardedPoints phải > 0 khi StatusId = 2 (Approve)
            if (StatusId == 2 && AwardedPoints <= 0)
            {
                yield return new ValidationResult(
                    "Điểm thưởng phải lớn hơn 0 khi duyệt bài viết.",
                    new[] { nameof(AwardedPoints) }
                );
            }
        }
    }
}
