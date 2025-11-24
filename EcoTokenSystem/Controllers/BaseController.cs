using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EcoTokenSystem.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BaseController : ControllerBase
    {

        // Protected để chỉ các Controller con mới có thể truy cập
        protected Guid GetUserIdFromToken()
        {
            // Lấy ID (ClaimTypes.NameIdentifier)
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (Guid.TryParse(userIdClaim, out Guid userId))
            {
                return userId;
            }
            // Không nên xảy ra nếu [Authorize] đã được áp dụng đúng
            throw new UnauthorizedAccessException("Không tìm thấy User ID trong Token.");
        }

        protected string GetUserRoleFromToken()
        {
            // ClaimTypes.Role là nơi chúng ta lưu Tên Role khi tạo Token
            return User.FindFirstValue(ClaimTypes.Role) ?? "User";
        }
    }
}
