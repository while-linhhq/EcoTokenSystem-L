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
            try
            {
                // Tối ưu: Filter trước khi query database
                var historyQuery = dbContext.PointHistories.AsQueryable();
                
                if (userId.HasValue)
                {
                    historyQuery = historyQuery.Where(p => p.UserId == userId);
                }

                var historyDomain = await historyQuery
                    .OrderByDescending(h => h.TransactionDate)
                    .ToListAsync();

                if (historyDomain.Count == 0)
                {
                    return new ResponseDTO<List<PointHistoryDTO>>()
                    {
                        IsSuccess = true, // Đổi thành true vì không có data không phải lỗi
                        Message = "Không có lịch sử tặng điểm",
                        Data = new List<PointHistoryDTO>()
                    };
                }

                var historyList = historyDomain.Select(history => new PointHistoryDTO()
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
            catch (Exception ex)
            {
                return new ResponseDTO<List<PointHistoryDTO>>()
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi lấy lịch sử điểm: {ex.Message}",
                    Data = new List<PointHistoryDTO>()
                };
            }
        }
    }
}
