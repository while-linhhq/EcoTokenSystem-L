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
            try
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
            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                // Lỗi database (có thể do migration chưa chạy)
                throw new Exception($"Lỗi database: {dbEx.Message}. Có thể migration chưa được chạy. Chi tiết: {dbEx.InnerException?.Message ?? dbEx.Message}");
            }
            catch (Exception ex)
            {
                // Lỗi khác
                throw new Exception($"Lỗi khi đăng nhập: {ex.Message}. Chi tiết: {ex.InnerException?.Message ?? ex.Message}");
            }
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
                Email = userDomain.Email ?? string.Empty,
                Avatar = userDomain.Avatar ?? string.Empty,
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

        public async Task<ResponseDTO<ResponseUserProfileDTO>> UpdateProfileAsync(UpdateProfileRequestDTO request , Guid Id)
        {
            var userDomain = await dbContext.Users.Include(u => u.Role).FirstOrDefaultAsync(u=> u.Id.Equals(Id));
            if(userDomain == null)
            {
                return new ResponseDTO<ResponseUserProfileDTO>()
                {
                    IsSuccess = false,
                    Message = "Lỗi khi lấy Id người dùng",
                    Data = new ResponseUserProfileDTO()
                };
            }
            if (request.DateOfBirth.HasValue)
            {
                userDomain.DateOfBirth = request.DateOfBirth.Value.ToDateTime(TimeOnly.MinValue);
            }

            userDomain.Name = request.Name;
            userDomain.Email = request.Email ?? string.Empty;
            userDomain.Avatar = request.Avatar ?? string.Empty;
            userDomain.PhoneNumber = request.PhoneNumber;   
            userDomain.Address = request.Address;
            userDomain.Gender = request.Gender;

             dbContext.Update(userDomain);
            await dbContext.SaveChangesAsync();

            // Trả về dữ liệu user mới sau khi update
            var updatedData = new ResponseUserProfileDTO()
            {
                Username = userDomain.Username,
                Name = userDomain.Name,
                Email = userDomain.Email ?? string.Empty,
                Avatar = userDomain.Avatar ?? string.Empty,
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
                Message = "Cập nhật thông tin thành công",
                Data = updatedData
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
                    Id = post.Id, // QUAN TRỌNG: Phải có Id để frontend map đúng
                    Title = post.Title,
                    Content = post.Content,
                    ImageUrl = post.ImageUrl,
                    UserId = post.UserId,
                    StatusId = post.StatusId, // 1=Pending, 2=Approved, 3=Rejected
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

        // Admin: Get all users
        public async Task<ResponseDTO<List<UserListDTO>>> GetAllUsersAsync()
        {
            var users = await dbContext.Users
                .Include(u => u.Role)
                .ToListAsync();

            var userList = users.Select(u => new UserListDTO
            {
                Id = u.Id,
                Username = u.Username,
                Name = u.Name ?? string.Empty,
                Email = u.Email ?? string.Empty,
                Avatar = u.Avatar ?? string.Empty,
                PhoneNumber = u.PhoneNumber ?? string.Empty,
                Address = u.Address ?? string.Empty,
                Gender = u.Gender ?? string.Empty,
                DateOfBirth = u.DateOfBirth,
                RoleName = u.Role?.Name ?? "User",
                RoleId = u.RoleId,
                CurrentPoints = u.CurrentPoints,
                Streak = u.Streak,
                CreatedAt = u.CreatedAt
            }).ToList();

            return new ResponseDTO<List<UserListDTO>>
            {
                IsSuccess = true,
                Message = "Lấy danh sách users thành công",
                Data = userList
            };
        }

        // Admin: Update user
        public async Task<ResponseDTO<ResponseUserProfileDTO>> AdminUpdateUserAsync(Guid userId, AdminUpdateUserDTO request)
        {
            var userDomain = await dbContext.Users.Include(u => u.Role).FirstOrDefaultAsync(u => u.Id == userId);
            if (userDomain == null)
            {
                return new ResponseDTO<ResponseUserProfileDTO>
                {
                    IsSuccess = false,
                    Message = "Không tìm thấy user",
                    Data = new ResponseUserProfileDTO()
                };
            }

            // Update only provided fields
            if (request.Name != null) userDomain.Name = request.Name;
            if (request.Email != null) userDomain.Email = request.Email;
            if (request.Avatar != null) userDomain.Avatar = request.Avatar;
            if (request.PhoneNumber != null) userDomain.PhoneNumber = request.PhoneNumber;
            if (request.Address != null) userDomain.Address = request.Address;
            if (request.Gender != null) userDomain.Gender = request.Gender;
            if (request.DateOfBirth.HasValue)
            {
                userDomain.DateOfBirth = request.DateOfBirth.Value.ToDateTime(TimeOnly.MinValue);
            }
            if (request.CurrentPoints.HasValue) userDomain.CurrentPoints = request.CurrentPoints.Value;
            if (request.Streak.HasValue) userDomain.Streak = request.Streak.Value;
            if (request.RoleId.HasValue) userDomain.RoleId = request.RoleId.Value;

            dbContext.Users.Update(userDomain);
            await dbContext.SaveChangesAsync();

            // Trả về dữ liệu user mới sau khi update
            var updatedData = new ResponseUserProfileDTO()
            {
                Username = userDomain.Username,
                Name = userDomain.Name,
                Email = userDomain.Email ?? string.Empty,
                Avatar = userDomain.Avatar ?? string.Empty,
                DateOfBirth = userDomain.DateOfBirth,
                Gender = userDomain.Gender,
                PhoneNumber = userDomain.PhoneNumber,
                Address = userDomain.Address,
                RoleName = userDomain.Role?.Name ?? "User",
                CreatedAt = userDomain.CreatedAt,
                CurrentPoints = userDomain.CurrentPoints,
                Streak = userDomain.Streak
            };

            return new ResponseDTO<ResponseUserProfileDTO>
            {
                IsSuccess = true,
                Message = "Cập nhật user thành công",
                Data = updatedData
            };
        }

        // Admin: Create user
        public async Task<ResponseDTO> AdminCreateUserAsync(RegisterRequestDTO request, int roleId = 1)
        {
            try
            {
                // Validate input
                if (string.IsNullOrWhiteSpace(request.Username))
                {
                    return new ResponseDTO
                    {
                        IsSuccess = false,
                        Message = "Tên đăng nhập không được để trống"
                    };
                }

                if (string.IsNullOrWhiteSpace(request.Password) || request.Password.Length < 8)
                {
                    return new ResponseDTO
                    {
                        IsSuccess = false,
                        Message = "Mật khẩu phải có ít nhất 8 ký tự"
                    };
                }

                // Validate RoleId tồn tại, nếu không thì tự động thêm (đặc biệt cho Moderator)
                var roleExists = await dbContext.Roles.AnyAsync(r => r.Id == roleId);
                if (!roleExists)
                {
                    // Tự động thêm Moderator role nếu roleId = 3
                    if (roleId == 3)
                    {
                        try
                        {
                            var moderatorRole = new EcoTokenSystem.Domain.Entities.Role { Id = 3, Name = "Moderator" };
                            dbContext.Roles.Add(moderatorRole);
                            await dbContext.SaveChangesAsync();
                            // Role đã được thêm, tiếp tục
                        }
                        catch (Exception addRoleEx)
                        {
                            // Nếu thêm role fail (có thể do đã tồn tại hoặc constraint), kiểm tra lại
                            roleExists = await dbContext.Roles.AnyAsync(r => r.Id == roleId);
                            if (!roleExists)
                            {
                                // Lấy danh sách roles hiện có để hiển thị
                                var availableRoles = await dbContext.Roles.Select(r => $"{r.Id}={r.Name}").ToListAsync();
                                return new ResponseDTO
                                {
                                    IsSuccess = false,
                                    Message = $"Không thể thêm Moderator role (Id=3). Lỗi: {addRoleEx.Message}. Roles hiện có: {string.Join(", ", availableRoles)}"
                                };
                            }
                        }
                    }
                    else
                    {
                        // RoleId khác 3 và không tồn tại
                        var availableRoles = await dbContext.Roles.Select(r => $"{r.Id}={r.Name}").ToListAsync();
                        return new ResponseDTO
                        {
                            IsSuccess = false,
                            Message = $"RoleId {roleId} không tồn tại trong hệ thống. Roles hiện có: {string.Join(", ", availableRoles)}"
                        };
                    }
                }

                var existedUser = await dbContext.Users.FirstOrDefaultAsync(u => u.Username.Equals(request.Username));
                if (existedUser != null)
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
                    RoleId = roleId,
                    CreatedAt = DateTime.UtcNow
                };

                await dbContext.Users.AddAsync(userDomain);
                await dbContext.SaveChangesAsync();

                return new ResponseDTO
                {
                    IsSuccess = true,
                    Message = "Tạo user thành công"
                };
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                // Lỗi database (foreign key, constraint, etc.)
                return new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi database: {dbEx.InnerException?.Message ?? dbEx.Message}"
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi tạo user: {ex.Message}"
                };
            }
        }

        // Admin: Delete user
        public async Task<ResponseDTO> AdminDeleteUserAsync(Guid userId)
        {
            try
            {
                var userDomain = await dbContext.Users
                    .Include(u => u.Posts)
                    .Include(u => u.PointsHistory)
                    .Include(u => u.ItemsHistory)
                    .FirstOrDefaultAsync(u => u.Id == userId);

                if (userDomain == null)
                {
                    return new ResponseDTO
                    {
                        IsSuccess = false,
                        Message = "Không tìm thấy user"
                    };
                }

                // Không cho phép xóa Admin user (bảo vệ tài khoản admin)
                if (userDomain.RoleId == 2) // RoleId 2 = Admin
                {
                    return new ResponseDTO
                    {
                        IsSuccess = false,
                        Message = "Không thể xóa tài khoản Admin"
                    };
                }

                // Xóa các bản ghi liên quan trước (do có Restrict constraint)
                // 1. Xóa Posts của user
                var userPosts = await dbContext.Posts.Where(p => p.UserId == userId).ToListAsync();
                if (userPosts.Any())
                {
                    dbContext.Posts.RemoveRange(userPosts);
                }

                // 2. Xóa PointHistories của user
                var userPointHistories = await dbContext.PointHistories.Where(ph => ph.UserId == userId).ToListAsync();
                if (userPointHistories.Any())
                {
                    dbContext.PointHistories.RemoveRange(userPointHistories);
                }

                // 3. Xóa ItemsHistory của user
                var userItemsHistories = await dbContext.ItemsHistory.Where(ih => ih.UserId == userId).ToListAsync();
                if (userItemsHistories.Any())
                {
                    dbContext.ItemsHistory.RemoveRange(userItemsHistories);
                }

                // Set null cho AdminId trong Posts và PointHistories (đã có SetNull constraint)
                var postsWithAdminId = await dbContext.Posts.Where(p => p.AdminId == userId).ToListAsync();
                foreach (var post in postsWithAdminId)
                {
                    post.AdminId = null;
                }

                var pointHistoriesWithAdminId = await dbContext.PointHistories.Where(ph => ph.AdminId == userId).ToListAsync();
                foreach (var ph in pointHistoriesWithAdminId)
                {
                    ph.AdminId = null;
                }

                // Xóa user
                dbContext.Users.Remove(userDomain);
                await dbContext.SaveChangesAsync();

                return new ResponseDTO
                {
                    IsSuccess = true,
                    Message = "Xóa user thành công"
                };
            }
            catch (Microsoft.EntityFrameworkCore.DbUpdateException dbEx)
            {
                return new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi database khi xóa user: {dbEx.InnerException?.Message ?? dbEx.Message}"
                };
            }
            catch (Exception ex)
            {
                return new ResponseDTO
                {
                    IsSuccess = false,
                    Message = $"Lỗi khi xóa user: {ex.Message}"
                };
            }
        }

    }
}
