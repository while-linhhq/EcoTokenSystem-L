using EcoTokenSystem.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.DTOs
{
    public class PointHistoryDTO
    {
        public Guid UserId { get; set; }
        public Guid? PostId { get; set; }
        public Guid? AdminId { get; set; }
        public int PointsChange { get; set; }
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
    }
}
