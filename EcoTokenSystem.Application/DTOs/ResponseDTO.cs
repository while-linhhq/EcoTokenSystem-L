using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.DTOs
{
    public class ResponseDTO
    {
        public bool IsSuccess { get; set; }

        public string Message { get; set; }

        //public object? Data { get; set; }
    }
    public class ResponseDTO<T>
    {
        public bool IsSuccess { get; set; }
        public string Message { get; set; }
        public T? Data { get; set; } 
    }
}
