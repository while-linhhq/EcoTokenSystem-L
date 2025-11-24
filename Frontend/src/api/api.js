// Simulate network delay
export const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Simulate API response
export const createResponse = (data, success = true, message = '') => {
  return delay().then(() => ({
    success,
    data,
    message,
    timestamp: new Date().toISOString()
  }));
};

// Simulate API error
export const createError = (message = 'Có lỗi xảy ra', statusCode = 400) => {
  return delay().then(() => {
    const error = new Error(message);
    error.statusCode = statusCode;
    throw error;
  });
};

// Get auth token from localStorage (for future use)
export const getAuthToken = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user).token : null;
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!localStorage.getItem('user');
};

