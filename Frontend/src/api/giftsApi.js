// ============================================
// GIFTS API - GỌI BACKEND THẬT (Items API)
// ============================================
import { apiGet, apiPost } from './apiClient';
import { getCurrentUserApi } from './authApi';

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
 * Map ItemsDTO từ backend sang format frontend
 */
const mapItemResponse = (backendItem) => {
  const imageUrl = normalizeImageUrl(backendItem.ImageUrl || backendItem.imageUrl || '');
  
  return {
    id: backendItem.Id || backendItem.id,
    name: backendItem.Name || backendItem.name,
    price: backendItem.RequiredPoints || backendItem.requiredPoints || backendItem.price,
    requiredPoints: backendItem.RequiredPoints || backendItem.requiredPoints,
    imageUrl: imageUrl,
    image: imageUrl, // Để tương thích với code cũ (dùng cho display)
    description: backendItem.Description || backendItem.description || '',
    tag: backendItem.Tag || backendItem.tag || '',
  };
};

/**
 * Get all items/gifts API
 * GET /api/Items
 */
export const getGiftsApi = async () => {
  try {
    console.log('[getGiftsApi] Calling GET /Items...');
    const response = await apiGet('/Items', false); // Không cần auth để xem items

    console.log('[getGiftsApi] Response:', {
      success: response.success,
      hasData: !!response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A',
      fullResponse: response
    });

    // Xử lý cả trường hợp response.success = true và false (nhưng có data)
    let items = [];
    
    if (response.success && response.data) {
      // Backend trả về array trong response.data
      if (Array.isArray(response.data)) {
        items = response.data;
      } else if (response.data.Data && Array.isArray(response.data.Data)) {
        items = response.data.Data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        items = response.data.data;
      } else {
        console.warn('[getGiftsApi] Unexpected data format:', response.data);
        items = [];
      }
    } else if (response.data && Array.isArray(response.data)) {
      // Trường hợp IsSuccess = false nhưng có Data = []
      items = response.data;
    }
    
    console.log('[getGiftsApi] Items found:', items.length);
    
    // Map từng item
    const mappedItems = items.map(mapItemResponse);
    
    console.log('[getGiftsApi] Mapped items:', mappedItems.length, mappedItems);
    
    return {
      success: true,
      message: response.message || 'Lấy danh sách quà thành công',
      data: mappedItems
    };
  } catch (error) {
    console.error('[getGiftsApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể lấy danh sách quà',
      data: []
    };
  }
};

/**
 * Exchange gift/item API
 * POST /api/Items/{itemId}
 */
export const exchangeGiftApi = async (userId, giftId, giftPrice) => {
  try {
    // Backend endpoint: POST /api/Items/{itemId}
    // Không cần body, chỉ cần itemId trong URL
    const response = await apiPost(`/Items/${giftId}`, {}, true); // Cần auth, body rỗng

    if (response.success) {
      // Lấy lại thông tin user để có currentPoints mới
      const userResponse = await getCurrentUserApi().catch(() => null);

      const remainingTokens = userResponse?.data?.currentPoints || userResponse?.data?.CurrentPoints || 0;

      return {
        success: true,
        message: response.message || `Đổi quà thành công! Bạn còn ${remainingTokens} điểm.`,
        data: {
          remainingTokens: remainingTokens
        }
      };
    }

    throw new Error(response.message || 'Đổi quà thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Đổi quà thất bại'
    };
  }
};
