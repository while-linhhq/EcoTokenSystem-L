// ============================================
// USERS API - GỌI BACKEND THẬT (Admin)
// ============================================
import { apiGet, apiPost, apiPatch, apiDelete } from './apiClient';
import { getAvatarImageUrl, normalizeImageUrl } from '../utils/imageUtils';

/**
 * Map UserListDTO từ backend sang format frontend
 */
const mapUserResponse = (backendUser) => {
  const avatar = backendUser.Avatar || backendUser.avatar || '🌱';
  const avatarImage = getAvatarImageUrl(avatar);
  return {
    id: backendUser.Id || backendUser.id,
    userId: backendUser.Id || backendUser.id,
    username: backendUser.Username || backendUser.username,
    name: backendUser.Name || backendUser.name || '',
    nickname: backendUser.Name || backendUser.name || backendUser.Username || '',
    email: backendUser.Email || backendUser.email || '',
    avatar: avatarImage ? '🖼️' : avatar,
    avatarImage: avatarImage,
    phone: backendUser.PhoneNumber || backendUser.phoneNumber || '',
    phoneNumber: backendUser.PhoneNumber || backendUser.phoneNumber || '',
    address: backendUser.Address || backendUser.address || '',
    gender: backendUser.Gender || backendUser.gender || '',
    dateOfBirth: backendUser.DateOfBirth || backendUser.dateOfBirth,
    role: (backendUser.RoleName || backendUser.roleName || 'user').toLowerCase(),
    roleName: backendUser.RoleName || backendUser.roleName || 'User',
    roleId: backendUser.RoleId || backendUser.roleId || 1,
    currentPoints: backendUser.CurrentPoints ?? backendUser.currentPoints ?? 0,
    ecoTokens: backendUser.CurrentPoints ?? backendUser.currentPoints ?? 0,
    streak: backendUser.Streak || backendUser.streak || 0,
    createdAt: backendUser.CreatedAt || backendUser.createdAt,
  };
};

/**
 * Get all users API (Admin only)
 * GET /api/User/all
 */
export const getAllUsersApi = async () => {
  try {
    console.log('[getAllUsersApi] Calling GET /User/all...');
    const response = await apiGet('/User/all', true); // Cần auth (Admin)

    console.log('[getAllUsersApi] Response:', {
      success: response.success,
      hasData: !!response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
    });

    if (response.success && response.data) {
      // response.data có thể là array trực tiếp hoặc nested trong ResponseDTO
      let users = [];
      if (Array.isArray(response.data)) {
        users = response.data;
      } else if (response.data.Data && Array.isArray(response.data.Data)) {
        users = response.data.Data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        users = response.data.data;
      }

      console.log('[getAllUsersApi] Users found:', users.length);
      const mappedUsers = users.map(mapUserResponse);
      console.log('[getAllUsersApi] Mapped users:', mappedUsers.length);

      return {
        success: true,
        message: response.message || 'Lấy danh sách users thành công',
        data: mappedUsers
      };
    }

    throw new Error(response.message || 'Không thể lấy danh sách users');
  } catch (error) {
    console.error('[getAllUsersApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể lấy danh sách users',
      data: []
    };
  }
};

/**
 * Create moderator/user API (Admin only)
 * POST /api/User/admin/create?roleId={roleId}
 * roleId: 1 = User, 2 = Admin, 3 = Moderator
 */
export const createModeratorApi = async (moderatorData) => {
  try {
    // roleId: 1 = User, 2 = Admin, 3 = Moderator
    const roleId = moderatorData.roleId || (moderatorData.role === 'moderator' ? 3 : 1);
    const username = moderatorData.email || moderatorData.username || moderatorData.nickname;

    console.log('[createModeratorApi] Request:', { username, roleId, hasPassword: !!moderatorData.password });

    try {
      const requestData = {
        username: username,
        password: moderatorData.password,
        passwordConfirm: moderatorData.password
      };
      
      // Add name/nickname if provided
      if (moderatorData.nickname) {
        requestData.name = moderatorData.nickname;
      }

      const response = await apiPost(`/User/admin/create?roleId=${roleId}`, requestData, true); // Cần auth (Admin)

      console.log('[createModeratorApi] Response:', response);

      if (response && response.success) {
        // Reload users để lấy user mới tạo
        const usersResponse = await getAllUsersApi();
        const newUser = usersResponse.data?.find(u =>
          u.username === (moderatorData.email || moderatorData.username)
        );

        // Map role từ roleId
        const roleName = roleId === 3 ? 'Moderator' : (roleId === 2 ? 'Admin' : 'User');
        const role = roleName.toLowerCase();

        return {
          success: true,
          message: response.message || 'Tạo tài khoản thành công',
          data: newUser || {
            id: Date.now(),
            username: moderatorData.email || moderatorData.username,
            name: moderatorData.nickname,
            nickname: moderatorData.nickname,
            role: role,
            roleName: roleName,
            roleId: roleId
          }
        };
      }

      // Nếu response không có success hoặc success = false
      const errorMessage = response?.message || 'Tạo tài khoản thất bại';
      console.error('[createModeratorApi] Failed:', errorMessage, response);
      return {
        success: false,
        message: errorMessage
      };
    } catch (apiError) {
      // Lỗi từ apiPost (network, HTTP error, etc.)
      console.error('[createModeratorApi] API Error:', apiError);
      const errorMessage = apiError?.message || apiError?.toString() || 'Lỗi kết nối đến server';
      return {
        success: false,
        message: errorMessage
      };
    }
  } catch (error) {
    // Lỗi không mong đợi
    console.error('[createModeratorApi] Unexpected Error:', error);
    return {
      success: false,
      message: error?.message || error?.toString() || 'Có lỗi xảy ra khi tạo tài khoản'
    };
  }
};

