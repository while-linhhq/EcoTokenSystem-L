// ============================================
// ACTIONS API - GỌI BACKEND THẬT (Posts API)
// ============================================
import { apiPost, apiGet, apiPatch } from './apiClient';

// Base URL của backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5109/api';
const BACKEND_BASE_URL = API_BASE_URL.replace('/api', '');

/**
 * Helper function để xử lý image URL
 * Chuyển relative path thành absolute URL
 */
const normalizeImageUrl = (imageUrl) => {
  if (!imageUrl) return '';

  // Nếu đã là absolute URL (http/https), giữ nguyên
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }

  // Nếu là relative path từ root (bắt đầu với /)
  if (imageUrl.startsWith('/')) {
    return `${BACKEND_BASE_URL}${imageUrl}`;
  }

  // Nếu là relative path không có leading slash
  return `${BACKEND_BASE_URL}/${imageUrl}`;
};

/**
 * Submit action (Create Post)
 * POST /api/Post
 */
export const submitActionApi = async (actionData) => {
  try {
    console.log('[submitActionApi] Bắt đầu submit action:', {
      hasImageFile: !!(actionData.image || actionData.imageFile),
      title: actionData.title,
      content: actionData.content || actionData.description
    });

    // Tạo FormData để upload ảnh
    const formData = new FormData();
    // Ưu tiên title từ actionData, fallback sang description nếu không có
    const title = actionData.title || actionData.description || 'Hành động xanh';
    // Ưu tiên content từ actionData, fallback sang description nếu không có
    const content = actionData.content || actionData.description || '';

    // Validate title và content
    if (!title.trim()) {
      throw new Error('Tiêu đề không được để trống');
    }
    if (!content.trim()) {
      throw new Error('Nội dung không được để trống');
    }

    formData.append('title', title.trim());
    formData.append('content', content.trim());

    if (actionData.image || actionData.imageFile) {
      formData.append('imageFile', actionData.image || actionData.imageFile);
      console.log('[submitActionApi] Đã thêm imageFile vào FormData');
    }

    console.log('[submitActionApi] Gọi API POST /Post...');
    const response = await apiPost('/Post', formData, true, true); // isFormData = true

    console.log('[submitActionApi] API response:', {
      success: response.success,
      message: response.message,
      hasData: !!response.data
    });

    if (response.success) {
      // Backend không trả về Data trong ResponseDTO (non-generic)
      // Frontend sẽ reload từ API sau khi tạo thành công để lấy đầy đủ thông tin
      console.log('[submitActionApi] ✅ Submit thành công, sẽ reload từ API');
      return {
        success: true,
        message: response.message || 'Đã gửi hành động xanh! Vui lòng chờ kiểm duyệt',
        data: {
          id: Date.now(), // Tạm thời, sẽ được reload từ API
          ...actionData,
          status: 'pending', // StatusId = 1 (Pending) - đúng với backend
          statusId: 1, // Đảm bảo statusId = 1
          submittedAt: new Date().toISOString()
        }
      };
    }

    console.error('[submitActionApi] ❌ Submit thất bại:', response.message);
    throw new Error(response.message || 'Gửi hành động thất bại');
  } catch (error) {
    console.error('[submitActionApi] Exception:', error);
    return {
      success: false,
      message: error.message || 'Gửi hành động thất bại'
    };
  }
};

/**
 * Get user posts/actions
 * GET /api/User/me/posts?statusId=1 (pending)
 */
