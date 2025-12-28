using EcoTokenSystem.Application.Interfaces;
using EcoTokenSystem.Domain.Entities;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace EcoTokenSystem.Application.Services
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _configuration;

        public TokenService(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public string GenerateToken(User user, string roleName)
        {
            var jwtSettings = _configuration.GetSection("JwtSettings");
            var key = Encoding.UTF8.GetBytes(jwtSettings["Secret"]!);

            // 1. Tạo Claims (Thông tin định danh người dùng)
            var claims = new List<Claim>
            {
                // ID người dùng - Dùng cả Sub (JWT standard) và NameIdentifier (ASP.NET standard)
                // JwtRegisteredClaimNames.Sub = "sub" (JWT standard claim)
                new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
                // ClaimTypes.NameIdentifier = ASP.NET standard (để BaseController.GetUserIdFromToken() hoạt động)
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                // Username (Định danh tên)
                new Claim(JwtRegisteredClaimNames.Jti, user.Username), 
                // Vai trò (Rất quan trọng cho [Authorize(Roles = "Admin")])
                new Claim(ClaimTypes.Role, roleName)
            };

            // 2. Tạo Token Security Descriptor
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(claims),
                Expires = DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["ExpiryMinutes"]!)),
                Issuer = jwtSettings["Issuer"],
                Audience = jwtSettings["Audience"],
                SigningCredentials = new SigningCredentials(
                    new SymmetricSecurityKey(key),
                    SecurityAlgorithms.HmacSha256Signature)
            };

            // 3. Tạo và Mã hóa Token
            var tokenHandler = new JwtSecurityTokenHandler();
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }
}
