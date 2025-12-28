using EcoTokenSystem.Application.DTOs;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Interfaces
{
    public interface IUserInterface
    {
        public Task<ResponseDTO> RegisterAsync(RegisterRequestDTO request);
        public Task<ResponseDTO<LoginResponseDTO>> LoginAsync(LoginRequestDTO request);
        public Task<ResponseDTO> ChangePasswordAsync(ChangePasswordRequestDTO request, Guid userId);

        public Task<ResponseDTO<ResponseUserProfileDTO>> GetProfileAsync(Guid Id);

        public Task<ResponseDTO<ResponseUserProfileDTO>> UpdateProfileAsync(UpdateProfileRequestDTO request, Guid Id);

        public Task<ResponseDTO<List<PostsDTO>>> UserPostsAsync(Guid userId,int? statusId);

        // Admin operations
        public Task<ResponseDTO<List<UserListDTO>>> GetAllUsersAsync();
        public Task<ResponseDTO<ResponseUserProfileDTO>> AdminUpdateUserAsync(Guid userId, AdminUpdateUserDTO request);
        public Task<ResponseDTO> AdminCreateUserAsync(RegisterRequestDTO request, int roleId = 1);
        public Task<ResponseDTO> AdminDeleteUserAsync(Guid userId);
    }
}
