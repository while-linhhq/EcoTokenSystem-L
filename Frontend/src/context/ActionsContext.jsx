import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  submitActionApi, 
  getPendingActionsApi, 
  getApprovedActionsApi, 
  getRejectedActionsApi, 
  getUserActionsApi,
  approveActionApi,
  rejectActionApi
} from '../api/actionsApi';

const ActionsContext = createContext();

export const useActions = () => {
  const context = useContext(ActionsContext);
  if (!context) {
    throw new Error('useActions must be used within ActionsProvider');
  }
  return context;
};

export const ActionsProvider = ({ children }) => {
  const [pendingActions, setPendingActions] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // Load actions from API - Sử dụng useCallback để tránh infinite loop
  const loadActions = useCallback(async () => {
    // Chỉ load actions nếu user đã đăng nhập và có id
    // Lấy user từ useAuth() trực tiếp trong callback để tránh stale closure
    const currentUser = user;
    if (!isAuthenticated || !currentUser?.id) {
      console.log('[ActionsContext] User not authenticated or no user id, skipping loadActions');
      setPendingActions([]);
      return;
    }

    try {
      setLoading(true);
      // Kiểm tra role từ cả currentUser.role (lowercase) và currentUser.roleName (có thể uppercase)
      const userRole = currentUser.role || currentUser.roleName || '';
      const userRoleName = currentUser.roleName || currentUser.role || '';
      
      // Kiểm tra cả lowercase và uppercase, cả role và roleName
      const isModeratorOrAdmin = 
        userRole === 'Moderator' || userRole === 'moderator' || 
        userRole === 'Admin' || userRole === 'admin' ||
        userRoleName === 'Moderator' || userRoleName === 'moderator' ||
        userRoleName === 'Admin' || userRoleName === 'admin';
      
      console.log('[ActionsContext] Bắt đầu load actions cho user:', {
        userId: currentUser.id,
        role: userRole,
        roleName: userRoleName,
        'user.role': currentUser.role,
        'user.roleName': currentUser.roleName,
        isModeratorOrAdmin: isModeratorOrAdmin
      });
      
      let allActions = [];
      
      if (isModeratorOrAdmin) {
        // Moderator/Admin: Load tất cả pending posts từ API
        console.log('[ActionsContext] Loading all pending posts for Moderator/Admin...');
        const pendingRes = await getPendingActionsApi();
        console.log('[ActionsContext] getPendingActionsApi response:', {
          success: pendingRes.success,
          dataLength: pendingRes.data ? (Array.isArray(pendingRes.data) ? pendingRes.data.length : 'not array') : 'no data',
          message: pendingRes.message,
          data: pendingRes.data
        });
        if (pendingRes.success) {
          // Nếu success, data có thể là empty array (không có pending posts)
          allActions = Array.isArray(pendingRes.data) ? pendingRes.data : [];
          console.log('[ActionsContext] Loaded', allActions.length, 'pending posts for Moderator/Admin');
          if (allActions.length > 0) {
            console.log('[ActionsContext] Sample pending post:', allActions[0]);
          } else {
            console.log('[ActionsContext] No pending posts found (this is normal if there are no pending posts)');
          }
        } else {
          console.warn('[ActionsContext] Failed to load pending posts:', pendingRes.message || 'Unknown error');
          allActions = []; // Set empty array nếu failed
        }
        
        // Cũng load approved và rejected để hiển thị trong tabs
        const approvedRes = await getApprovedActionsApi();
        if (approvedRes.success && approvedRes.data) {
          const approved = Array.isArray(approvedRes.data) ? approvedRes.data : [];
          allActions = [...allActions, ...approved];
        }
        
        const rejectedRes = await getRejectedActionsApi();
        if (rejectedRes.success && rejectedRes.data) {
          const rejected = Array.isArray(rejectedRes.data) ? rejectedRes.data : [];
          allActions = [...allActions, ...rejected];
        }
      } else {
        // User thường: Chỉ load posts của chính họ
        console.log('[ActionsContext] Loading user posts for regular user...');
        const userActionsRes = await getUserActionsApi(currentUser.id, null);
        if (userActionsRes.success && userActionsRes.data) {
          allActions = Array.isArray(userActionsRes.data) ? userActionsRes.data : [];
        }
      }
      
      console.log('[ActionsContext] Đã load actions:', {
        total: allActions.length,
        pending: allActions.filter(a => a.status === 'pending').length,
        approved: allActions.filter(a => a.status === 'approved').length,
        rejected: allActions.filter(a => a.status === 'rejected').length
      });
      
      setPendingActions(allActions);
    } catch (error) {
      console.error('[ActionsContext] Error loading actions:', error);
      setPendingActions([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id, user?.role, user?.roleName]); // Chỉ depend vào các giá trị primitive thay vì toàn bộ user object

  useEffect(() => {
    // Đợi AuthContext load xong trước khi load actions
    if (authLoading) {
      console.log('[ActionsContext] Waiting for auth to load...');
      return;
    }

    // Chỉ load actions khi user đã đăng nhập và có id
    if (isAuthenticated && user?.id) {
      console.log('[ActionsContext] User authenticated, loading actions for user:', user.id);
      loadActions();
    } else {
      // Clear actions nếu user chưa đăng nhập
      console.log('[ActionsContext] User not authenticated, clearing actions');
      setPendingActions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, authLoading]); // Không thêm loadActions vào deps để tránh infinite loop

  const addPendingAction = async (action) => {
    try {
      const response = await submitActionApi(action);
      if (response.success) {
        // Reload actions từ API để đảm bảo có status chính xác từ database
        await loadActions();
        return { success: true, message: response.message, data: response.data };
      }
      return { success: false, message: response.message || 'Gửi hành động thất bại' };
    } catch (error) {
      return { success: false, message: error.message || 'Gửi hành động thất bại' };
    }
  };

  const approveAction = async (actionId, comment = '', rewards = { streak: 1, ecoTokens: 10 }) => {
    try {
      const response = await approveActionApi(actionId, comment, rewards);
      if (response.success) {
        // Reload từ API để đảm bảo dữ liệu đồng bộ với database
        await loadActions();
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message || 'Duyệt hành động thất bại' };
    } catch (error) {
      return { success: false, message: error.message || 'Duyệt hành động thất bại' };
    }
  };

  const rejectAction = async (actionId, comment) => {
    try {
      const response = await rejectActionApi(actionId, comment);
      if (response.success) {
        // Reload từ API để đảm bảo dữ liệu đồng bộ với database
        await loadActions();
        return { success: true, message: response.message };
      }
      return { success: false, message: response.message || 'Từ chối hành động thất bại' };
    } catch (error) {
      return { success: false, message: error.message || 'Từ chối hành động thất bại' };
    }
  };

  const getPendingActions = () => {
    return pendingActions.filter(action => action.status === 'pending');
  };

  const getApprovedActions = () => {
    return pendingActions.filter(action => action.status === 'approved');
  };

  const getRejectedActions = () => {
    return pendingActions.filter(action => action.status === 'rejected');
  };

  const getUserActions = async (userId) => {
    try {
      const response = await getUserActionsApi(userId);
      if (response.success) {
        return response.data;
      }
      return [];
    } catch (error) {
      // Fallback to local data
      return pendingActions.filter(action => action.userId === userId);
    }
  };

  return (
    <ActionsContext.Provider
      value={{
        pendingActions,
        loading,
        addPendingAction,
        approveAction,
        rejectAction,
        getPendingActions,
        getApprovedActions,
        getRejectedActions,
        getUserActions,
        loadActions
      }}
    >
      {children}
    </ActionsContext.Provider>
  );
};

