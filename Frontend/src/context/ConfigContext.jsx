import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getConfigApi, 
  updateGiftPriceApi, 
  updateStreakMilestoneApi, 
  updateActionRewardApi, 
  updateDefaultActionRewardApi,
  deleteStreakMilestoneApi,
  deleteActionRewardApi
} from '../api/configApi';

const ConfigContext = createContext();

export const useConfig = () => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
};

export const ConfigProvider = ({ children }) => {
  const [config, setConfig] = useState({
    giftPrices: {},
    streakMilestones: {
      50: { color: '#4A90E2', emoji: '🐢', name: 'Linh vật xanh dương' },
      100: { color: '#FFD700', emoji: '🌟', name: 'Linh vật vàng' }
    },
    actionRewards: {
      default: { streak: 1, ecoTokens: 10 },
      milestones: {}
    }
  });
  const [loading, setLoading] = useState(false);

  // Load config from API
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const response = await getConfigApi();
        if (response.success) {
          setConfig(response.data);
        }
      } catch (error) {
        console.error('Error loading config:', error);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const updateGiftPrice = async (giftId, price) => {
    try {
      const response = await updateGiftPriceApi(giftId, price);
      if (response.success) {
        setConfig(response.data);
        return { success: true, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const updateStreakMilestone = async (streak, milestone) => {
    try {
      const response = await updateStreakMilestoneApi(streak, milestone);
      if (response.success) {
        setConfig(response.data);
        return { success: true, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const updateActionReward = async (streakMilestone, bonusTokens) => {
    try {
      const response = await updateActionRewardApi(streakMilestone, bonusTokens);
      if (response.success) {
        setConfig(response.data);
        return { success: true, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const updateDefaultActionReward = async (reward) => {
    try {
      const response = await updateDefaultActionRewardApi(reward);
      if (response.success) {
        setConfig(response.data);
        return { success: true, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const getGiftPrice = (giftId, defaultPrice) => {
    return config.giftPrices[giftId] !== undefined ? config.giftPrices[giftId] : defaultPrice;
  };

  const getActionReward = (tag) => {
    // Legacy function for backward compatibility - returns default reward
    // Milestones are handled separately
    return config.actionRewards.default;
  };

  const deleteStreakMilestone = async (streak) => {
    try {
      const response = await deleteStreakMilestoneApi(streak);
      if (response.success) {
        setConfig(response.data);
        return { success: true, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  const deleteActionReward = async (streakMilestone) => {
    try {
      const response = await deleteActionRewardApi(streakMilestone);
      if (response.success) {
        setConfig(response.data);
        return { success: true, message: response.message };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        loading,
        updateGiftPrice,
        updateStreakMilestone,
        updateActionReward,
        updateDefaultActionReward,
        deleteStreakMilestone,
        deleteActionReward,
        getGiftPrice,
        getActionReward
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

