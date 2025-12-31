// ============================================
// POSTS API - GỌI BACKEND THẬT (Public Posts)
// ============================================
import { apiGet } from './apiClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5109/api';
const BACKEND_BASE_URL = API_BASE_URL.replace('/api', ''); // http://localhost:5109

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
 * Map PostsDTO từ backend sang format frontend
 */
const mapPostResponse = (backendPost) => {
  const imageUrl = normalizeImageUrl(backendPost.ImageUrl || backendPost.imageUrl || '');
  
  // Map user avatar - nếu là base64 thì giữ nguyên, nếu là URL path thì normalize
  const userAvatarImage = backendPost.UserAvatarImage || backendPost.userAvatarImage;
  const normalizedUserAvatarImage = userAvatarImage 
    ? (userAvatarImage.startsWith('data:image') ? userAvatarImage : normalizeImageUrl(userAvatarImage))
    : null;
  
  // Generate emoji avatar từ userName nếu không có avatar
  const userName = backendPost.UserName || backendPost.userName || 'Người dùng';
  const userAvatar = backendPost.UserAvatar || backendPost.userAvatar || generateAvatarEmoji(userName);
  
  return {
    id: backendPost.Id || backendPost.id,
    title: backendPost.Title || backendPost.title,
    content: backendPost.Content || backendPost.content,
    description: backendPost.Content || backendPost.content, // For backward compatibility
    imageUrl: imageUrl || null,
    userId: backendPost.UserId || backendPost.userId,
    statusId: backendPost.StatusId || backendPost.statusId,
    status: backendPost.StatusId === 1 ? 'pending' : (backendPost.StatusId === 2 ? 'approved' : 'rejected'),
    adminId: backendPost.AdminId || backendPost.adminId,
    awardedPoints: backendPost.AwardedPoints || backendPost.awardedPoints || 0,
    submittedAt: backendPost.SubmittedAt || backendPost.submittedAt,
    approvedRejectedAt: backendPost.ApprovedRejectedAt || backendPost.approvedRejectedAt,
    rejectionReason: backendPost.RejectionReason || backendPost.rejectionReason,
    userName: userName,
    userAvatar: userAvatar, // Emoji avatar
    userAvatarImage: normalizedUserAvatarImage, // Image avatar URL
    // Like and Comment information
    likesCount: backendPost.LikesCount || backendPost.likesCount || 0,
    comments: (backendPost.Comments || backendPost.comments || []).map(comment => ({
      id: comment.Id || comment.id,
      postId: comment.PostId || comment.postId,
      userId: comment.UserId || comment.userId,
      userName: comment.UserName || comment.userName || 'Người dùng',
      userAvatar: comment.UserAvatar || comment.userAvatar || generateAvatarEmoji(comment.UserName || comment.userName),
      userAvatarImage: normalizeImageUrl(comment.UserAvatarImage || comment.userAvatarImage),
      content: comment.Content || comment.content,
      createdAt: comment.CreatedAt || comment.createdAt
    })),
    isLikedByCurrentUser: backendPost.IsLikedByCurrentUser || backendPost.isLikedByCurrentUser || false,
  };
};

/**
 * Generate emoji avatar từ userName
 */
const generateAvatarEmoji = (userName) => {
  if (!userName) return '🌱';
  
  const avatars = ['🌱', '🌿', '🍃', '🌳', '🌲', '🌴', '🦋', '🐢', '🦎', '🌍'];
  // Dùng hash của userName để chọn emoji nhất quán
  let hash = 0;
  for (let i = 0; i < userName.length; i++) {
    hash = userName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatars[Math.abs(hash) % avatars.length];
};

/**
 * Get approved posts (public feed)
 * GET /api/Post?statusId=2
 * Public endpoint - không cần authentication
 */
export const getApprovedPostsApi = async () => {
  try {
    console.log('[getApprovedPostsApi] ===== Starting API call =====');
    console.log('[getApprovedPostsApi] Endpoint: /Post?statusId=2');
    console.log('[getApprovedPostsApi] Auth required: false (public)');
    
    const response = await apiGet('/Post?statusId=2', false); // Không cần auth - public feed

    console.log('[getApprovedPostsApi] Raw API response:', {
      success: response.success,
      message: response.message,
      hasData: !!response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'N/A'
    });

    if (response.success && response.data) {
      // Xử lý nhiều format response có thể có
      let posts = [];
      
      if (Array.isArray(response.data)) {
        posts = response.data;
        console.log('[getApprovedPostsApi] Data is array, length:', posts.length);
      } else if (response.data?.Data && Array.isArray(response.data.Data)) {
        posts = response.data.Data;
        console.log('[getApprovedPostsApi] Data.Data is array, length:', posts.length);
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        posts = response.data.data;
        console.log('[getApprovedPostsApi] Data.data is array, length:', posts.length);
      } else {
        console.warn('[getApprovedPostsApi] Unexpected data format:', response.data);
        posts = [];
      }
      
      if (posts.length > 0) {
        console.log('[getApprovedPostsApi] Sample post (before mapping):', {
          Id: posts[0].Id || posts[0].id,
          Title: posts[0].Title || posts[0].title,
          StatusId: posts[0].StatusId || posts[0].statusId,
          UserName: posts[0].UserName || posts[0].userName,
          ImageUrl: posts[0].ImageUrl || posts[0].imageUrl,
          ApprovedRejectedAt: posts[0].ApprovedRejectedAt || posts[0].approvedRejectedAt
        });
      }
      
      const mappedPosts = posts.map((post, index) => {
        const mapped = mapPostResponse(post);
        if (index === 0) {
          console.log('[getApprovedPostsApi] Sample post (after mapping):', mapped);
        }
        return mapped;
      });
      
      console.log('[getApprovedPostsApi] ===== Success =====');
      console.log('[getApprovedPostsApi] Total posts:', mappedPosts.length);
      
      return {
        success: true,
        message: response.message || 'Lấy danh sách bài đăng thành công',
        data: mappedPosts
      };
    }

    // Nếu không có data nhưng success = true, trả về empty array
    if (response.success) {
      console.log('[getApprovedPostsApi] ===== No posts found =====');
      console.log('[getApprovedPostsApi] Response message:', response.message);
      return {
        success: true,
        message: response.message || 'Chưa có bài đăng nào được duyệt',
        data: []
      };
    }

    console.error('[getApprovedPostsApi] ===== Failed =====');
    console.error('[getApprovedPostsApi] Response:', response);
    throw new Error(response.message || 'Không thể lấy danh sách bài đăng');
  } catch (error) {
    console.error('[getApprovedPostsApi] ===== Error =====');
    console.error('[getApprovedPostsApi] Error details:', error);
    console.error('[getApprovedPostsApi] Error message:', error.message);
    console.error('[getApprovedPostsApi] Error stack:', error.stack);
    return {
      success: false,
      message: error.message || 'Không thể lấy danh sách bài đăng',
      data: []
    };
  }
};

