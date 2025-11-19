using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Domain.Entities
{
    public class PostStatus
    {
        public int Id { get; set; }  
        public string Name { get; set; } = string.Empty; // "Pending", "Approved", "Rejected"
        public ICollection<Post> Posts { get; set; }  
    }
}
