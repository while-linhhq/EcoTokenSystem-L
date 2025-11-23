using EcoTokenSystem.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Interfaces
{
    public interface IPointsAndItems
    {
        Task<ResponseDTO<List<ItemsDTO>>> ItemsAsync();
        Task<ResponseDTO<List<PointHistoryDTO>>> ItemsHistoryAsync(Guid ?userId);
    }
}
