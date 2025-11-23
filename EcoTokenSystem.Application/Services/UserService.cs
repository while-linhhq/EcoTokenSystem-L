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

        public async Task<ResponseDTO<ResponseUserProfileDTO>> GetProfileAsync(Guid Id)
        {
            var userDomain =  await dbContext.Users.FirstOrDefaultAsync(u => u.Id == Id);
            if(userDomain == null)
            {
                return new ResponseDTO<ResponseUserProfileDTO>(){
                    IsSuccess = false,
                    Message= "Lỗi khi lấy Id người dùng",
                    Data = new ResponseUserProfileDTO()
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
            return new ResponseDTO<ResponseUserProfileDTO>()
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

        public async Task<ResponseDTO<List<PostsDTO>>> UserPostsAsync(Guid userId, int? statusId)
        {
            var userDomain = await dbContext.Users.FirstOrDefaultAsync(u=> u.Id.Equals(userId));
            if (userDomain == null)
            {
                return new ResponseDTO<List<PostsDTO>>()
                {
                    IsSuccess = false,
                    Message = "Lỗi khi lấy Id người dùng",
                    Data = new List<PostsDTO>()
                };
            }
            var postQuery = dbContext.Posts.
                    Where(p=> p.UserId.Equals(userId)).
                    AsQueryable();
            if (statusId.HasValue)
            {
                postQuery = postQuery.Where(p => p.StatusId.Equals(statusId));
            }

            var postsDomain =await postQuery.ToListAsync();
            List<PostsDTO> posts = new List<PostsDTO>();
            foreach (var post in postsDomain) 
            {
                posts.Add(new PostsDTO()
                {
                    Title = post.Title,
                    Content = post.Content,
                    ImageUrl = post.ImageUrl,
                    UserId = post.UserId,
                    StatusId = post.StatusId,
                    AdminId = post.AdminId,
                    AwardedPoints = post.AwardedPoints,
                    SubmittedAt = post.SubmittedAt,
                    ApprovedRejectedAt = post.ApprovedRejectedAt,
                    RejectionReason = post.RejectionReason
                });
            }
            return new ResponseDTO<List<PostsDTO>>()
            {
                IsSuccess = true,
                Message = "Lấy danh sách các bài đăng của cá nhân",
                Data = posts.ToList()
            };

        }

    }
}
