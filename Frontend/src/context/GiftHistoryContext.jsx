import { createContext, useContext, useState, useEffect } from 'react';
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

  // Load gift history from API
  const loadGiftHistory = async (userId = null) => {
    try {
      setLoading(true);
      const response = await getGiftHistoryApi(userId);
      if (response.success) {
        setGiftHistory(response.data);
      }
    } catch (error) {
      console.error('Error loading gift history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGiftHistory();
  }, []);

  const addGiftExchange = (exchange) => {
    // This is called from exchangeGiftApi, so we just update local state
    const newExchange = {
      ...exchange,
      id: exchange.id || Date.now(),
      exchangedAt: exchange.exchangedAt || new Date().toISOString()
    };
    setGiftHistory(prev => [newExchange, ...prev]);
  };

  const getUserGiftHistory = (userId) => {
    return giftHistory.filter(exchange => exchange.userId === userId);
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

