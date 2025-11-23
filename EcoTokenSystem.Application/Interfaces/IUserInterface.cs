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
        public Task<LoginResponseDTO> RegisterAsync(RegisterRequestDTO request);
        public Task<LoginResponseDTO> LoginAsync(LoginRequestDTO request);
        public Task<ResponseDTO> ChangePasswordAsync(ChangePasswordRequestDTO request);

        public Task<ResponseDTO<ResponseUserProfileDTO>> GetProfileAsync(Guid Id);

        public Task<ResponseDTO> UpdateProfileAsync(UpdateProfileRequestDTO request, Guid Id);

        public Task<ResponseDTO<List<PostsDTO>>> UserPostsAsync(Guid userId,int? statusId);
    }
}
