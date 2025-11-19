using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Domain.Entities
{
    public class PointHistory
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid? PostId { get; set; }
        public Guid? AdminId { get; set; }
        public int PointsChange { get; set; }
        public DateTime TransactionDate { get; set; } = DateTime.UtcNow;
        public User User { get; set; }
        public Post? Post { get; set; }
        public User? Admin { get; set; }
    }
}
