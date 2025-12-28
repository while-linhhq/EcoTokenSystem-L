using EcoTokenSystem.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Interfaces
{
    public interface IItemsInterface
    {
        Task<ResponseDTO<List<ItemsDTO>>> ItemsAsync();

        Task<ResponseDTO> ChangeItemsAsync(Guid userId, Guid itemId);

        Task<ResponseDTO> AddItemsAsync(AddItemRequestDTO request);

        Task<ResponseDTO> DeleteItemAsync(Guid itemId);

        Task<ResponseDTO> UpdateItemAsync(Guid itemId,UpdateItemRequestDTO request);

        Task<ResponseDTO<List<ItemsHistoryDTO>>> GetItemsHistoryAsync(Guid userId);
    }
}
