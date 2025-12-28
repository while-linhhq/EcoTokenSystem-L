// ============================================
// API CLIENT - GỌI BACKEND THẬT
// ============================================
// File này chứa các hàm helper để gọi API từ backend

// Base URL của backend
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5109/api';

/**
 * Lấy token từ localStorage
 */
export const getAuthToken = () => {
  try {
    const user = localStorage.getItem('user');
    if (!user) {
      console.warn('[getAuthToken] No user found in localStorage');
      return null;
    }
    
    try {
      const userData = JSON.parse(user);
      
      // Thử lấy token từ nhiều property names (để tương thích)
      const token = userData.token || userData.Token || userData.accessToken || null;
      
      // Log error nếu không có token
      if (!token) {
        console.error('[getAuthToken] No token found in user data');
      }
      
      return token;
    } catch (e) {
      console.error('[getAuthToken] Error parsing user data:', e, {
        userString: user.substring(0, 100) + '...'
      });
      return null;
    }
  } catch (error) {
    console.error('[getAuthToken] Error accessing localStorage:', error);
    return null;
  }
};

/**
 * Tạo headers cho request
 */
const getHeaders = (includeAuth = true, contentType = 'application/json', isFormData = false) => {
  const headers = {};

  // Không set Content-Type cho FormData, để browser tự set với boundary
  if (!isFormData && contentType) {
    headers['Content-Type'] = contentType;
  }

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.error('[getHeaders] No token available for Authorization header!');
    }
  }

  return headers;
};

/**
 * GET request
 */
export const apiGet = async (endpoint, includeAuth = true) => {
  try {
    const headers = getHeaders(includeAuth);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: headers,
    });

    // Xử lý 401 Unauthorized trước khi đọc body
    if (response.status === 401) {
      const errorMessage = 'Unauthorized: Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
      console.error('[apiGet] 401 Unauthorized:', {
        endpoint,
        status: response.status,
        hasAuthHeader: !!headers['Authorization'],
        token: getAuthToken() ? 'exists' : 'missing'
      });
      const error = new Error(errorMessage);
      error.status = 401;
      throw error;
    }

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (isJson) {
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error('[apiGet] Error parsing JSON response:', parseError, {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          contentType
        });
        throw new Error(`Failed to parse response: ${response.statusText}`);
      }

      if (!response.ok) {
        console.error('[apiGet] Response not OK:', {
          endpoint,
          status: response.status,
          statusText: response.statusText,
          data: data
        });
        const error = new Error(data.Message || data.message || `HTTP ${response.status}: ${response.statusText}`);
        error.status = response.status; // Thêm status code vào error object
        throw error;
      }

      // Xử lý ResponseDTO format
      if (data.IsSuccess !== undefined) {
        // Nếu IsSuccess = false nhưng có Data (có thể là empty array), vẫn trả về data
        // Ví dụ: Items API trả về IsSuccess = false khi không có items, nhưng Data = []
        if (data.IsSuccess === false) {
          // Nếu có Data (có thể là empty array), vẫn trả về
          if (data.Data !== undefined) {
            return {
              success: true, // Coi như thành công vì có data (có thể empty)
              data: data.Data,
              message: data.Message || 'Không có dữ liệu'
            };
          }
          // Nếu không có Data, throw error
          throw new Error(data.Message || 'Có lỗi xảy ra');
        }
        
        // IsSuccess = true
        return {
          success: true,
          data: data.Data !== undefined ? data.Data : data,
          message: data.Message || 'Thành công'
        };
      }

      // Không phải ResponseDTO format, trả về data trực tiếp
      return {
        success: true,
        data: data,
        message: 'Thành công'
      };
    }

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status; // Thêm status code vào error object
      throw error;
    }

    return {
      success: true,
      data: null,
      message: 'Thành công'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * POST request
 */
export const apiPost = async (endpoint, body, includeAuth = true, isFormData = false) => {
  try {
    const headers = getHeaders(includeAuth, 'application/json', isFormData);
    
    // Log để debug 401 errors
    if (includeAuth && endpoint.includes('/Items')) {
      const token = getAuthToken();
      console.log('[apiPost] Items request:', {
        endpoint,
        hasToken: !!token,
        tokenLength: token?.length,
        isFormData,
        includeAuth
      });
    }
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : null),
    });

    // Xử lý 401 Unauthorized trước khi đọc body
    if (response.status === 401) {
      const errorMessage = 'Unauthorized: Token không hợp lệ hoặc đã hết hạn. Vui lòng đăng nhập lại.';
      console.error('[apiPost] 401 Unauthorized:', {
        endpoint,
        status: response.status,
        hasAuthHeader: !!headers['Authorization'],
        token: getAuthToken() ? 'exists' : 'missing'
      });
      throw new Error(errorMessage);
    }

    // Kiểm tra content-type
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    // Chỉ đọc response body một lần
    if (isJson) {
      const data = await response.json();
      
      
      // Xử lý lỗi HTTP (500, 400, etc.) - kiểm tra sau khi đọc JSON
      if (!response.ok) {
        const errorMessage = data.Message || data.message || `HTTP ${response.status}: ${response.statusText}`;
        console.error('[apiPost] HTTP Error:', {
          status: response.status,
          endpoint: endpoint,
          errorMessage: errorMessage,
          data: data
        });
        throw new Error(errorMessage);
      }
      
      // Xử lý cả IsSuccess (uppercase) và isSuccess (lowercase) - tùy JSON serializer
      const isSuccess = data.IsSuccess !== undefined ? data.IsSuccess : 
                       (data.isSuccess !== undefined ? data.isSuccess : undefined);
      const message = data.Message || data.message || 'Thành công';
      
      // Lấy data - ưu tiên data (lowercase) trước vì backend trả về lowercase
      // Sau đó thử Data (uppercase), cuối cùng là toàn bộ object
      let responseData;
      if (data.data !== undefined) {
        responseData = data.data; // Backend trả về data (lowercase) - ưu tiên
      } else if (data.Data !== undefined) {
        responseData = data.Data; // Backend trả về Data (uppercase) - fallback
      } else {
        responseData = data; // Không có nested structure, trả về toàn bộ
      }
      
      // Nếu backend trả về ResponseDTO với IsSuccess: false
      if (isSuccess === false) {
        throw new Error(message || 'Có lỗi xảy ra');
      }
      
      // Xử lý response thành công
      if (isSuccess !== undefined) {
        const result = {
          success: true,
          data: responseData, // Trả về Data object trực tiếp (LoginResponseDTO)
          message: message
        };
        
        
        return result;
      }

      // Nếu không có IsSuccess, coi như thành công
      return {
        success: true,
        data: data,
        message: 'Thành công'
      };
    }

    // Nếu không phải JSON response
    if (!response.ok) {
      const errorMsg = `HTTP ${response.status}: ${response.statusText}`;
      console.error('[apiPost] Non-JSON error:', errorMsg, endpoint);
      throw new Error(errorMsg);
    }

    // Response không phải JSON nhưng ok
    return {
      success: true,
      data: null,
      message: 'Thành công'
    };
  } catch (error) {
    // Log error để debug
    console.error('[apiPost] Error:', {
      endpoint: endpoint,
      error: error,
      message: error.message,
      stack: error.stack
    });
    // Re-throw error để caller xử lý
    throw error;
  }
};

