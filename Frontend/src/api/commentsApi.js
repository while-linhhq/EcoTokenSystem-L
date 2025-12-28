// ============================================
// COMMENTS API - GỌI BACKEND THẬT
// ============================================
import { apiPost, apiGet, apiDelete } from './apiClient';

/**
 * Create a comment on a post
 * POST /api/Comment/{postId}
 */
export const createCommentApi = async (postId, content) => {
  try {
    if (!content || !content.trim()) {
      return {
        success: false,
        message: 'Nội dung bình luận không được để trống',
        data: null
      };
    }

    const response = await apiPost(`/Comment/${postId}`, { content: content.trim() }, true); // Requires auth
    
    return {
      success: response.success || response.IsSuccess || false,
      message: response.message || response.Message || 'Bình luận đã được thêm thành công',
      data: response.data || response.Data
    };
  } catch (error) {
    console.error('[createCommentApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể thêm bình luận',
      data: null
    };
  }
};

/**
 * Get all comments for a post
 * GET /api/Comment/{postId}
 */
export const getPostCommentsApi = async (postId) => {
  try {
    const response = await apiGet(`/Comment/${postId}`, false); // Public access
    
    if (response.success || response.IsSuccess) {
      const comments = Array.isArray(response.data) ? response.data : 
                      (Array.isArray(response.Data) ? response.Data : []);
      
      return {
        success: true,
        message: response.message || response.Message || 'Lấy danh sách bình luận thành công',
        data: comments
      };
    }
    
    return {
      success: false,
      message: response.message || response.Message || 'Không thể lấy danh sách bình luận',
      data: []
    };
  } catch (error) {
    console.error('[getPostCommentsApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể lấy danh sách bình luận',
      data: []
    };
  }
};

/**
 * Delete a comment
 * DELETE /api/Comment/{commentId}
 */
export const deleteCommentApi = async (commentId) => {
  try {
    const response = await apiDelete(`/Comment/${commentId}`, true); // Requires auth
    
    return {
      success: response.success || response.IsSuccess || false,
      message: response.message || response.Message || 'Đã xóa bình luận thành công',
      data: response.data || response.Data
    };
  } catch (error) {
    console.error('[deleteCommentApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể xóa bình luận',
      data: null
    };
  }
};