/**
 * Update user API (Admin only)
 * PATCH /api/User/{userId}
 */
export const updateUserApi = async (userId, updatedData) => {
  try {
    // Map frontend data sang backend format
    let dateOfBirth = null;
    if (updatedData.dateOfBirth) {
      const date = new Date(updatedData.dateOfBirth);
      dateOfBirth = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    }

    const backendData = {
      name: updatedData.name || updatedData.nickname || null,
      phoneNumber: updatedData.phoneNumber || updatedData.phone || null,
      address: updatedData.address || null,
      gender: updatedData.gender || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth + 'T00:00:00').toISOString().split('T')[0] : null,
      currentPoints: updatedData.currentPoints ?? updatedData.ecoTokens ?? null,
      streak: updatedData.streak ?? null,
      roleId: updatedData.roleId ?? null,
    };

    // Remove null values
    Object.keys(backendData).forEach(key => {
      if (backendData[key] === null) {
        delete backendData[key];
      }
    });

    const response = await apiPatch(`/User/${userId}`, backendData, true); // Cần auth (Admin)

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

      // Nếu không có data, merge với updatedData và userId
      if (!userData) {
        userData = {
          ...updatedData,
          id: userId,
          userId: userId
        };
      } else {
        // Đảm bảo có id và userId
        userData.id = userId;
        userData.userId = userId;
      }

      return {
        success: true,
        message: response.message || 'Cập nhật user thành công',
        data: userData
      };
    }

    throw new Error(response.message || 'Cập nhật user thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Cập nhật user thất bại'
    };
  }
};

/**
 * Delete user API (Admin only)
 * DELETE /api/User/{userId}
 */
export const deleteUserApi = async (userId) => {
  try {
    const response = await apiDelete(`/User/${userId}`, true); // Cần auth (Admin)

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Xóa user thành công'
      };
    }

    throw new Error(response.message || 'Xóa user thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Xóa user thất bại'
    };
  }
};

/**
 * Search users API
 * Sử dụng getAllUsersApi và filter ở frontend
 */
export const searchUsersApi = async (searchTerm) => {
  try {
    const response = await getAllUsersApi();
    if (!response.success) {
      return [];
    }

    if (!searchTerm) {
      return response.data;
    }

    const term = searchTerm.toLowerCase();
    return response.data.filter(user =>
      user.username?.toLowerCase().includes(term) ||
      user.name?.toLowerCase().includes(term) ||
      user.nickname?.toLowerCase().includes(term) ||
      user.phone?.includes(term) ||
      user.phoneNumber?.includes(term)
    );
  } catch {
    return [];
  }
};

/**
 * Get leaderboard API
 * GET /api/User/leaderboard?sortBy={streak|tokens}&limit={limit}
 * @param {string} sortBy - 'streak' or 'tokens' (default: 'tokens')
 * @param {number|null} limit - Number of users to return (null = all users)
 */
export const getLeaderboardApi = async (sortBy = 'tokens', limit = null) => {
  try {
    let url = `/User/leaderboard?sortBy=${sortBy}`;
    if (limit !== null && limit > 0) {
      url += `&limit=${limit}`;
    }

    const response = await apiGet(url, false); // Public access

    if (response.success && response.data) {
      // Backend trả về ResponseDTO<List<LeaderboardDTO>> với Data chứa list
      // LeaderboardDTO đã có JsonPropertyName nên sẽ là camelCase
      let leaderboard = [];

      if (Array.isArray(response.data)) {
        leaderboard = response.data;
      } else if (response.data.Data && Array.isArray(response.data.Data)) {
        leaderboard = response.data.Data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        leaderboard = response.data.data;
      }

      // Map để đảm bảo format nhất quán (backend đã có JsonPropertyName nhưng vẫn cần fallback)
      const mappedLeaderboard = leaderboard.map(entry => {
        const userAvatar = entry.userAvatar || entry.UserAvatar || '🌱';
        const userAvatarImageRaw = entry.userAvatarImage || entry.UserAvatarImage;
        // Normalize userAvatarImage giống như Admin - nếu là base64 giữ nguyên, nếu là URL thì normalize
        const userAvatarImage = userAvatarImageRaw
          ? (userAvatarImageRaw.startsWith('data:image') ? userAvatarImageRaw : normalizeImageUrl(userAvatarImageRaw))
          : getAvatarImageUrl(userAvatar); // Fallback: kiểm tra xem userAvatar có phải là image URL không
        
        return {
          userId: entry.userId || entry.UserId,
          userName: entry.userName || entry.UserName || 'Người dùng',
          userAvatar: userAvatar,
          userAvatarImage: userAvatarImage,
          currentPoints: entry.currentPoints !== undefined ? entry.currentPoints : (entry.CurrentPoints || 0),
          streak: entry.streak !== undefined ? entry.streak : (entry.Streak || 0),
          rank: entry.rank !== undefined ? entry.rank : (entry.Rank || 0)
        };
      });

      return {
        success: true,
        message: response.message || 'Lấy bảng xếp hạng thành công',
        data: mappedLeaderboard
      };
    }

    return {
      success: false,
      message: response.message || 'Không thể lấy bảng xếp hạng',
      data: []
    };
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Không thể lấy bảng xếp hạng',
      data: []
    };
  }
};
