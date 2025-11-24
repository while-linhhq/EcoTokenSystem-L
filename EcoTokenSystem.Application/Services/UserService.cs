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
        private readonly ITokenService _tokenService;
        public UserService(ApplicationDbContext dbContext , ITokenService tokenService)
        {
            this.dbContext = dbContext;
            _tokenService = tokenService;
        }

        

        public async Task<ResponseDTO> RegisterAsync(RegisterRequestDTO request)
        {
            var existedUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Username.Equals(request.Username));
            if(existedUser != null)
            {
                return new ResponseDTO
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

            var response = new ResponseDTO()
            {
                IsSuccess = true,
                Message = "Đăng ký thành công"
            };
            return response;
        }

        public async Task<ResponseDTO<LoginResponseDTO>> LoginAsync(LoginRequestDTO request)
        {   
            var user = await dbContext.Users
                .Include(u => u.Role) // Dùng Include nếu bạn muốn lấy luôn RoleName
                .FirstOrDefaultAsync(u => u.Username == request.Username);

            // Kiểm tra User hoặc Mật khẩu
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            {
                return new ResponseDTO<LoginResponseDTO>
                {
                    IsSuccess = false,
                    Message = "Tên đăng nhập hoặc mật khẩu không chính xác.",
                    Data = new LoginResponseDTO() { }
                };
            }

            // 3. Kiểm tra RoleName và tạo Token
            var roleName = user.Role?.Name ?? "User"; // Lấy tên Role từ navigation property (hoặc gán cứng "User" nếu Role bị null)

            // Tạo JWT
            var token = _tokenService.GenerateToken(user, roleName);

            // 4. Trả về Response thành công cùng với Token và thông tin cơ bản
            return new ResponseDTO<LoginResponseDTO>
            {
                IsSuccess = true,
                Message = "Đăng nhập thành công!",
                Data = new LoginResponseDTO()
                {
                    UserId = user.Id,
                    Username = user.Username,
                    RoleName = roleName,
                    CurrentPoints = user.CurrentPoints,
                    Token = token
                }
            };
        }

        public async Task<ResponseDTO> ChangePasswordAsync(ChangePasswordRequestDTO request, Guid userId)
        {
            // Dùng userId lấy từ Token để tìm User
            var userDomain = await dbContext.Users.FirstOrDefaultAsync(u => u.Id.Equals(userId));

            // Lỗi này hiếm xảy ra nếu đã có [Authorize]
            if (userDomain == null)
            {
                return new ResponseDTO() { IsSuccess = false, Message = "Lỗi xác thực người dùng." };
            }

            if (!request.NewPassword.Equals(request.NewPasswordConfirm))
            {
                return new ResponseDTO() { IsSuccess = false, Message = "Mật khẩu mới không khớp." };
            }

            if (BCrypt.Net.BCrypt.Verify(request.OldPassword, userDomain.PasswordHash))
            {
                userDomain.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
                dbContext.Users.Update(userDomain);
                await dbContext.SaveChangesAsync();

                return new ResponseDTO() { IsSuccess = true, Message = "Cập nhật mật khẩu thành công." };
            }
            else
            {
                return new ResponseDTO() { IsSuccess = false, Message = "Mật khẩu cũ không chính xác." };
            }
        }

        public async Task<ResponseDTO<ResponseUserProfileDTO>> GetProfileAsync(Guid Id)
        {
            var userDomain =  await dbContext.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == Id);
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
                RoleName = userDomain.Role?.Name ?? "User",
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
            if (request.DateOfBirth.HasValue)
            {
                userDomain.DateOfBirth = request.DateOfBirth.Value.ToDateTime(TimeOnly.MinValue);
            }

            userDomain.Name = request.Name;
            userDomain.PhoneNumber = request.PhoneNumber;   
            userDomain.Address = request.Address;
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
