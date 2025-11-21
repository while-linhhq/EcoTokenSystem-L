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
    public class UserService : IUserInterface
    {
        private readonly ApplicationDbContext dbContext;

        public UserService(ApplicationDbContext dbContext )
        {
            this.dbContext = dbContext;
        }

        

        public async Task<LoginResponseDTO> RegisterAsync(RegisterRequestDTO request)
        {
            var existedUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Username.Equals(request.Username));
            if(existedUser != null)
            {
                return new LoginResponseDTO
                {
                    IsSuccess = false,
                    Message = "Tên đăng nhập đã tồn tại!"
                };
            }

            string passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

            var userDomain = new User()
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                PasswordHash = passwordHash,
                RoleId = 1,
                CreatedAt = DateTime.UtcNow
            };

            await dbContext.Users.AddAsync(userDomain);
            await dbContext.SaveChangesAsync();

            var response = new LoginResponseDTO()
            {
                IsSuccess = true,
                Message = "Đăng ký thành công",
                UserId = userDomain.Id,
                Username = request.Username,
                RoleId = userDomain.RoleId
            };
            return response;
        }

        public  async Task<LoginResponseDTO> LoginAsync(LoginRequestDTO request)
        {
            var userDomain = await dbContext.Users
                .Include(u => u.Role) 
                .FirstOrDefaultAsync(u => u.Username.Equals(request.Username)); if (userDomain == null)
            {
                return new LoginResponseDTO() { IsSuccess = false, Message="Tên đăng nhập hoặc mật khẩu không đúng!" };
            }

            bool isPasswordValid = BCrypt.Net.BCrypt.Verify(request.Password, userDomain.PasswordHash);

            if (isPasswordValid)
            {

                return new LoginResponseDTO()
                {
                    IsSuccess = true,
                    Message = "Đăng nhập thành công!",
                    UserId = userDomain.Id,
                    RoleId = userDomain.RoleId,
                    Username = userDomain.Username
                };
            }
            return new LoginResponseDTO() { IsSuccess = false, Message = "Mật khẩu không đúng!" };

        }

        public async Task<ResponseDTO> ChangePasswordAsync(ChangePasswordRequestDTO request)
        {
            var userDomain = await dbContext.Users.FirstOrDefaultAsync(u => u.Id.Equals(request.UserId));
            if (userDomain == null) {
                return new ResponseDTO()
                {
                    IsSuccess = false,
                    Message = "Lỗi truy cập người dùng(Id)"
                };
            }
            if (!request.NewPassword.Equals(request.NewPasswordConfirm))
            {
                return new ResponseDTO()
                {
                    IsSuccess = false,
                    Message = "Vui lòng kiểm tra lại mật khẩu mới/mật khẩu nhập lại "
                };
            }
            if (BCrypt.Net.BCrypt.Verify(request.OldPassword, userDomain.PasswordHash))
            {
                userDomain.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                    dbContext.Users.Update(userDomain);
                await dbContext.SaveChangesAsync();

                return new ResponseDTO()
                {
                    IsSuccess = true,
                    Message = "Cập nhật mật khẩu thành công"
                };
            }
            else 
            {
                return new ResponseDTO()
                {
                    IsSuccess = false,
                    Message = "Mật khẩu cũ không chính xác."
                };
            }

        }

        public async Task<ResponseDTO> GetProfileAsync(Guid Id)
        {
            var userDomain =  await dbContext.Users.FirstOrDefaultAsync(u => u.Id == Id);
            if(userDomain == null)
            {
                return new ResponseDTO(){
                    IsSuccess = false,
                    Message= "Lỗi khi lấy Id người dùng"
                };
            }
            var data = new ResponseUserProfileDTO()
            {
                Username = userDomain.Username,
                Name = userDomain.Name,
                DateOfBirth = userDomain.DateOfBirth,
                Gender = userDomain.Gender,
                PhoneNumber = userDomain.PhoneNumber,
                Address = userDomain.Address,
                CreatedAt = userDomain.CreatedAt,
                CurrentPoints = userDomain.CurrentPoints,
                Streak = userDomain.Streak
            };
            return new ResponseDTO()
            {
                IsSuccess = true,
                Message = "Lấy profile thành công",
                Data = data
            };

        }

        public async Task<ResponseDTO> UpdateProfileAsync(UpdateProfileRequestDTO request , Guid Id)
        {
            var userDomain = await dbContext.Users.FirstOrDefaultAsync(u=> u.Id.Equals(Id));
            if(userDomain == null)
            {
                return new ResponseDTO()
                {
                    IsSuccess = false,
                    Message = "Lỗi khi lấy Id người dùng"
                };
            }
            
            userDomain.Name = request.Name;
            userDomain.PhoneNumber = request.PhoneNumber;   
            userDomain.Address = request.Address;
            userDomain.DateOfBirth = request.DateOfBirth.Value.ToDateTime(TimeOnly.MinValue);
            userDomain.Gender = request.Gender;

             dbContext.Update(userDomain);
            await dbContext.SaveChangesAsync();
            return new ResponseDTO()
            {
                IsSuccess = true,
                Message = "Cập nhật thông tin thành công"
            };

        }
    }
}
