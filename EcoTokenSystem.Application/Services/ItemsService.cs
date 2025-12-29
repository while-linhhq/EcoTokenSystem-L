using EcoTokenSystem.Application.DTOs;
using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Domain.Entities;
using EcoTokenSystem.Infrastructure.Data;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Services
{
    public class ItemsService : IItemsInterface
    {
        private readonly ApplicationDbContext dbContext;
        private readonly IWebHostEnvironment webHostEnvironment;
        private const long MaxFileSize = 5 * 1024 * 1024;
        public ItemsService(ApplicationDbContext dbContext, IWebHostEnvironment webHostEnvironment)
        {
            this.dbContext = dbContext;
            this.webHostEnvironment = webHostEnvironment;
        }



        public async  Task<ResponseDTO<List<ItemsDTO>>> ItemsAsync()
        {
            try
            {
                var itemsDomain = await dbContext.Items.ToListAsync();

                // Luôn trả về IsSuccess = true, kể cả khi không có items
                // Frontend sẽ xử lý empty array
                var itemsDtoList = itemsDomain.Select(item => new ItemsDTO
                {
                    Id = item.Id,
                    Name = item.Name,
                    ImageUrl = item.ImageUrl,
                    RequiredPoints = item.RequiredPoints,
                    // Xử lý Tag có thể null (nếu migration chưa chạy)
                    Tag = item.Tag ?? "handmade"
                }).ToList();

                return new ResponseDTO<List<ItemsDTO>>()
                {
                    IsSuccess = true,
                    Message = itemsDtoList.Count > 0 ? "Danh sách sản phẩm đổi quà" : "Không có sản phẩm nào",
                    Data = itemsDtoList
                };
            }
            catch (Exception ex)
            {
                // Nếu có lỗi (ví dụ: column Tag chưa tồn tại), trả về empty list
                // Log lỗi để debug
                return new ResponseDTO<List<ItemsDTO>>()
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi lấy danh sách sản phẩm: {ex.Message}",
                    Data = new List<ItemsDTO>()
                };
            }
        }

        public async Task<ResponseDTO> ChangeItemsAsync(Guid userId, Guid itemId)
        {

            var userDomain = await dbContext.Users.FindAsync(userId);
            if(userDomain == null)
            {
                return new ResponseDTO()
                {
                    IsSuccess = false,
                    Message = "Lỗi khi lấy mã người dùng"
                };
            }
            var itemDomain = await dbContext.Items.FindAsync(itemId);
            if(itemDomain == null)
            {
                return new ResponseDTO()
                {
                    IsSuccess = false,
                    Message = "Lỗi khi lấy mã quà tặng"
                };
            }

            if(userDomain.CurrentPoints < itemDomain.RequiredPoints)
            {
                return new ResponseDTO()
                {
                    IsSuccess = false,
                    Message = "Số điểm hiện tại của bạn không đủ để đổi quà"
                };
            }

            userDomain.CurrentPoints -= itemDomain.RequiredPoints;

            //await dbContext.ItemsHistory
            var itemHistory = new ItemsHistory()
            {
                Id = Guid.NewGuid(),
                UserId = userDomain.Id,
                ItemId = itemId,
                RedemptionDate = DateTime.Now
            };
            await dbContext.ItemsHistory.AddAsync(itemHistory);
            await dbContext.SaveChangesAsync();
            return new ResponseDTO()
            {
                IsSuccess = true,
                Message = $"Bạn đã đổi {itemDomain.RequiredPoints} lấy món quà {itemDomain.Name}!"
            };
        }

        public async Task<ResponseDTO> AddItemsAsync(AddItemRequestDTO request)
        {
            var itemExists = await dbContext.Items.AnyAsync(i => i.Name == request.Name);

            if (itemExists)
            {
                return new ResponseDTO { IsSuccess = false, Message = $"Item '{request.Name}' đã tồn tại trong hệ thống." };
            }

            string? imageUrl = null;
            try
            {
                // 2. Xử lý File Upload (Gọi hàm private an toàn)
                if (request.ImageItem != null)
                {
                    imageUrl = await SaveNewImageAsync(request.ImageItem);
                }
            }
            catch (InvalidOperationException ex)
            {
                // Bắt lỗi kích thước file từ hàm private
                return new ResponseDTO { IsSuccess = false, Message = ex.Message };
            }

            // 3. Tạo Entity
            var item = new Items()
            {
                Id = Guid.NewGuid(),
                Name = request.Name,
                ImageUrl = imageUrl,
                RequiredPoints = request.RequiredPoints,
                Tag = request.Tag ?? "handmade"
            };

            // 4. Lưu vào Database
            await dbContext.Items.AddAsync(item);
            await dbContext.SaveChangesAsync();

            return new ResponseDTO()
            {
                IsSuccess = true,
                Message = $"Thêm mới sản phẩm {request.Name} thành công"
            };
        }

        public async Task<ResponseDTO> DeleteItemAsync(Guid itemId)
        {
           var itemDomain = await dbContext.Items.FindAsync(itemId);
            if (itemDomain == null)
            {
                return new ResponseDTO()
                {
                    IsSuccess = false,
                    Message = "Sản phẩm không tồn tại"
                };
            }
            var itemHistoryDomain = await dbContext.ItemsHistory.FirstOrDefaultAsync(item => item.ItemId.Equals(itemId));
            if(itemHistoryDomain != null)
            {
                return new ResponseDTO()
                {
                    IsSuccess = false,
                    Message = $"Bạn không thể xóa sản phẩm {itemDomain.Name} vì sản phẩm đã tồn tại trong lịch sử của người dùng"
                };
            }

            dbContext.Items.Remove(itemDomain);
            await dbContext.SaveChangesAsync();

            return new ResponseDTO()
            {
                IsSuccess = true,
                Message = $"Xóa sản phẩm {itemDomain.Name}"
            };
        }

        public async Task<ResponseDTO> UpdateItemAsync(Guid itemId, UpdateItemRequestDTO request)
        {
            // 1. Tìm Entity
            var itemDomain = await dbContext.Items.FindAsync(itemId);
            if (itemDomain == null)
            {
                return new ResponseDTO() { IsSuccess = false, Message = "Sản phẩm không tồn tại" };
            }

            string? imageUrl = itemDomain.ImageUrl; // Giữ nguyên URL cũ mặc định

            // 2. XỬ LÝ FILE MỚI (Nếu có file được upload)
            if (request.ImageItem != null)
            {
                try
                {
                    // A. XÓA FILE CŨ trước
                    DeleteOldImage(itemDomain.ImageUrl);

                    // B. Lưu FILE MỚI và nhận URL mới
                    imageUrl = await SaveNewImageAsync(request.ImageItem);
                }
                catch (InvalidOperationException ex)
                {
                    return new ResponseDTO { IsSuccess = false, Message = ex.Message };
                }
            }

            // 3. Cập nhật các thuộc tính (Vì DTO có [Required], ta gán thẳng)
            itemDomain.Name = request.Name;
            itemDomain.RequiredPoints = request.RequiredPoints;
            itemDomain.Tag = request.Tag ?? itemDomain.Tag ?? "handmade";

            // Cập nhật ImageUrl (sẽ là URL mới hoặc NULL nếu người dùng xóa ảnh)
            itemDomain.ImageUrl = imageUrl;

            // 4. Lưu thay đổi
            dbContext.Items.Update(itemDomain);
            await dbContext.SaveChangesAsync();

            return new ResponseDTO()
            {
                IsSuccess = true,
                Message = $"Cập nhật thành công sản phẩm {itemDomain.Name}"
            };
        }

        private async Task<string> SaveNewImageAsync(IFormFile imageFile)
        {
            if (imageFile.Length > MaxFileSize)
            {
                throw new InvalidOperationException("Dung lượng tệp tối đa là 5MB.");
            }

            string uploadFolder = Path.Combine(webHostEnvironment.WebRootPath, "imagesItem");
            if (!Directory.Exists(uploadFolder))
            {
                Directory.CreateDirectory(uploadFolder);
            }

            // Khắc phục LỖI BẢO MẬT: Tạo tên file DUY NHẤT bằng GUID
            string extension = Path.GetExtension(imageFile.FileName);//đuôi .jpg,...
            string uniqueFileName = Guid.NewGuid().ToString() + extension;
            string filePath = Path.Combine(uploadFolder, uniqueFileName);

            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await imageFile.CopyToAsync(fileStream);
            }

            // Trả về URL để lưu vào DB
            return $"/imagesItem/{uniqueFileName}";
        }

        private void DeleteOldImage(string? oldImageUrl)
        {
            if (string.IsNullOrWhiteSpace(oldImageUrl)) return;

            // Chuyển URL tương đối thành đường dẫn vật lý
            string filePathToDelete = Path.Combine(webHostEnvironment.WebRootPath, oldImageUrl.TrimStart('/'));

            if (System.IO.File.Exists(filePathToDelete))
            {
                System.IO.File.Delete(filePathToDelete);
            }
        }

        public async Task<ResponseDTO<List<ItemsHistoryDTO>>> GetItemsHistoryAsync(Guid userId)
        {
            try
            {
                var itemsHistory = await dbContext.ItemsHistory
                    .Include(ih => ih.Item)
                    .Include(ih => ih.User)
                    .Where(ih => ih.UserId == userId)
                    .OrderByDescending(ih => ih.RedemptionDate)
                    .ToListAsync();

                var itemsHistoryDtoList = itemsHistory.Select(ih => new ItemsHistoryDTO
                {
                    Id = ih.Id,
                    UserId = ih.UserId,
                    ItemId = ih.ItemId,
                    RedemptionDate = ih.RedemptionDate,
                    IsShipped = ih.IsShipped,
                    ItemName = ih.Item?.Name ?? string.Empty,
                    ItemImageUrl = ih.Item?.ImageUrl ?? string.Empty,
                    ItemRequiredPoints = ih.Item?.RequiredPoints ?? 0,
                    UserName = ih.User?.Name ?? ih.User?.Username ?? string.Empty
                }).ToList();

                return new ResponseDTO<List<ItemsHistoryDTO>>
                {
                    IsSuccess = true,
                    Message = itemsHistoryDtoList.Count > 0 ? "Lịch sử đổi quà" : "Chưa có lịch sử đổi quà nào",
                    Data = itemsHistoryDtoList
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO<List<ItemsHistoryDTO>>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi lấy lịch sử đổi quà: {ex.Message}",
                    Data = new List<ItemsHistoryDTO>()
                };
            }
        }

        public async Task<ResponseDTO<List<ItemsHistoryDTO>>> GetAllItemsHistoryAsync()
        {
            try
            {
                var itemsHistory = await dbContext.ItemsHistory
                    .Include(ih => ih.Item)
                    .Include(ih => ih.User)
                    .OrderByDescending(ih => ih.RedemptionDate)
                    .ToListAsync();

                var itemsHistoryDtoList = itemsHistory.Select(ih => new ItemsHistoryDTO
                {
                    Id = ih.Id,
                    UserId = ih.UserId,
                    ItemId = ih.ItemId,
                    RedemptionDate = ih.RedemptionDate,
                    IsShipped = ih.IsShipped,
                    ItemName = ih.Item?.Name ?? string.Empty,
                    ItemImageUrl = ih.Item?.ImageUrl ?? string.Empty,
                    ItemRequiredPoints = ih.Item?.RequiredPoints ?? 0,
                    UserName = ih.User?.Name ?? ih.User?.Username ?? string.Empty,
                    UserPhoneNumber = ih.User?.PhoneNumber ?? string.Empty,
                    UserAddress = ih.User?.Address ?? string.Empty
                }).ToList();

                return new ResponseDTO<List<ItemsHistoryDTO>>
                {
                    IsSuccess = true,
                    Message = itemsHistoryDtoList.Count > 0 ? "Danh sách đổi quà của tất cả user" : "Chưa có lịch sử đổi quà nào",
                    Data = itemsHistoryDtoList
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO<List<ItemsHistoryDTO>>
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi lấy danh sách đổi quà: {ex.Message}",
                    Data = new List<ItemsHistoryDTO>()
                };
            }
        }

        public async Task<ResponseDTO> UpdateItemsHistoryShippedStatusAsync(Guid historyId, bool isShipped)
        {
            try
            {
                var itemHistory = await dbContext.ItemsHistory.FindAsync(historyId);
                if (itemHistory == null)
                {
                    return new ResponseDTO
                    {
                        IsSuccess = false,
                        Message = "Không tìm thấy lịch sử đổi quà"
                    };
                }

                itemHistory.IsShipped = isShipped;
                dbContext.ItemsHistory.Update(itemHistory);
                await dbContext.SaveChangesAsync();

                return new ResponseDTO
                {
                    IsSuccess = true,
                    Message = isShipped ? "Đã đánh dấu đã gửi đơn" : "Đã bỏ đánh dấu đã gửi đơn"
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi cập nhật trạng thái: {ex.Message}"
                };
            }
        }
    }
}
