import { createContext, useContext, useState, useEffect } from 'react';
import { 
  getConfigApi, 
  updateGiftPriceApi, 
  updateStreakMilestoneApi, 
  updateActionRewardApi, 
  updateDefaultActionRewardApi 
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
      tags: {
        'xe-dap': { streak: 1, ecoTokens: 15 },
        'mang-coc': { streak: 1, ecoTokens: 12 },
        'trong-cay': { streak: 1, ecoTokens: 20 },
        'phan-loai-rac': { streak: 1, ecoTokens: 12 },
        'binh-nuoc': { streak: 1, ecoTokens: 10 },
        'tui-vai': { streak: 1, ecoTokens: 10 }
      }
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

  const updateActionReward = async (tag, reward) => {
    try {
      const response = await updateActionRewardApi(tag, reward);
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
    return config.actionRewards.tags[tag] || config.actionRewards.default;
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
        getGiftPrice,
        getActionReward
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

