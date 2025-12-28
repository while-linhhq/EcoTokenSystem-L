// ============================================
// AUTH API - GỌI BACKEND THẬT
// ============================================
import { apiPost, apiGet, apiPatch } from './apiClient';

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
    email: backendData.Email || backendData.email || '',
    phone: backendData.PhoneNumber || backendData.phoneNumber || backendData.phone || '',
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
    const response = await apiPost('/User/Register', {
      username: userData.username || userData.email || userData.phone,
      password: userData.password,
      // Backend có thể cần thêm fields khác
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
export const updateUserApi = async (userId, updatedData) => {
  try {
    // Map frontend data sang backend format
    // Backend UpdateProfileRequestDTO yêu cầu tất cả fields Required
    // Cần lấy giá trị hiện tại từ user nếu không có trong updatedData
    
    // Lấy thông tin user hiện tại trước
    const currentUserResponse = await getCurrentUserApi().catch(() => null);
    const currentUser = currentUserResponse?.data || {};
    
    // Map dateOfBirth - Backend cần DateOnly format (YYYY-MM-DD)
    let dateOfBirth = null;
    if (updatedData.dateOfBirth) {
      const date = new Date(updatedData.dateOfBirth);
      dateOfBirth = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    } else if (currentUser.dateOfBirth) {
      const date = new Date(currentUser.dateOfBirth);
      dateOfBirth = date.toISOString().split('T')[0];
    } else {
      // Backend yêu cầu DateOfBirth là required, nếu không có thì dùng ngày hiện tại
      dateOfBirth = new Date().toISOString().split('T')[0];
    }

    // Lấy Name - ưu tiên: updatedData.name > updatedData.nickname > currentUser.name/Name > currentUser.nickname > default
    const name = updatedData.name || 
                 updatedData.nickname || 
                 currentUser.name || 
                 currentUser.Name || 
                 currentUser.nickname || 
                 currentUser.username || 
                 'Người dùng'; // Default value thay vì empty string

    // Lấy Gender - ưu tiên: updatedData.gender > currentUser.gender/Gender > default
    const gender = updatedData.gender || 
                   currentUser.gender || 
                   currentUser.Gender || 
                   'Khác'; // Default value thay vì empty string

    // Lấy PhoneNumber - ưu tiên: updatedData.phoneNumber/phone > currentUser.phoneNumber/PhoneNumber > default
    const phoneNumber = updatedData.phoneNumber || 
                        updatedData.phone || 
                        currentUser.phoneNumber || 
                        currentUser.PhoneNumber || 
                        '0000000000'; // Default value thay vì empty string

    // Lấy Address - ưu tiên: updatedData.address > currentUser.address/Address > default
    const address = updatedData.address || 
                    currentUser.address || 
                    currentUser.Address || 
                    'Chưa cập nhật'; // Default value thay vì empty string

    const backendData = {
      name: name,
      phoneNumber: phoneNumber,
      address: address,
      gender: gender,
      dateOfBirth: dateOfBirth,
    };

    const response = await apiPatch('/User/me', backendData, true);

    if (response.success) {
      // Lấy lại thông tin user sau khi update
      const userResponse = await getCurrentUserApi();
      if (userResponse.success) {
        return {
          success: true,
          message: response.message || 'Cập nhật thông tin thành công',
          data: userResponse.data
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
    const response = await apiPost('/User/change-password', {
      oldPassword: oldPassword,
      newPassword: newPassword,
      newPasswordConfirm: newPassword // Backend yêu cầu confirm
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
