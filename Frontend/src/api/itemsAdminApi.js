// ============================================
// ITEMS ADMIN API - QUẢN LÝ ITEMS (Admin only)
// ============================================
import { apiGet, apiPost, apiPatch, apiDelete } from './apiClient';
import { getGiftsApi } from './giftsApi';

/**
 * Add new item API (Admin only)
 * POST /api/Items
 */
export const addItemApi = async (itemData) => {
  try {
    // Kiểm tra token trước khi gọi API
    const token = localStorage.getItem('user');
    if (!token) {
      throw new Error('Chưa đăng nhập. Vui lòng đăng nhập lại.');
    }

    // Tạo FormData để upload ảnh
    const formData = new FormData();
    formData.append('name', itemData.name || '');
    formData.append('requiredPoints', itemData.requiredPoints || itemData.price || 0);
    formData.append('tag', itemData.tag || 'handmade');

    if (itemData.imageFile) {
      formData.append('imageItem', itemData.imageFile);
    }

    console.log('[addItemApi] Request:', {
      name: itemData.name,
      requiredPoints: itemData.requiredPoints || itemData.price,
      tag: itemData.tag || 'handmade',
      hasImage: !!itemData.imageFile,
      hasToken: !!token
    });

    const response = await apiPost('/Items', formData, true, true); // Cần auth (Admin), FormData

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Thêm item thành công',
        data: itemData
      };
    }

    throw new Error(response.message || 'Thêm item thất bại');
  } catch (error) {
    console.error('[addItemApi] Error:', error);
    
    // Nếu là lỗi 401, thông báo rõ ràng
    if (error.message && error.message.includes('Unauthorized')) {
      return {
        success: false,
        message: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
      };
    }
    
    return {
      success: false,
      message: error.message || 'Thêm item thất bại'
    };
  }
};

/**
 * Update item API (Admin only)
 * PATCH /api/Items/{itemId}
 */
export const updateItemApi = async (itemId, itemData) => {
  try {
    // Tạo FormData để upload ảnh
    const formData = new FormData();
    formData.append('name', itemData.name || '');
    formData.append('requiredPoints', itemData.requiredPoints || itemData.price || 0);
    formData.append('tag', itemData.tag || 'handmade');

    if (itemData.imageFile) {
      formData.append('imageItem', itemData.imageFile);
    }

    const response = await apiPatch(`/Items/${itemId}`, formData, true, true); // Cần auth (Admin), FormData

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Cập nhật item thành công',
        data: { ...itemData, id: itemId }
      };
    }

    throw new Error(response.message || 'Cập nhật item thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Cập nhật item thất bại'
    };
  }
};

/**
 * Delete item API (Admin only)
 * DELETE /api/Items/{itemId}
 */
export const deleteItemApi = async (itemId) => {
  try {
    const response = await apiDelete(`/Items/${itemId}`, true); // Cần auth (Admin)

    if (response.success) {
      return {
        success: true,
        message: response.message || 'Xóa item thành công'
      };
    }

    throw new Error(response.message || 'Xóa item thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Xóa item thất bại'
    };
  }
};

/**
 * Get all items (reuse from giftsApi)
 */
export const getAllItemsApi = getGiftsApi;