export const getUserActionsApi = async (userId, statusId = null) => {
  try {
    let endpoint = '/User/me/posts';
    if (statusId !== null) {
      endpoint += `?statusId=${statusId}`;
    }

    console.log('[getUserActionsApi] Calling endpoint:', endpoint);
    const response = await apiGet(endpoint, true);

    if (response.success && response.data) {
      const posts = Array.isArray(response.data) ? response.data : [];

      // Map posts sang format actions
      // Backend trả về PostsDTO với Id (Guid), cần map đúng
      const actions = posts.map(post => {
        const imageUrl = normalizeImageUrl(post.ImageUrl || post.imageUrl || '');

        // Map StatusId sang status string - QUAN TRỌNG: Phải map đúng
        // 1 = Pending, 2 = Approved, 3 = Rejected
        const statusId = post.StatusId || post.statusId;
        const postId = post.Id || post.id;

        // Log để debug nếu StatusId không hợp lệ
        if (statusId === undefined || statusId === null) {
          console.warn(`[getUserActionsApi] ⚠️ Post ${postId} không có StatusId!`, post);
        }

        let status = 'pending'; // Default
        if (statusId === 1) {
          status = 'pending';
        } else if (statusId === 2) {
          status = 'approved';
        } else if (statusId === 3) {
          status = 'rejected';
        } else {
          // Nếu StatusId không phải 1, 2, 3, log warning và default to pending
          console.warn(`[getUserActionsApi] ⚠️ Unknown StatusId: ${statusId} for post ${postId}. Defaulting to 'pending'.`, {
            postId,
            statusId,
            post: post
          });
          status = 'pending';
        }

        // Log để debug mapping
        if (statusId === 3) {
          console.log(`[getUserActionsApi] 🔍 Post ${postId} có StatusId = 3 (Rejected):`, {
            postId,
            statusId,
            status,
            rejectionReason: post.RejectionReason || post.rejectionReason,
            approvedRejectedAt: post.ApprovedRejectedAt || post.approvedRejectedAt
          });
        }

        // Map rewards từ awardedPoints và status
        // Mỗi action approved = 1 streak (theo logic backend UpdateUserStreakAsync)
        const awardedPoints = post.AwardedPoints ?? post.awardedPoints ?? 0;
        const rewards = status === 'approved' ? {
          streak: 1, // Mỗi lần approve = 1 streak
          ecoTokens: awardedPoints
        } : null;

        // Map user avatar từ PostsDTO
        const userAvatar = post.UserAvatar || post.userAvatar || '🌱';
        const userAvatarImage = post.UserAvatarImage || post.userAvatarImage || null;

        return {
          id: postId,
          userId: post.UserId || post.userId || userId,
          userName: post.UserName || post.userName || 'Người dùng',
          userAvatar: userAvatar,
          userAvatarImage: userAvatarImage,
          title: post.Title || post.title || '',
          description: post.Content || post.content || '',
          image: imageUrl,
          imageUrl: imageUrl,
          imagePreview: imageUrl, // Để tương thích với Moderator page
          status: status, // Đã map đúng từ StatusId
          statusId: statusId || 1, // Default to 1 nếu không có
          submittedAt: post.SubmittedAt || post.submittedAt,
          approvedRejectedAt: post.ApprovedRejectedAt || post.approvedRejectedAt,
          reviewedAt: post.ApprovedRejectedAt || post.approvedRejectedAt, // Alias cho ActionHistory
          rejectionReason: post.RejectionReason || post.rejectionReason,
          awardedPoints: awardedPoints,
          rewards: rewards, // Thêm rewards để ActionHistory có thể hiển thị
        };
      });

      return {
        success: true,
        message: response.message || 'Lấy danh sách hành động thành công',
        data: actions
      };
    }

    throw new Error(response.message || 'Không thể lấy danh sách hành động');
  } catch (error) {
    // Nếu lỗi 401, có nghĩa là token không hợp lệ hoặc chưa sẵn sàng
    if (error.status === 401 || error.message.includes('401') || error.message.includes('Unauthorized')) {
      console.warn('[getUserActionsApi] 401 Unauthorized - token may not be ready yet:', error.message);
      return {
        success: false,
        message: 'Chưa đăng nhập hoặc token không hợp lệ',
        data: []
      };
    }
    console.error('[getUserActionsApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể lấy danh sách hành động',
      data: []
    };
  }
};

/**
 * Get pending actions (for moderator/admin)
 * GET /api/Post?statusId=1
 */
