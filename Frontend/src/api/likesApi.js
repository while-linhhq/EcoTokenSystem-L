// ============================================
// LIKES API - GỌI BACKEND THẬT
// ============================================
import { apiPost, apiGet } from './apiClient';

/**
 * Toggle like on a post (add if not liked, remove if already liked)
 * POST /api/Like/{postId}
 */
export const toggleLikeApi = async (postId) => {
  try {
    const response = await apiPost(`/Like/${postId}`, {}, true); // Requires auth
    
    return {
      success: response.success || response.IsSuccess || false,
      message: response.message || response.Message || 'Thao tác thành công',
      data: response.data || response.Data
    };
  } catch (error) {
    console.error('[toggleLikeApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể thực hiện thao tác thích',
      data: null
    };
  }
};

/**
 * Get all likes for a post
 * GET /api/Like/{postId}
 */
export const getPostLikesApi = async (postId) => {
  try {
    const response = await apiGet(`/Like/${postId}`, false); // Public access
    
    if (response.success || response.IsSuccess) {
      const likes = Array.isArray(response.data) ? response.data : 
                   (Array.isArray(response.Data) ? response.Data : []);
      
      return {
        success: true,
        message: response.message || response.Message || 'Lấy danh sách lượt thích thành công',
        data: likes
      };
    }
    
    return {
      success: false,
      message: response.message || response.Message || 'Không thể lấy danh sách lượt thích',
      data: []
    };
  } catch (error) {
    console.error('[getPostLikesApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể lấy danh sách lượt thích',
      data: []
    };
  }
};

