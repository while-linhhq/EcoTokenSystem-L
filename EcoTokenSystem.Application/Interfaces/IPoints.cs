using EcoTokenSystem.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Interfaces
{
    public interface IPoints
    {
        Task<ResponseDTO<List<PointHistoryDTO>>> PointsHistoryAsync(Guid? userId);
    }
}
