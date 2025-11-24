import { createResponse, createError, delay } from './api';

// Get all actions from storage
const getActionsFromStorage = () => {
  const saved = localStorage.getItem('pendingActions');
  return saved ? JSON.parse(saved) : [];
};

// Save actions to storage
const saveActionsToStorage = (actions) => {
  localStorage.setItem('pendingActions', JSON.stringify(actions));
};

// Submit action API
export const submitActionApi = async (actionData) => {
  await delay(800);

  const actions = getActionsFromStorage();
  const newAction = {
    ...actionData,
    id: Date.now(),
    status: 'pending',
    submittedAt: new Date().toISOString()
  };

  actions.push(newAction);
  saveActionsToStorage(actions);

  return createResponse(newAction, true, 'Đã gửi hành động xanh! Vui lòng chờ kiểm duyệt');
};

// Get pending actions API
export const getPendingActionsApi = async () => {
  await delay(500);

  const actions = getActionsFromStorage();
  const pending = actions.filter(action => action.status === 'pending');
  
  return createResponse(pending, true);
};

// Get approved actions API
export const getApprovedActionsApi = async () => {
  await delay(500);

  const actions = getActionsFromStorage();
  const approved = actions.filter(action => action.status === 'approved');
  
  return createResponse(approved, true);
};

// Get rejected actions API
export const getRejectedActionsApi = async () => {
  await delay(500);

  const actions = getActionsFromStorage();
  const rejected = actions.filter(action => action.status === 'rejected');
  
  return createResponse(rejected, true);
};

// Get user actions API
export const getUserActionsApi = async (userId) => {
  await delay(400);

  const actions = getActionsFromStorage();
  const userActions = actions.filter(action => action.userId === userId);
  
  return createResponse(userActions, true);
};

// Approve action API
export const approveActionApi = async (actionId, comment = '', rewards = { streak: 1, ecoTokens: 10 }) => {
  await delay(600);

  const actions = getActionsFromStorage();
  const actionIndex = actions.findIndex(a => a.id === actionId);

  if (actionIndex === -1) {
    return createError('Không tìm thấy hành động', 404);
  }

  const updatedAction = {
    ...actions[actionIndex],
    status: 'approved',
    comment,
    reviewedAt: new Date().toISOString(),
    rewards
  };

  actions[actionIndex] = updatedAction;
  saveActionsToStorage(actions);

  // Update user rewards
  const userStr = localStorage.getItem(`user_${updatedAction.userId}`) || localStorage.getItem('user') || '{}';
  try {
    const user = JSON.parse(userStr);
    if (user.id) {
      const updatedUser = {
        ...user,
        ecoTokens: (user.ecoTokens || 0) + rewards.ecoTokens,
        streak: (user.streak || 0) + rewards.streak
      };
      localStorage.setItem(`user_${user.id}`, JSON.stringify(updatedUser));
      
      // Update current user if it's the same
      const currentUser = localStorage.getItem('user');
      if (currentUser) {
        const current = JSON.parse(currentUser);
        if (current.id === user.id) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    }
  } catch (e) {
    // Ignore error
  }

  return createResponse(updatedAction, true, 'Đã duyệt hành động thành công');
};

// Reject action API
export const rejectActionApi = async (actionId, comment) => {
  await delay(600);

  const actions = getActionsFromStorage();
  const actionIndex = actions.findIndex(a => a.id === actionId);

  if (actionIndex === -1) {
    return createError('Không tìm thấy hành động', 404);
  }

  const updatedAction = {
    ...actions[actionIndex],
    status: 'rejected',
    comment,
    reviewedAt: new Date().toISOString()
  };

  actions[actionIndex] = updatedAction;
  saveActionsToStorage(actions);

  return createResponse(updatedAction, true, 'Đã từ chối hành động');
};

