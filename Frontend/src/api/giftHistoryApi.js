// ============================================
// GIFT HISTORY API - GỌI BACKEND THẬT
// ============================================
import { apiGet } from './apiClient';

/**
 * Map ItemsHistoryDTO từ backend sang format frontend
 */
const mapItemsHistoryResponse = (backendHistory) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5109/api';
  const BACKEND_BASE_URL = API_BASE_URL.replace('/api', ''); // http://localhost:5109

  let imageUrl = backendHistory.ItemImageUrl || backendHistory.itemImageUrl || '';
  
  // Nếu là relative path, prepend base URL
  if (imageUrl && imageUrl.startsWith('/')) {
    imageUrl = `${BACKEND_BASE_URL}${imageUrl}`;
  } else if (imageUrl && !imageUrl.startsWith('http')) {
    imageUrl = `${BACKEND_BASE_URL}/${imageUrl}`;
  }

  return {
    id: backendHistory.Id || backendHistory.id,
    userId: backendHistory.UserId || backendHistory.userId,
    giftId: backendHistory.ItemId || backendHistory.itemId,
    giftName: backendHistory.ItemName || backendHistory.itemName || '',
    giftImage: imageUrl,
    giftImageUrl: imageUrl,
    giftDescription: '', // Backend không có description trong ItemsHistory, có thể thêm sau
    price: backendHistory.ItemRequiredPoints || backendHistory.itemRequiredPoints || 0,
    exchangedAt: backendHistory.RedemptionDate || backendHistory.redemptionDate,
    tokensBefore: 0, // Không có trong backend, có thể tính từ PointHistory sau
    tokensAfter: 0 // Không có trong backend, có thể tính từ PointHistory sau
  };
};

/**
 * Get gift history API
 * GET /api/Items/history
 */
export const getGiftHistoryApi = async (userId = null) => {
  try {
    console.log('[getGiftHistoryApi] Calling GET /Items/history...');
    
    // Backend endpoint tự động lấy userId từ token
    const response = await apiGet('/Items/history', true); // Cần auth

    console.log('[getGiftHistoryApi] Response:', {
      success: response.success,
      hasData: !!response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      dataLength: Array.isArray(response.data) ? response.data.length : 'N/A'
    });

    if (response.success && response.data) {
      let historyItems = [];
      
      if (Array.isArray(response.data)) {
        historyItems = response.data;
      } else if (response.data.Data && Array.isArray(response.data.Data)) {
        historyItems = response.data.Data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        historyItems = response.data.data;
      }

      // Map từng item
      const mappedHistory = historyItems.map(mapItemsHistoryResponse);

      console.log('[getGiftHistoryApi] Mapped history:', mappedHistory.length);

      return {
        success: true,
        message: response.message || 'Lấy lịch sử đổi quà thành công',
        data: mappedHistory
      };
    }

    throw new Error(response.message || 'Không thể lấy lịch sử đổi quà');
  } catch (error) {
    console.error('[getGiftHistoryApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể lấy lịch sử đổi quà',
      data: []
    };
  }
};
