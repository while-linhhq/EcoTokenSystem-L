import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginApi, logoutApi, getCurrentUserApi, updateUserApi, changePasswordApi } from '../api/authApi';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Đảm bảo các function luôn được định nghĩa (tránh undefined trong contextValue)
  const login = async (identifier, password) => {
    try {
      setLoading(true);
      
      // Validate input
      if (!identifier || !password) {
        return { 
          success: false, 
          message: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu' 
        };
      }

      const response = await loginApi(identifier, password);
      
      // Chỉ set user nếu response thành công VÀ có data VÀ có token
      if (response.success && response.data) {
        // Đảm bảo format đúng - userData đã được map trong loginApi
        const originalRoleName = response.data.roleName || response.data.RoleName || response.data.role || 'user';
        const normalizedRole = typeof originalRoleName === 'string' ? originalRoleName.toLowerCase() : 'user';
        
        // Lấy token và id trực tiếp từ response.data (đã được map trong loginApi)
        const token = response.data.token || response.data.Token || null;
        const userId = response.data.id || response.data.userId || null;
        
        // Validate token và id trước khi tiếp tục
        if (!token) {
          console.error('[AuthContext] CRITICAL: No token found in response.data!', {
            'response.data': response.data,
            'response.data.token': response.data.token,
            'response.data.Token': response.data.Token
          });
          return { 
            success: false, 
            message: 'Đăng nhập thất bại: Không tìm thấy token' 
          };
        }
        
        if (!userId) {
          console.error('[AuthContext] Missing id:', response.data);
          return { 
            success: false, 
            message: 'Đăng nhập thất bại: Không tìm thấy ID người dùng' 
          };
        }
        
        // Tạo userData với token và id được đảm bảo
        const userData = {
          ...response.data,
          // QUAN TRỌNG: Đảm bảo token và id luôn có giá trị
          id: userId,
          userId: userId,
          token: token, // Token bắt buộc phải có
          role: normalizedRole,
          roleName: originalRoleName,
        };
        
        // Đảm bảo userData có đầy đủ thông tin trước khi lưu
        // QUAN TRỌNG: Luôn sử dụng token và id đã được validate ở trên
        // Tạo object rõ ràng, không dùng spread để tránh mất token
        const userToSave = {
          id: userId, // Sử dụng userId đã validate
          userId: userId,
          token: token, // Sử dụng token đã validate - BẮT BUỘC PHẢI CÓ
          username: userData.username || response.data.username || '',
          role: userData.role || normalizedRole || 'user',
          roleName: userData.roleName || originalRoleName || 'user',
          currentPoints: userData.currentPoints || userData.ecoTokens || response.data.currentPoints || 0,
          ecoTokens: userData.ecoTokens || userData.currentPoints || response.data.currentPoints || 0,
          streak: userData.streak || response.data.streak || 0,
          name: userData.name || response.data.name || '',
          nickname: userData.nickname || userData.name || response.data.name || '',
          email: userData.email || response.data.email || '',
          phone: userData.phone || userData.phoneNumber || response.data.phone || response.data.phoneNumber || '',
          phoneNumber: userData.phoneNumber || userData.phone || response.data.phoneNumber || response.data.phone || '',
          address: userData.address || response.data.address || '',
          gender: userData.gender || response.data.gender || '',
          dateOfBirth: userData.dateOfBirth || response.data.dateOfBirth || null,
          avatar: userData.avatar || response.data.avatar || '🌱',
          avatarImage: userData.avatarImage || response.data.avatarImage || null,
          createdAt: userData.createdAt || response.data.createdAt || null
        };
        
        // CRITICAL: Đảm bảo token luôn có giá trị (không phải null/undefined)
        if (!userToSave.token || userToSave.token === null || userToSave.token === undefined) {
          console.error('[AuthContext] CRITICAL: Token is null/undefined in userToSave!');
          // Force set token từ biến đã validate
          console.log('Token user', userToSave.token);
          userToSave.token = token;
        }
        
        // CRITICAL: Verify token trước khi lưu
        if (!userToSave.token) {
          console.error('[AuthContext] CRITICAL ERROR: Token is missing before saving!', {
            'userData.token': userData.token,
            'userData.Token': userData.Token,
            'userToSave.token': userToSave.token,
            userData: userData,
            userToSave: userToSave
          });
          return {
            success: false,
            message: 'Đăng nhập thất bại: Token không hợp lệ'
          };
        }
        
        // Đảm bảo token không bị null/undefined
        if (!userToSave.token || userToSave.token === null || userToSave.token === undefined || userToSave.token === 'null') {
          console.error('[AuthContext] CRITICAL ERROR: Token is still null before saving!');
          // Force set lại token
          userToSave.token = token;
        }
        
        setUser(userToSave);
        setIsAuthenticated(true);
        
        // Lưu vào localStorage
        try {
          localStorage.setItem('user', JSON.stringify(userToSave));
          
          // Verify ngay sau khi lưu
          const verifyUserStr = localStorage.getItem('user');
          if (verifyUserStr) {
            try {
              const verifyUser = JSON.parse(verifyUserStr);
              if (!verifyUser.token || verifyUser.token === null || verifyUser.token === undefined) {
                console.error('[AuthContext] CRITICAL: Token lost after saving to localStorage!');
                // Thử lưu lại với token rõ ràng
                verifyUser.token = token;
                verifyUser.id = userId;
                verifyUser.userId = userId;
                localStorage.setItem('user', JSON.stringify(verifyUser));
              }
            } catch (e) {
              console.error('[AuthContext] Error verifying saved user:', e);
            }
          }
        } catch (e) {
          console.error('[AuthContext] Error saving to localStorage:', e);
          return {
            success: false,
            message: 'Đăng nhập thất bại: Không thể lưu thông tin người dùng'
          };
        }
        
        return { success: true, message: response.message, data: userToSave };
      }
      
      return { 
        success: false, 
        message: response.message || 'Đăng nhập thất bại: Tên đăng nhập hoặc mật khẩu không chính xác' 
      };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.message || 'Đăng nhập thất bại: Có lỗi xảy ra' 
      };
    } finally {
      setLoading(false);
    }
  };

  const loginWithUserData = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const updateUser = useCallback(async (formData) => {
    try {
      // CRITICAL: Lấy token từ user hiện tại hoặc localStorage trước khi update
      const currentToken = user?.token || (() => {
        try {
          const storedUser = localStorage.getItem('user');
          if (storedUser) {
            const parsed = JSON.parse(storedUser);
            return parsed.token || null;
          }
        } catch {
          return null;
        }
        return null;
      })();

      const currentUserId = user?.id || user?.userId;

      if (!currentUserId) {
        return { success: false, message: 'Chưa đăng nhập' };
      }

      // formData is now FormData object - pass directly to API
      const response = await updateUserApi(formData);
      if (response.success) {
        // CRITICAL: Backend không trả về token, nên phải giữ lại từ user hiện tại
        const updatedUserData = {
          ...response.data,
          // QUAN TRỌNG: Giữ lại token và id từ user hiện tại
          token: currentToken || user?.token, // Backend không trả về token
          id: currentUserId || response.data.id || response.data.userId,
          userId: currentUserId || response.data.userId || response.data.id
        };

        setUser(updatedUserData);
        localStorage.setItem('user', JSON.stringify(updatedUserData));
        return { success: true, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, user?.userId, user?.token]);

  const changePassword = async (oldPassword, newPassword) => {
    try {
      if (!user?.id) {
        return { success: false, message: 'Chưa đăng nhập' };
      }
      const response = await changePasswordApi(user.id, oldPassword, newPassword);
      return { success: response.success, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const isModerator = () => {
    return user?.role === 'moderator' || user?.roleName === 'Moderator';
  };

  const isAdmin = () => {
    return user?.role === 'admin' || user?.roleName === 'Admin';
  };

  const logout = async () => {
    try {
      await logoutApi();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    } catch {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    }
  };

  // Load user from localStorage on mount
  useEffect(() => {
    let isMounted = true; // Flag để tránh update state sau khi unmount
    
    const loadUser = async () => {
      try {
        if (!isMounted) return;
        // Kiểm tra token trong localStorage trước
        const userStr = localStorage.getItem('user');
        
        if (userStr) {
          try {
            const cachedUser = JSON.parse(userStr);
            
            if (cachedUser.token && cachedUser.id) {
              // Có token và id, thử lấy thông tin mới từ backend
              try {
                const response = await getCurrentUserApi();
                if (response.success && response.data) {
                  const originalRoleName = response.data.roleName || response.data.RoleName || response.data.role || 'user';
                  const normalizedRole = typeof originalRoleName === 'string' ? originalRoleName.toLowerCase() : 'user';
                  
                  // Backend /User/me không trả về Id và Token, nên phải giữ lại từ cached user
                  const userData = {
                    ...response.data,
                    // QUAN TRỌNG: Giữ lại id và token từ cached user (backend không trả về)
                    id: cachedUser.id || response.data.id || response.data.userId,
                    userId: cachedUser.id || cachedUser.userId || response.data.id || response.data.userId,
                    token: cachedUser.token, // Backend không trả về token trong /User/me
                    role: normalizedRole,
                    roleName: originalRoleName, // Giữ nguyên để check trong ActionsContext
                  };
                  
                  // Đảm bảo userData có đầy đủ thông tin trước khi lưu
                  // QUAN TRỌNG: Luôn giữ lại token từ cachedUser (backend không trả về)
                  const userToSave = {
                    id: userData.id || cachedUser.id,
                    userId: userData.userId || userData.id || cachedUser.id || cachedUser.userId,
                    token: cachedUser.token || userData.token, // Ưu tiên token từ cache
                    username: userData.username || cachedUser.username || '',
                    role: userData.role || 'user',
                    roleName: userData.roleName || userData.role || 'user',
                    currentPoints: userData.currentPoints || userData.ecoTokens || 0,
                    ecoTokens: userData.ecoTokens || userData.currentPoints || 0,
                    streak: userData.streak || 0,
                    name: userData.name || '',
                    nickname: userData.nickname || userData.name || '',
                    email: userData.email || '',
                    phone: userData.phone || userData.phoneNumber || '',
                    phoneNumber: userData.phoneNumber || userData.phone || '',
                    address: userData.address || '',
                    gender: userData.gender || '',
                    dateOfBirth: userData.dateOfBirth || null,
                    avatar: userData.avatar || cachedUser.avatar || '🌱',
                    avatarImage: userData.avatarImage || cachedUser.avatarImage || null,
                    createdAt: userData.createdAt || null
                  };
                  
                  // Validate token trước khi lưu
                  if (!userToSave.token) {
                    console.error('[AuthContext] CRITICAL: Token is missing before saving!');
                    // Nếu không có token, giữ lại token từ cache
                    userToSave.token = cachedUser.token;
                  }
                  
                  setUser(userToSave);
                  setIsAuthenticated(true);
                  localStorage.setItem('user', JSON.stringify(userToSave));
                  
                  // Verify sau khi lưu
                  const verifyUserStr = localStorage.getItem('user');
                  if (verifyUserStr) {
                    const verifyUser = JSON.parse(verifyUserStr);
                    if (!verifyUser.token) {
                      console.error('[AuthContext] CRITICAL: Token lost after saving to localStorage!');
                    }
                  }
                } else {
                  // API trả về không thành công, nhưng vẫn giữ user từ cache
                  // (có thể do lỗi tạm thời, token vẫn hợp lệ)
                  setUser(cachedUser);
                  setIsAuthenticated(true);
                }
              } catch (apiError) {
                // Nếu lỗi 401 Unauthorized, token không hợp lệ -> xóa
                if (apiError.status === 401 || (apiError.message && (apiError.message.includes('401') || apiError.message.includes('Unauthorized')))) {
                  console.error('[AuthContext] Token invalid (401), clearing user');
                  localStorage.removeItem('user');
                  setUser(null);
                  setIsAuthenticated(false);
                } else {
                  // Lỗi khác (network, timeout, etc.) -> giữ lại user từ cache
                  setUser(cachedUser);
                  setIsAuthenticated(true);
                }
              }
            } else {
              // Không có token hoặc id, xóa
              localStorage.removeItem('user');
              setUser(null);
              setIsAuthenticated(false);
            }
          } catch (e) {
            // Parse error, xóa invalid data
            console.error('[AuthContext] Error parsing cached user:', e);
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          // Không có user trong localStorage
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        // Unexpected error
        console.error('[AuthContext] Unexpected error loading user:', err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadUser().catch(err => {
      console.error('[AuthContext] Unhandled error in loadUser:', err);
      if (isMounted) {
        setLoading(false);
      }
    });
    
    return () => {
      isMounted = false; // Cleanup
    };
  }, []);

  // Đảm bảo context value luôn được định nghĩa
  // Không dùng useMemo để tránh dependency issues - object mới mỗi render là OK cho context
  const contextValue = {
    user,
    isAuthenticated,
    loading,
    login,
    loginWithUserData, // For backward compatibility
    logout,
    isModerator,
    isAdmin,
    updateUser,
    changePassword
  };

  // Luôn render Provider ngay lập tức - không đợi useEffect
  // Điều này đảm bảo children (như Login) có thể sử dụng context ngay
  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

