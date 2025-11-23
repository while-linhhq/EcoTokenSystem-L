using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Domain.Entities;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Services
{
    public class PointsAndItemsServices : IPointsAndItems
    {
        private readonly ApplicationDbContext dbContext;

        public PointsAndItemsServices(ApplicationDbContext dbContext)
        {
            this.dbContext = dbContext;
        }
        public async  Task<ResponseDTO<List<ItemsDTO>>> ItemsAsync()
        {
            var itemsDomain = await dbContext.Items.ToListAsync();
            if (itemsDomain.Count==0)
            {
                return new ResponseDTO<List<ItemsDTO>>()
                {
                    IsSuccess = false,
                    Message = "Không có sản phẩm nào",
                    Data = new List<ItemsDTO>()
                };
            }
            var itemsDtoList = itemsDomain.Select(item => new ItemsDTO
            {
                Id = item.Id,
                Name = item.Name,
                ImageUrl = item.ImageUrl,
                RequiredPoints = item.RequiredPoints
            }).ToList();

            return new ResponseDTO<List<ItemsDTO>>()  
            {
                IsSuccess = true,
                Message = "Danh sách sản phẩm đổi quà",
                Data = itemsDtoList  
            };
        }

        public async Task<ResponseDTO<List<PointHistoryDTO>>> ItemsHistoryAsync(Guid ?userId)
        {
            

            var historyDomain  = await  dbContext.PointHistories.ToListAsync();
            if (historyDomain.Count == 0)
            {
                return new ResponseDTO<List<PointHistoryDTO>>()
                {
                    IsSuccess = false,
                    Message = "Không cólịch sử đổi quà",
                    Data = new List<PointHistoryDTO>()
                };
            }

            var historyQuery = historyDomain.ToList().AsQueryable();
            if (userId.HasValue)
            {
                historyQuery = historyDomain.Where(p => p.UserId.Equals(userId)).AsQueryable();
            }

            var historyList = historyQuery.Select(history => new PointHistoryDTO()
            {
                UserId = history.UserId,
                PostId = history.PostId,
                AdminId = history.AdminId,
                PointsChange = history.PointsChange,
                TransactionDate = history.TransactionDate
            }).ToList();

            return new ResponseDTO<List<PointHistoryDTO>>() 
            {
                IsSuccess = true,
                Message = "Lịch sử đổi điểm",
                Data = historyList
            };

        }
    }
}
