import { createResponse, createError, delay } from './api';

// Mock users database
const getUsersFromStorage = () => {
  const users = [];
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('user_') || key === 'user') {
      try {
        const user = JSON.parse(localStorage.getItem(key));
        if (user && user.id) {
          users.push(user);
        }
      } catch (e) {
        // Ignore invalid data
      }
    }
  });
  return users;
};

// Login API
export const loginApi = async (identifier, password) => {
  await delay(800); // Simulate network delay

  // Check moderator/admin login
  if ((identifier === 'moderator' || identifier === 'admin' || identifier === 'kiemduyet') && password === 'moderator123') {
    const moderatorData = {
      id: 'mod-1',
      nickname: 'Kiểm Duyệt Viên',
      email: identifier,
      phone: null,
      avatar: '👮',
      role: 'moderator',
      notifications: true,
      password: password,
      token: `token_mod_${Date.now()}`
    };
    return createResponse(moderatorData, true, 'Đăng nhập thành công');
  }

  // Check admin login
  if (identifier === 'admin' && password === 'admin123') {
    const adminData = {
      id: 'admin-1',
      nickname: 'Quản Trị Viên',
      email: identifier,
      phone: null,
      avatar: '👑',
      role: 'admin',
      notifications: true,
      password: password,
      token: `token_admin_${Date.now()}`
    };
    return createResponse(adminData, true, 'Đăng nhập thành công');
  }

  // Check default user
  if ((identifier === 'user' || identifier === 'user@example.com' || identifier === '0123456789') && password === 'user123') {
    // Check if default user exists in storage
    let defaultUser = null;
    const users = getUsersFromStorage();
    defaultUser = users.find(u => u.id === 'user-default');

    if (!defaultUser) {
      // Create default user
      defaultUser = {
        id: 'user-default',
        nickname: 'Người Dùng Xanh',
        email: 'user@example.com',
        phone: '0123456789',
        avatar: '🌱',
        role: 'user',
        ecoTokens: 100,
        streak: 0,
        level: 1,
        notifications: true,
        createdAt: new Date().toISOString()
      };
      // Save to localStorage
      localStorage.setItem('user_user-default', JSON.stringify(defaultUser));
      localStorage.setItem('user_password_user-default', password);
    }

    const userData = {
      ...defaultUser,
      token: `token_user_${Date.now()}`
    };
    return createResponse(userData, true, 'Đăng nhập thành công');
  }

  // Check regular users
  const users = getUsersFromStorage();
  const user = users.find(u => 
    (u.email === identifier || u.phone === identifier) && 
    localStorage.getItem(`user_password_${u.id}`) === password
  );

  if (user) {
    const userData = {
      ...user,
      token: `token_${user.id}_${Date.now()}`
    };
    return createResponse(userData, true, 'Đăng nhập thành công');
  }

  return createError('Số điện thoại/Email hoặc mật khẩu không đúng', 401);
};

// Register API
export const registerApi = async (userData) => {
  await delay(1000);

  const users = getUsersFromStorage();
  const existingUser = users.find(u => 
    u.email === userData.email || u.phone === userData.phone
  );

  if (existingUser) {
    return createError('Email hoặc số điện thoại đã được sử dụng', 409);
  }

  const newUser = {
    ...userData,
    id: `user_${Date.now()}`,
    role: 'user',
    ecoTokens: 0,
    streak: 0,
    level: 1,
    createdAt: new Date().toISOString(),
    token: `token_${Date.now()}`
  };

  // Save user
  localStorage.setItem(`user_${newUser.id}`, JSON.stringify(newUser));
  if (newUser.password) {
    localStorage.setItem(`user_password_${newUser.id}`, newUser.password);
  }

  return createResponse(newUser, true, 'Đăng ký thành công');
};

// Get current user API
export const getCurrentUserApi = async () => {
  await delay(300);

  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return createError('Chưa đăng nhập', 401);
  }

  const user = JSON.parse(userStr);
  return createResponse(user, true);
};

// Update user API
export const updateUserApi = async (userId, updatedData) => {
  await delay(600);

  const userKey = `user_${userId}`;
  const userStr = localStorage.getItem(userKey) || localStorage.getItem('user');
  
  if (!userStr) {
    return createError('Không tìm thấy user', 404);
  }

  const user = JSON.parse(userStr);
  const updatedUser = { ...user, ...updatedData, updatedAt: new Date().toISOString() };

  // Save updated user
  localStorage.setItem(`user_${userId}`, JSON.stringify(updatedUser));
  
  // Update current user if it's the same
  const currentUser = localStorage.getItem('user');
  if (currentUser) {
    const current = JSON.parse(currentUser);
    if (current.id === userId) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }

  return createResponse(updatedUser, true, 'Cập nhật thông tin thành công');
};

// Change password API
export const changePasswordApi = async (userId, oldPassword, newPassword) => {
  await delay(500);

  const savedPassword = localStorage.getItem(`user_password_${userId}`);
  
  if (savedPassword !== oldPassword) {
    return createError('Mật khẩu cũ không đúng', 400);
  }

  localStorage.setItem(`user_password_${userId}`, newPassword);
  return createResponse({ success: true }, true, 'Đổi mật khẩu thành công');
};

// Logout API
export const logoutApi = async () => {
  await delay(200);
  localStorage.removeItem('user');
  return createResponse({ success: true }, true, 'Đăng xuất thành công');
};

