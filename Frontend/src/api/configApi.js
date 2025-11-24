import { createResponse, delay } from './api';

// Get config API
export const getConfigApi = async () => {
  await delay(300);

  const defaultConfig = {
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
  };

  const saved = localStorage.getItem('appConfig');
  const config = saved ? JSON.parse(saved) : defaultConfig;

  // Merge with defaults to ensure all fields exist
  const mergedConfig = {
    giftPrices: { ...defaultConfig.giftPrices, ...config.giftPrices },
    streakMilestones: { ...defaultConfig.streakMilestones, ...config.streakMilestones },
    actionRewards: {
      default: { ...defaultConfig.actionRewards.default, ...(config.actionRewards?.default || {}) },
      tags: { ...defaultConfig.actionRewards.tags, ...(config.actionRewards?.tags || {}) }
    }
  };

  return createResponse(mergedConfig, true);
};

// Update gift price API
export const updateGiftPriceApi = async (giftId, price) => {
  await delay(500);

  const saved = localStorage.getItem('appConfig');
  const config = saved ? JSON.parse(saved) : { giftPrices: {} };

  config.giftPrices = {
    ...config.giftPrices,
    [giftId]: price
  };

  localStorage.setItem('appConfig', JSON.stringify(config));
  return createResponse(config, true, 'Cập nhật giá quà thành công');
};

// Update streak milestone API
export const updateStreakMilestoneApi = async (streak, milestone) => {
  await delay(500);

  const saved = localStorage.getItem('appConfig');
  const config = saved ? JSON.parse(saved) : { streakMilestones: {} };

  config.streakMilestones = {
    ...config.streakMilestones,
    [streak]: milestone
  };

  localStorage.setItem('appConfig', JSON.stringify(config));
  return createResponse(config, true, 'Cập nhật milestone thành công');
};

// Update action reward API
export const updateActionRewardApi = async (tag, reward) => {
  await delay(500);

  const saved = localStorage.getItem('appConfig');
  const config = saved ? JSON.parse(saved) : { actionRewards: { tags: {} } };

  if (!config.actionRewards) {
    config.actionRewards = { tags: {} };
  }
  if (!config.actionRewards.tags) {
    config.actionRewards.tags = {};
  }

  config.actionRewards.tags = {
    ...config.actionRewards.tags,
    [tag]: reward
  };

  localStorage.setItem('appConfig', JSON.stringify(config));
  return createResponse(config, true, 'Cập nhật phần thưởng thành công');
};

// Update default action reward API
export const updateDefaultActionRewardApi = async (reward) => {
  await delay(500);

  const saved = localStorage.getItem('appConfig');
  const config = saved ? JSON.parse(saved) : { actionRewards: { default: {} } };

  if (!config.actionRewards) {
    config.actionRewards = { default: {} };
  }

  config.actionRewards.default = reward;

  localStorage.setItem('appConfig', JSON.stringify(config));
  return createResponse(config, true, 'Cập nhật phần thưởng mặc định thành công');
};

