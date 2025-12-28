import { createContext, useContext, useState, useEffect } from 'react';
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

  // Load all users from API (chỉ admin mới có quyền)
  const loadAllUsers = async () => {
    // Chỉ load nếu user đã đăng nhập và là admin
    if (!isAuthenticated || !user || !isAdmin()) {
      console.log('[UsersContext] User not authenticated or not admin, skipping loadAllUsers');
      return;
    }

    try {
      setLoading(true);
      const response = await getAllUsersApi();
      if (response.success) {
        setAllUsers(response.data);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Chỉ load khi user đã đăng nhập và là admin
    if (isAuthenticated && user && isAdmin()) {
      loadAllUsers();
    } else {
      setAllUsers([]);
    }
  }, [isAuthenticated, user]);

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

