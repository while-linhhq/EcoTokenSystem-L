import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getGiftHistoryApi } from '../api/giftHistoryApi';

const GiftHistoryContext = createContext();

export const useGiftHistory = () => {
  const context = useContext(GiftHistoryContext);
  if (!context) {
    throw new Error('useGiftHistory must be used within GiftHistoryProvider');
  }
  return context;
};

export const GiftHistoryProvider = ({ children }) => {
  const [giftHistory, setGiftHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated, user, loading: authLoading } = useAuth();

  // Load gift history from API
  const loadGiftHistory = useCallback(async (userId = null) => {
    // Chỉ load nếu user đã đăng nhập
    if (!isAuthenticated || !user?.id) {
      console.log('[GiftHistoryContext] User not authenticated, skipping loadGiftHistory');
      return;
    }

    try {
      setLoading(true);
      console.log('[GiftHistoryContext] Loading gift history from API...');
      const response = await getGiftHistoryApi(userId || user.id);
      console.log('[GiftHistoryContext] API response:', {
        success: response.success,
        dataLength: response.data?.length || 0,
        hasData: !!response.data
      });

      if (response.success && response.data) {
        // Đảm bảo response.data là array
        const historyData = Array.isArray(response.data) ? response.data : [];
        console.log('[GiftHistoryContext] Setting gift history:', historyData.length, 'items');
        setGiftHistory(historyData);
      } else {
        console.warn('[GiftHistoryContext] API returned unsuccessful response:', response);
        setGiftHistory([]);
      }
    } catch (error) {
      console.error('[GiftHistoryContext] Error loading gift history:', error);
      setGiftHistory([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user?.id]); // Chỉ depend vào user?.id thay vì toàn bộ user object

  useEffect(() => {
    // Đợi AuthContext load xong trước khi load gift history
    if (authLoading) {
      console.log('[GiftHistoryContext] Waiting for auth to load...');
      return;
    }

    // Chỉ load khi user đã đăng nhập và có id
    if (isAuthenticated && user?.id) {
      console.log('[GiftHistoryContext] User authenticated, loading gift history for user:', user.id);
      loadGiftHistory();
    } else {
      console.log('[GiftHistoryContext] User not authenticated or no user id, clearing gift history');
      setGiftHistory([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, user?.id, authLoading]); // Không thêm loadGiftHistory vào deps để tránh infinite loop

  const addGiftExchange = async (exchange) => {
    // Reload từ API để đảm bảo đồng bộ với database
    // Backend đã tự động tạo ItemsHistory khi exchange thành công
    if (isAuthenticated && user) {
      await loadGiftHistory();
    } else {
      // Fallback: chỉ update local state nếu chưa đăng nhập (không nên xảy ra)
      const newExchange = {
        ...exchange,
        id: exchange.id || Date.now(),
        exchangedAt: exchange.exchangedAt || new Date().toISOString()
      };
      setGiftHistory(prev => [newExchange, ...prev]);
    }
  };

  const getUserGiftHistory = (userId) => {
    // API đã trả về dữ liệu đã được lọc theo user hiện tại (từ JWT token)
    // Nhưng vẫn filter để đảm bảo an toàn và hỗ trợ admin view
    if (!userId || userId === 0) {
      // Nếu không có userId, trả về toàn bộ (đã được filter từ API)
      return giftHistory;
    }

    // Convert cả hai về string để so sánh an toàn (tránh lỗi type mismatch)
    const targetUserId = userId?.toString() || userId;
    return giftHistory.filter(exchange => {
      const exchangeUserId = exchange.userId?.toString() || exchange.userId;
      return exchangeUserId === targetUserId;
    });
  };

  return (
    <GiftHistoryContext.Provider
      value={{
        giftHistory,
        loading,
        addGiftExchange,
        getUserGiftHistory,
        loadGiftHistory
      }}
    >
      {children}
    </GiftHistoryContext.Provider>
  );
};