export const getPendingActionsApi = async () => {
  try {
    console.log('[getPendingActionsApi] Fetching pending posts from /Post?statusId=1...');
    const response = await apiGet('/Post?statusId=1', true); // Cần auth (Moderator/Admin)
    console.log('[getPendingActionsApi] Full response:', {
      success: response.success,
      message: response.message,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      data: response.data
    });

    if (response.success) {
      // apiGet đã parse ResponseDTO và trả về response.data là array trực tiếp
      let posts = [];
      if (Array.isArray(response.data)) {
        posts = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Fallback: nếu response.data là object, thử lấy Data property
        if (Array.isArray(response.data.Data)) {
          posts = response.data.Data;
        } else if (Array.isArray(response.data.data)) {
          posts = response.data.data;
        }
      }

      console.log('[getPendingActionsApi] Parsed', posts.length, 'pending posts from response');

      if (posts.length === 0) {
        console.log('[getPendingActionsApi] ℹ️ No pending posts found (this is normal if there are no pending posts)');
      }

      // Map posts sang format actions
      const actions = posts.map(post => {
        const postId = post.Id || post.id;
        const imageUrl = normalizeImageUrl(post.ImageUrl || post.imageUrl || '');

        const statusId = post.StatusId || post.statusId || 1;
        let status = 'pending';
        if (statusId === 1) status = 'pending';
        else if (statusId === 2) status = 'approved';
        else if (statusId === 3) status = 'rejected';

        // Lấy thông tin user từ DTO (đã được map từ PostService)
        const userName = post.UserName || post.userName || 'Người dùng';
        const userAvatar = post.UserAvatar || post.userAvatar || '🌱';
        const userAvatarImage = post.UserAvatarImage || post.userAvatarImage || null;

        const awardedPoints = post.AwardedPoints ?? post.awardedPoints ?? 0;
        const rewards = status === 'approved' ? {
          streak: 1, // Mỗi lần approve = 1 streak
          ecoTokens: awardedPoints
        } : null;

        return {
          id: postId,
          userId: post.UserId || post.userId,
          userName: userName,
          userAvatar: userAvatar,
          userAvatarImage: userAvatarImage,
          title: post.Title || post.title || '',
          description: post.Content || post.content || '',
          content: post.Content || post.content || '',
          image: imageUrl,
          imageUrl: imageUrl,
          imagePreview: imageUrl,
          status: status,
          statusId: statusId,
          adminId: post.AdminId || post.adminId || null, // Thêm AdminId để filter theo moderator
          submittedAt: post.SubmittedAt || post.submittedAt,
          approvedRejectedAt: post.ApprovedRejectedAt || post.approvedRejectedAt,
          reviewedAt: post.ApprovedRejectedAt || post.approvedRejectedAt, // Alias cho ActionHistory
          awardedPoints: awardedPoints,
          rewards: rewards, // Thêm rewards để ActionHistory có thể hiển thị
          rejectionReason: post.RejectionReason || post.rejectionReason,
        };
      });

      return {
        success: true,
        message: response.message || 'Lấy danh sách hành động chờ duyệt thành công',
        data: actions
      };
    }

    // Nếu response.success = false hoặc không có data, trả về empty array
    console.warn('[getPendingActionsApi] Response không thành công hoặc không có data:', response);
    return {
      success: false,
      message: response.message || 'Không thể lấy danh sách hành động chờ duyệt',
      data: []
    };
  } catch (error) {
    console.error('[getPendingActionsApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể lấy danh sách hành động chờ duyệt',
      data: []
    };
  }
};

/**
 * Get approved actions (for moderator/admin)
 * GET /api/Post?statusId=2
 */
export const getApprovedActionsApi = async () => {
  try {
    console.log('[getApprovedActionsApi] Fetching approved posts from /Post?statusId=2...');
    const response = await apiGet('/Post?statusId=2', false); // Approved posts là public
    console.log('[getApprovedActionsApi] Full response:', {
      success: response.success,
      message: response.message,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      data: response.data
    });

    if (response.success) {
      // apiGet đã parse ResponseDTO và trả về response.data là array trực tiếp
      let posts = [];
      if (Array.isArray(response.data)) {
        posts = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Fallback: nếu response.data là object, thử lấy Data property
        if (Array.isArray(response.data.Data)) {
          posts = response.data.Data;
        } else if (Array.isArray(response.data.data)) {
          posts = response.data.data;
        }
      }

      console.log('[getApprovedActionsApi] Parsed', posts.length, 'approved posts from response');

      const actions = posts.map(post => {
        const postId = post.Id || post.id;
        const imageUrl = normalizeImageUrl(post.ImageUrl || post.imageUrl || '');

        const userName = post.UserName || post.userName || 'Người dùng';
        const userAvatar = post.UserAvatar || post.userAvatar || '🌱';
        const userAvatarImage = post.UserAvatarImage || post.userAvatarImage || null;

        const awardedPoints = post.AwardedPoints ?? post.awardedPoints ?? 0;
        const rewards = {
          streak: 1, // Mỗi lần approve = 1 streak
          ecoTokens: awardedPoints
        };

        return {
          id: postId,
          userId: post.UserId || post.userId,
          userName: userName,
          userAvatar: userAvatar,
          userAvatarImage: userAvatarImage,
          title: post.Title || post.title || '',
          description: post.Content || post.content || '',
          content: post.Content || post.content || '',
          image: imageUrl,
          imageUrl: imageUrl,
          imagePreview: imageUrl,
          status: 'approved',
          statusId: 2,
          adminId: post.AdminId || post.adminId || null, // Thêm AdminId để filter theo moderator
          submittedAt: post.SubmittedAt || post.submittedAt,
          approvedRejectedAt: post.ApprovedRejectedAt || post.approvedRejectedAt,
          reviewedAt: post.ApprovedRejectedAt || post.approvedRejectedAt,
          comment: '', // Approved posts không có comment từ backend, có thể thêm sau nếu cần
          awardedPoints: awardedPoints,
          rewards: rewards,
        };
      });

      return {
        success: true,
        message: response.message || 'Lấy danh sách hành động đã duyệt thành công',
        data: actions
      };
    }

    // Nếu response.success = false hoặc không có data, trả về empty array
    console.warn('[getApprovedActionsApi] Response không thành công hoặc không có data:', response);
    return {
      success: false,
      message: response.message || 'Không thể lấy danh sách hành động đã duyệt',
      data: []
    };
  } catch (error) {
    console.error('[getApprovedActionsApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể lấy danh sách hành động đã duyệt',
      data: []
    };
  }
};

