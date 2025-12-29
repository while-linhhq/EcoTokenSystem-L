// ============================================
// ADMIN EXCHANGES API - GỌI BACKEND THẬT
// ============================================
import { apiGet, apiPatch } from './apiClient';

/**
 * Map ItemsHistoryDTO từ backend sang format frontend (admin view)
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
    price: backendHistory.ItemRequiredPoints || backendHistory.itemRequiredPoints || 0,
    exchangedAt: backendHistory.RedemptionDate || backendHistory.redemptionDate,
    isShipped: backendHistory.IsShipped !== undefined ? backendHistory.IsShipped : (backendHistory.isShipped || false),
    userName: backendHistory.UserName || backendHistory.userName || '',
    userPhoneNumber: backendHistory.UserPhoneNumber || backendHistory.userPhoneNumber || '',
    userAddress: backendHistory.UserAddress || backendHistory.userAddress || ''
  };
};

/**
 * Get all exchanges API (Admin only)
 * GET /api/Items/history/all
 */
export const getAllExchangesApi = async () => {
  try {
    console.log('[getAllExchangesApi] Calling GET /Items/history/all...');
    const response = await apiGet('/Items/history/all', true); // Cần auth (Admin)

    console.log('[getAllExchangesApi] Raw response:', {
      success: response.success,
      hasData: !!response.data,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : 'N/A',
      data: response.data
    });

    if (response.success && response.data) {
      let historyItems = [];
      
      // apiGet đã xử lý ResponseDTO và trả về data.Data (hoặc data.data)
      // Nên response.data ở đây đã là List<ItemsHistoryDTO> (array)
      if (Array.isArray(response.data)) {
        historyItems = response.data;
      } else if (response.data.Data && Array.isArray(response.data.Data)) {
        // Fallback: nếu vẫn còn ResponseDTO wrapper
        historyItems = response.data.Data;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // Fallback: lowercase data property
        historyItems = response.data.data;
      }

      console.log('[getAllExchangesApi] History items found:', historyItems.length);
      if (historyItems.length > 0) {
        console.log('[getAllExchangesApi] First item:', historyItems[0]);
      }

      // Map từng item
      const mappedHistory = historyItems.map(mapItemsHistoryResponse);

      console.log('[getAllExchangesApi] Mapped history:', mappedHistory.length);
      if (mappedHistory.length > 0) {
        console.log('[getAllExchangesApi] First mapped item:', mappedHistory[0]);
      }

      return {
        success: true,
        message: response.message || 'Lấy danh sách đổi quà thành công',
        data: mappedHistory
      };
    }

    // Nếu không có data hoặc success = false, trả về empty array
    console.warn('[getAllExchangesApi] No data or success = false:', {
      success: response.success,
      message: response.message,
      hasData: !!response.data
    });
    return {
      success: response.success || false,
      message: response.message || 'Không thể lấy danh sách đổi quà',
      data: []
    };
  } catch (error) {
    console.error('[getAllExchangesApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể lấy danh sách đổi quà',
      data: []
    };
  }
};

/**
 * Update shipped status API (Admin only)
 * PATCH /api/Items/history/{historyId}/shipped
 */
export const updateShippedStatusApi = async (historyId, isShipped) => {
  try {
    // Backend expects [FromBody] bool
    // JSON.stringify on boolean creates valid JSON boolean (not string), which ASP.NET Core can parse
    // Using apiPatch but wrapping boolean in an object, or use fetch directly
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5109/api';
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    const token = user?.token || user?.Token || null;
    
    if (!token) {
      throw new Error('Không tìm thấy token. Vui lòng đăng nhập lại.');
    }
    
    // Send boolean value as JSON boolean (JSON.stringify converts true/false to "true"/"false" JSON literals)
    const response = await fetch(`${API_BASE_URL}/Items/history/${historyId}/shipped`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(isShipped) // JSON.stringify(true) creates string body "true" (JSON boolean literal)
    });

    if (response.status === 401) {
      throw new Error('Unauthorized: Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.');
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      if (isJson) {
        try {
          const errorData = await response.json();
          errorMessage = errorData.Message || errorData.message || errorMessage;
        } catch (e) {
          // Ignore JSON parse error
        }
      }
      throw new Error(errorMessage);
    }

    if (isJson) {
      const data = await response.json();
      
      return {
        success: data.IsSuccess !== false,
        message: data.Message || data.message || (isShipped ? 'Đã đánh dấu đã gửi đơn' : 'Đã bỏ đánh dấu đã gửi đơn')
      };
    }

    return {
      success: true,
      message: isShipped ? 'Đã đánh dấu đã gửi đơn' : 'Đã bỏ đánh dấu đã gửi đơn'
    };
  } catch (error) {
    console.error('[updateShippedStatusApi] Error:', error);
    return {
      success: false,
      message: error.message || 'Không thể cập nhật trạng thái'
    };
  }
};

