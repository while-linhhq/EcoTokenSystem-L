using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Domain.Entities
{
    public class ItemsHistory
    {
        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid ItemId { get; set; }
        public DateTime RedemptionDate { get; set; } = DateTime.UtcNow;
        public bool IsShipped { get; set; } = false;
        public Items Item { get; set; } 
        public User User { get; set; }
    }
}
