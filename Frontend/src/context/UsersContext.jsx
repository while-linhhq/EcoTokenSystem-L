import { createContext, useContext, useState, useEffect } from 'react';
import { getAllUsersApi, createModeratorApi, updateUserApi as updateUserApiCall, searchUsersApi } from '../api/usersApi';

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

  // Load all users from API
  const loadAllUsers = async () => {
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
    loadAllUsers();
  }, []);

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

  const searchUsers = async (searchTerm) => {
    try {
      const response = await searchUsersApi(searchTerm);
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      // Fallback to local search
      if (!searchTerm) return allUsers;
      const term = searchTerm.toLowerCase();
      return allUsers.filter(user =>
        user.nickname?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.phone?.includes(term) ||
        user.fullName?.toLowerCase().includes(term)
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
        searchUsers
      }}
    >
      {children}
    </UsersContext.Provider>
  );
};

