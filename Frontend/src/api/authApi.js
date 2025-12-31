// ============================================
// AUTH API - GỌI BACKEND THẬT
// ============================================
import { apiPost, apiGet, apiPatch } from './apiClient';
import { getAvatarImageUrl } from '../utils/imageUtils';

/**
 * Map response từ backend sang format frontend
 */
const mapUserResponse = (backendData) => {
  // Backend trả về có thể là:
  // - LoginResponseDTO: { UserId, Username, RoleName, CurrentPoints, Token } (uppercase)
  // - ResponseUserProfileDTO: { Username, Name, RoleName, CurrentPoints, ... } (KHÔNG có Id và Token)
  // Frontend cần: { id, username, role, currentPoints, token, ... }
  
  // Map ID - thử cả uppercase và lowercase
  // LƯU Ý: ResponseUserProfileDTO không có Id, chỉ LoginResponseDTO mới có UserId
  const userId = backendData.UserId || backendData.userId || backendData.id || null;
  
  // Map token - thử cả uppercase và lowercase
  // LƯU Ý: ResponseUserProfileDTO không có Token, chỉ LoginResponseDTO mới có Token
  const token = backendData.Token || backendData.token || null;
  
  // Map username
  const username = backendData.Username || backendData.username || '';
  
  // Map role - normalize về lowercase
  const roleName = backendData.RoleName || backendData.roleName || backendData.role || 'user';
  const role = typeof roleName === 'string' ? roleName.toLowerCase() : 'user';
  
  // Map currentPoints
  const currentPoints = backendData.CurrentPoints ?? backendData.currentPoints ?? 0;
  
  return {
    id: userId, // Đảm bảo có id
    userId: userId, // Giữ userId để tương thích
    username: username,
    role: role,
    roleName: backendData.RoleName || backendData.roleName || role,
    currentPoints: currentPoints,
    ecoTokens: currentPoints, // Map ecoTokens từ CurrentPoints để tương thích với Home.jsx
    token: token, // Đảm bảo token được map
    // Thêm các field khác nếu có
    name: backendData.Name || backendData.name || '',
    fullName: backendData.Name || backendData.name || '',
    nickname: backendData.Name || backendData.name || username || '',
    email: backendData.Email || backendData.email || '',
    avatar: backendData.Avatar || backendData.avatar || '🌱',
    avatarImage: getAvatarImageUrl(backendData.Avatar || backendData.avatar),
    phone: backendData.PhoneNumber || backendData.phoneNumber || backendData.phone || '',
    phoneNumber: backendData.PhoneNumber || backendData.phoneNumber || backendData.phone || '',
    address: backendData.Address || backendData.address || '',
    gender: backendData.Gender || backendData.gender || '',
    dateOfBirth: backendData.DateOfBirth || backendData.dateOfBirth || null,
    streak: backendData.Streak || backendData.streak || 0,
    createdAt: backendData.CreatedAt || backendData.createdAt || null,
  };
};

/**
 * Login API
 * POST /api/User/Login
 */
export const loginApi = async (username, password) => {
  try {
    // Validate input
    if (!username || !password) {
      return {
        success: false,
        message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'
      };
    }

    const response = await apiPost('/User/Login', {
      username: username.trim(),
      password: password
    }, false); // Không cần auth cho login

    // Kiểm tra response có thành công và có data không
    if (response.success && response.data) {
      // apiPost đã xử lý và trả về data.data (nếu có nested structure)
      // hoặc data trực tiếp nếu không có nested structure
      // Vì vậy response.data ở đây đã là LoginResponseDTO { userId, username, token, ... }
      let rawData = response.data;
      
      // Kiểm tra xem có phải nested structure không (có thể apiPost chưa xử lý)
      // Nếu rawData có property 'data' và không phải là LoginResponseDTO (không có userId/token ở root level)
      if (rawData.data && typeof rawData.data === 'object' && !rawData.userId && !rawData.token) {
        rawData = rawData.data;
      }

      // Kiểm tra có token không (bắt buộc) - thử cả lowercase và uppercase
      const token = rawData.Token || rawData.token;
      if (!token) {
        console.error('[Login API] No token found in response.data:', rawData);
        return {
          success: false,
          message: 'Đăng nhập thất bại: Không nhận được token từ server'
        };
      }

      // Kiểm tra có UserId không (bắt buộc) - thử cả uppercase và lowercase
      const userId = rawData.UserId || rawData.userId || rawData.id;
      if (!userId) {
        console.error('[Login API] No UserId found in response.data:', rawData);
        return {
          success: false,
          message: 'Đăng nhập thất bại: Không nhận được User ID từ server'
        };
      }

      // Map response từ backend
      const userData = mapUserResponse(rawData);
      
      // Đảm bảo token và id được map đúng (fallback nếu mapUserResponse không map được)
      if (!userData.token) {
        userData.token = token;
      }
      if (!userData.id) {
        userData.id = userId;
        userData.userId = userId;
      }
      
      return {
        success: true,
        message: response.message || 'Đăng nhập thành công',
        data: userData
      };
    }

    // Nếu không có data hoặc success = false
    return {
      success: false,
      message: response.message || 'Đăng nhập thất bại: Tên đăng nhập hoặc mật khẩu không chính xác'
    };
  } catch (error) {
    // Xử lý các loại lỗi
    console.error('[Login API] Error:', error);
    let errorMessage = 'Đăng nhập thất bại';
    
    if (error.message) {
      errorMessage = error.message;
    } else if (error.response) {
      errorMessage = error.response.message || 'Có lỗi xảy ra khi kết nối đến server';
    }

    return {
      success: false,
      message: errorMessage
    };
  }
};

