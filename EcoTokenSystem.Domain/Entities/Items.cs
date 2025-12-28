using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Domain.Entities
{
    public class Items
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string ImageUrl { get; set; }
        public int RequiredPoints { get; set; }
        public string Tag { get; set; } = "handmade"; // Default tag: handmade, vouchers, books, movies, donations
        public ICollection<ItemsHistory> RedemptionHistory { get; set; } = new List<ItemsHistory>();
    }
}
