using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.DTOs
{
    public class ItemsDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string ImageUrl { get; set; }
        public int RequiredPoints { get; set; }
        public string Tag { get; set; } = "handmade";
    }
}