/**
 * Register API
 * POST /api/User/Register
 */
export const registerApi = async (userData) => {
  try {
    // Backend DTO: Username, Password, PasswordConfirm (PascalCase)
    const response = await apiPost('/User/Register', {
      Username: userData.username,
      Password: userData.password,
      PasswordConfirm: userData.passwordConfirm
    }, false); // Không cần auth cho register

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Đăng ký thành công',
        data: null
      };
    }

    throw new Error(response.message || 'Đăng ký thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Đăng ký thất bại'
    };
  }
};

/**
 * Get current user API
 * GET /api/User/me
 */
export const getCurrentUserApi = async () => {
  try {
    const response = await apiGet('/User/me', true); // Cần auth

    if (response.success && response.data) {
      const userData = mapUserResponse(response.data);
      return {
        success: true,
        message: response.message || 'Lấy thông tin thành công',
        data: userData
      };
    }

    throw new Error(response.message || 'Không thể lấy thông tin người dùng');
  } catch (error) {
    // Nếu lỗi 401, có nghĩa là token không hợp lệ hoặc đã hết hạn
    if (error.status === 401 || error.message.includes('401') || error.message.includes('Unauthorized')) {
      // Throw error để AuthContext có thể xử lý
      const authError = new Error('Unauthorized: Token không hợp lệ hoặc đã hết hạn');
      authError.status = 401;
      throw authError;
    }
    // Các lỗi khác (network, timeout, etc.) - throw để AuthContext có thể giữ lại cached user
    throw error;
  }
};

/**
 * Update user profile API
 * PATCH /api/User/me
 */
export const updateUserApi = async (formData) => {
  try {
    // formData is now FormData object, not plain object
    // Use apiPatch with includeAuth=true and isFormData=true
    const response = await apiPatch('/User/me', formData, true, true);

    if (response.success) {
      // Backend trả về ResponseDTO<ResponseUserProfileDTO> với Data chứa user mới
      let userData = null;

      // Kiểm tra response.data (có thể là ResponseDTO format hoặc data trực tiếp)
      if (response.data) {
        // Nếu response.data có Data (uppercase) - ResponseDTO format
        if (response.data.Data) {
          userData = mapUserResponse(response.data.Data);
        }
        // Nếu response.data có data (lowercase) - ResponseDTO format
        else if (response.data.data) {
          userData = mapUserResponse(response.data.data);
        }
        // Nếu response.data là ResponseUserProfileDTO trực tiếp
        else {
          userData = mapUserResponse(response.data);
        }
      }

      // Nếu không có data trong response, gọi lại getCurrentUserApi để lấy dữ liệu mới
      if (!userData) {
        const userResponse = await getCurrentUserApi();
        if (userResponse.success) {
          userData = userResponse.data;
        }
      }

      if (userData) {
        return {
          success: true,
          message: response.message || 'Cập nhật thông tin thành công',
          data: userData
        };
      }
    }

    throw new Error(response.message || 'Cập nhật thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Cập nhật thất bại'
    };
  }
};

/**
 * Change password API
 * POST /api/User/change-password
 */
export const changePasswordApi = async (userId, oldPassword, newPassword) => {
  try {
    // Backend DTO yêu cầu PascalCase và MinLength(8) cho NewPassword
    // Gửi đúng format để tránh 400 Bad Request
    const response = await apiPost('/User/change-password', {
      OldPassword: oldPassword,
      NewPassword: newPassword,
      NewPasswordConfirm: newPassword // Backend yêu cầu confirm và Compare với NewPassword
    }, true); // Cần auth

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Đổi mật khẩu thành công'
      };
    }

    throw new Error(response.message || 'Đổi mật khẩu thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Đổi mật khẩu thất bại'
    };
  }
};

/**
 * Logout API
 * (Frontend chỉ cần xóa localStorage)
 */
export const logoutApi = async () => {
  // Backend không có logout endpoint, chỉ cần xóa token ở frontend
  localStorage.removeItem('user');
  return {
    success: true,
    message: 'Đăng xuất thành công'
  };
};
