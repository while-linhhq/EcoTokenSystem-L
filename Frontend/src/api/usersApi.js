import { createResponse, createError, delay } from './api';

// Get all users API
export const getAllUsersApi = async () => {
  await delay(500);

  const users = [];
  const keys = Object.keys(localStorage);
  const userMap = new Map();

  keys.forEach(key => {
    if (key.startsWith('user_') || key === 'user') {
      try {
        const user = JSON.parse(localStorage.getItem(key));
        if (user && user.id) {
          userMap.set(user.id, user);
        }
      } catch (e) {
        // Ignore invalid data
      }
    }
  });

  return createResponse(Array.from(userMap.values()), true);
};

// Create moderator API
export const createModeratorApi = async (moderatorData) => {
  await delay(800);

  const newModerator = {
    ...moderatorData,
    id: `mod-${Date.now()}`,
    role: 'moderator',
    createdAt: new Date().toISOString()
  };

  localStorage.setItem(`user_${newModerator.id}`, JSON.stringify(newModerator));
  if (moderatorData.password) {
    localStorage.setItem(`user_password_${newModerator.id}`, moderatorData.password);
  }

  return createResponse(newModerator, true, 'Tạo tài khoản moderator thành công');
};

// Update user API (Admin)
export const updateUserApi = async (userId, updatedData) => {
  await delay(600);

  const userKey = `user_${userId}`;
  const userStr = localStorage.getItem(userKey) || localStorage.getItem('user');

  if (!userStr) {
    return createError('Không tìm thấy user', 404);
  }

  const user = JSON.parse(userStr);
  const updatedUser = {
    ...user,
    ...updatedData,
    updatedAt: new Date().toISOString()
  };

  localStorage.setItem(`user_${userId}`, JSON.stringify(updatedUser));

  // Update current user if it's the same
  const currentUser = localStorage.getItem('user');
  if (currentUser) {
    const current = JSON.parse(currentUser);
    if (current.id === userId) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }

  return createResponse(updatedUser, true, 'Cập nhật user thành công');
};

// Search users API
export const searchUsersApi = async (searchTerm) => {
  await delay(400);

  const users = [];
  const keys = Object.keys(localStorage);
  const userMap = new Map();

  keys.forEach(key => {
    if (key.startsWith('user_') || key === 'user') {
      try {
        const user = JSON.parse(localStorage.getItem(key));
        if (user && user.id) {
          userMap.set(user.id, user);
        }
      } catch (e) {
        // Ignore invalid data
      }
    }
  });

  const allUsers = Array.from(userMap.values());

  if (!searchTerm) {
    return createResponse(allUsers, true);
  }

  const term = searchTerm.toLowerCase();
  const filtered = allUsers.filter(user =>
    user.nickname?.toLowerCase().includes(term) ||
    user.email?.toLowerCase().includes(term) ||
    user.phone?.includes(term) ||
    user.fullName?.toLowerCase().includes(term)
  );

  return createResponse(filtered, true);
};