/**
 * Get rejected actions (for moderator/admin)
 * GET /api/Post?statusId=3
 */
export const getRejectedActionsApi = async () => {
  try {
    console.log('[getRejectedActionsApi] Fetching rejected posts from /Post?statusId=3...');
    const response = await apiGet('/Post?statusId=3', true); // Cần auth (Moderator/Admin)
    console.log('[getRejectedActionsApi] Full response:', {
      success: response.success,
      message: response.message,
      dataType: Array.isArray(response.data) ? 'array' : typeof response.data,
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      data: response.data
    });

    if (response.success) {
      // apiGet đã parse ResponseDTO và trả về response.data là array trực tiếp
      let posts = [];
      if (Array.isArray(response.data)) {
        posts = response.data;
      } else if (response.data && typeof response.data === 'object') {
        // Fallback: nếu response.data là object, thử lấy Data property
        if (Array.isArray(response.data.Data)) {
          posts = response.data.Data;
        } else if (Array.isArray(response.data.data)) {
          posts = response.data.data;
        }
      }

      console.log('[getRejectedActionsApi] Parsed', posts.length, 'rejected posts from response');

      const actions = posts.map(post => {
        const postId = post.Id || post.id;
        const imageUrl = normalizeImageUrl(post.ImageUrl || post.imageUrl || '');

        const userName = post.UserName || post.userName || 'Người dùng';
        const userAvatar = post.UserAvatar || post.userAvatar || '🌱';
        const userAvatarImage = post.UserAvatarImage || post.userAvatarImage || null;

        const awardedPoints = post.AwardedPoints ?? post.awardedPoints ?? 0;
        const rewards = null; // Rejected actions không có rewards

        return {
          id: postId,
          userId: post.UserId || post.userId,
          userName: userName,
          userAvatar: userAvatar,
          userAvatarImage: userAvatarImage,
          title: post.Title || post.title || '',
          description: post.Content || post.content || '',
          content: post.Content || post.content || '',
          image: imageUrl,
          imageUrl: imageUrl,
          imagePreview: imageUrl,
          status: 'rejected',
          statusId: 3,
          adminId: post.AdminId || post.adminId || null, // Thêm AdminId để filter theo moderator
          submittedAt: post.SubmittedAt || post.submittedAt,
          approvedRejectedAt: post.ApprovedRejectedAt || post.approvedRejectedAt,
          reviewedAt: post.ApprovedRejectedAt || post.approvedRejectedAt,
          comment: post.RejectionReason || post.rejectionReason || '', // Map rejectionReason thành comment để hiển thị
          rejectionReason: post.RejectionReason || post.rejectionReason,
          awardedPoints: awardedPoints,
          rewards: rewards,
        };
      });

      return {
        success: true,
        message: response.message || 'Lấy danh sách hành động đã từ chối thành công',
        data: actions
      };
    }

    // Nếu response.success = false hoặc không có data, trả về empty array
    console.warn('[getRejectedActionsApi] Response không thành công hoặc không có data:', response);
    return {
      success: false,
      message: response.message || 'Không thể lấy danh sách hành động đã từ chối',
      data: []
    };
  } catch (error) {
    console.error('[getRejectedActionsApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể lấy danh sách hành động đã từ chối',
      data: []
    };
  }
};

/**
 * Approve action (Admin only)
 * PATCH /api/Post/{postId}
 */
export const approveActionApi = async (actionId, comment = '', rewards = { streak: 1, ecoTokens: 10 }) => {
  try {
    // Backend cần: statusId, awardedPoints, RejectReason
    const response = await apiPatch(`/Post/${actionId}`, {
      statusId: 2, // Approved
      awardedPoints: rewards.ecoTokens || 10,
      RejectReason: null // Phải null khi approve
    }, true);

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Đã duyệt hành động thành công',
        data: {
          id: actionId,
          status: 'approved',
          statusId: 2,
          comment: comment,
          rewards: rewards
        }
      };
    }

    throw new Error(response.message || 'Duyệt hành động thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Duyệt hành động thất bại'
    };
  }
};

/**
 * Reject action (Admin only)
 * PATCH /api/Post/{postId}
 */
export const rejectActionApi = async (actionId, comment) => {
  try {
    // Backend cần: statusId, awardedPoints, RejectReason
    const response = await apiPatch(`/Post/${actionId}`, {
      statusId: 3, // Rejected
      awardedPoints: 0,
      RejectReason: comment || 'Không đạt yêu cầu'
    }, true);

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Đã từ chối hành động',
        data: {
          id: actionId,
          status: 'rejected',
          statusId: 3,
          comment: comment,
          rejectionReason: comment
        }
      };
    }

    throw new Error(response.message || 'Từ chối hành động thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Từ chối hành động thất bại'
    };
  }
};
