using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Services
{
    public class PointsService : IPoints
    {
        private readonly ApplicationDbContext dbContext;

        public PointsService(ApplicationDbContext dbContext)
        {
            this.dbContext = dbContext;
        }
        public async Task<ResponseDTO<List<PointHistoryDTO>>> PointsHistoryAsync(Guid? userId)
        {


            var historyDomain = await dbContext.PointHistories.ToListAsync();
            if (historyDomain.Count == 0)
            {
                return new ResponseDTO<List<PointHistoryDTO>>()
                {
                    IsSuccess = false,
                    Message = "Không có lịch sử tặng điểm",
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
                Message = "Lịch sử tặng điểm",
                Data = historyList
            };

        }
    }
}
