using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.DTOs
{
    public class ApproveAndRejectPostDTO
    {
        [Required]
        public int StatusId { get; set; }
        public int awardedPoints { get; set; } = 0;

        public string RejectReason { get; set; } = null;
    }
}
