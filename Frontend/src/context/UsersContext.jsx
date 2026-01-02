import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getAllUsersApi, createModeratorApi, updateUserApi as updateUserApiCall, deleteUserApi, searchUsersApi } from '../api/usersApi';

const UsersContext = createContext();

export const useUsers = () => {
  const context = useContext(UsersContext);
  if (!context) {
    throw new Error('useUsers must be used within UsersProvider');
  }
  return context;
};

export const UsersProvider = ({ children }) => {
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user, isAdmin } = useAuth();
  const loadingRef = useRef(false); // Dùng ref để track loading state mà không gây re-render

  // Load all users from API (chỉ admin mới có quyền)
  // Sử dụng useCallback để tránh tạo function mới mỗi lần render, gây spam API calls
  const loadAllUsers = useCallback(async () => {
    // Chỉ load nếu user đã đăng nhập và là admin
    if (!isAuthenticated || !user || !isAdmin()) {
      console.log('[UsersContext] User not authenticated or not admin, skipping loadAllUsers');
      return;
    }

    // Guard để tránh gọi API nếu đang loading (dùng ref để tránh re-render)
    if (loadingRef.current) {
      console.log('[UsersContext] Already loading users, skipping duplicate call');
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      const response = await getAllUsersApi();
      if (response.success) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, isAdmin]); // Chỉ depend vào user?.id và bỏ loading khỏi deps

  useEffect(() => {
    // Chỉ clear users khi user đã đăng xuất
    // Bỏ auto-load để tránh spam, Admin component sẽ tự gọi khi cần
    if (!isAuthenticated || !user || !isAdmin()) {
      setAllUsers([]);
    }
  }, [isAuthenticated, user?.id, isAdmin]);

  const saveUser = (userData) => {
    // This is a sync function for backward compatibility
    // It updates local state immediately
    setAllUsers(prev => {
      const userMap = new Map(prev.map(u => [u.id, u]));
      userMap.set(userData.id, userData);
      return Array.from(userMap.values());
    });
  };

  const createModerator = async (moderatorData) => {
    try {
      const response = await createModeratorApi(moderatorData);
      if (response.success) {
        setAllUsers(prev => [...prev, response.data]);
        return { success: true, data: response.data, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const updateUser = async (userId, updatedData) => {
    try {
      const response = await updateUserApiCall(userId, updatedData);
      if (response.success) {
        setAllUsers(prev =>
          prev.map(user => user.id === userId ? response.data : user)
        );
        return { success: true, data: response.data, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const deleteUser = async (userId) => {
    try {
      const response = await deleteUserApi(userId);
      if (response.success) {
        // Xóa user khỏi state
        setAllUsers(prev => prev.filter(user => user.id !== userId));
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message };
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const searchUsers = async (searchTerm) => {
    try {
      const users = await searchUsersApi(searchTerm);
      // searchUsersApi trả về array trực tiếp
      return Array.isArray(users) ? users : [];
    } catch (error) {
      console.error('Error searching users:', error);
      // Fallback to local search
      if (!searchTerm) return allUsers;
      const term = searchTerm.toLowerCase();
      return allUsers.filter(user =>
        user.username?.toLowerCase().includes(term) ||
        user.name?.toLowerCase().includes(term) ||
        user.nickname?.toLowerCase().includes(term) ||
        user.phone?.includes(term) ||
        user.phoneNumber?.includes(term)
      );
    }
  };

  return (
    <UsersContext.Provider
      value={{
        allUsers,
        loading,
        loadAllUsers,
        saveUser,
        createModerator,
        updateUser,
        deleteUser,
        searchUsers
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

