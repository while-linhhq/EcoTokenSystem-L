import { createContext, useContext, useState, useEffect } from 'react';
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

  const login = async (identifier, password) => {
    try {
      setLoading(true);
      const response = await loginApi(identifier, password);
      if (response.success) {
        setUser(response.data);
        setIsAuthenticated(true);
        localStorage.setItem('user', JSON.stringify(response.data));
        if (response.data.password) {
          localStorage.setItem(`user_password_${response.data.id}`, response.data.password);
        }
        return { success: true, message: response.message, data: response.data };
      }
    } catch (error) {
      return { success: false, message: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Legacy login function for backward compatibility
  const loginWithUserData = (userData) => {
    setUser(userData);
    setIsAuthenticated(true);
    localStorage.setItem('user', JSON.stringify(userData));
    if (userData.password) {
      localStorage.setItem(`user_password_${userData.id}`, userData.password);
    }
  };

  const updateUser = async (updatedData) => {
    try {
      if (!user?.id) {
        // Fallback to sync update if no user ID
        const updatedUser = { ...user, ...updatedData };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
        if (updatedData.password) {
          localStorage.setItem(`user_password_${user.id}`, updatedData.password);
        }
        return { success: true };
      }

      const response = await updateUserApi(user.id, updatedData);
      if (response.success) {
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        return { success: true, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

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
    return user?.role === 'moderator';
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  const logout = async () => {
    try {
      await logoutApi();
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    } catch (error) {
      // Still logout even if API fails
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('user');
    }
  };

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const response = await getCurrentUserApi();
        if (response.success) {
          setUser(response.data);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Not logged in
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  return (
    <AuthContext.Provider value={{ 
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
    }}>
      {children}
    </AuthContext.Provider>
  );
};