/**
 * PATCH request
 */
export const apiPatch = async (endpoint, body, includeAuth = true, isFormData = false) => {
  try {
    const headers = getHeaders(includeAuth, 'application/json', isFormData);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'PATCH',
      headers: headers,
      body: isFormData ? body : (body ? JSON.stringify(body) : null),
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (isJson) {
      const data = await response.json();

      // Nếu backend trả về ResponseDTO với IsSuccess: false
      if (data.IsSuccess === false) {
        throw new Error(data.Message || 'Có lỗi xảy ra');
      }

      if (!response.ok) {
        throw new Error(data.Message || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Xử lý response thành công
      if (data.IsSuccess !== undefined) {
        return {
          success: true,
          data: data.Data !== undefined ? data.Data : data,
          message: data.Message || 'Thành công'
        };
      }

      return {
        success: true,
        data: data,
        message: 'Thành công'
      };
    }

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status; // Thêm status code vào error object
      throw error;
    }

    return {
      success: true,
      data: null,
      message: 'Thành công'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * DELETE request
 */
export const apiDelete = async (endpoint, includeAuth = true) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'DELETE',
      headers: getHeaders(includeAuth),
    });

    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');

    if (isJson) {
      const data = await response.json();

      // Nếu backend trả về ResponseDTO với IsSuccess: false
      if (data.IsSuccess === false) {
        throw new Error(data.Message || 'Có lỗi xảy ra');
      }

      if (!response.ok) {
        throw new Error(data.Message || data.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      // Xử lý response thành công
      if (data.IsSuccess !== undefined) {
        return {
          success: true,
          data: data.Data !== undefined ? data.Data : data,
          message: data.Message || 'Thành công'
        };
      }

      return {
        success: true,
        data: data,
        message: 'Thành công'
      };
    }

    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status; // Thêm status code vào error object
      throw error;
    }

    return {
      success: true,
      data: null,
      message: 'Thành công'
    };
  } catch (error) {
    throw error;
  }
};

