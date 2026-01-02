/**
 * Config API
 *
 * API functions for managing system configuration (gift prices, streak milestones, action rewards)
 */

import { apiGet, apiPatch, apiDelete } from './apiClient';

const mapStreakMilestones = (rawMilestones) => {
  const mapped = {};
  if (!rawMilestones || typeof rawMilestones !== 'object') return mapped;
  
  Object.entries(rawMilestones).forEach(([key, value]) => {
    mapped[key] = value;
  });
  
  return mapped;
};

/**
 * Get config API
 * GET /api/Config
 */
export const getConfigApi = async () => {
  try {
    const response = await apiGet('/Config', false); // Không cần auth để xem config

    if (response.success && response.data) {
      // Backend trả về ConfigDTO với Data property
      const configData = response.data.Data || response.data.data || response.data;
      const rawStreakMilestones = configData.StreakMilestones || configData.streakMilestones || {};
      
      return {
        success: true,
        message: response.message || 'Lấy cấu hình thành công',
        data: {
          giftPrices: configData.GiftPrices || configData.giftPrices || {},
          streakMilestones: mapStreakMilestones(rawStreakMilestones),
          actionRewards: configData.ActionRewards || configData.actionRewards || {
            default: { streak: 1, ecoTokens: 10 },
            milestones: {}
          }
        }
      };
    }

    // Fallback to default if API fails
    const defaultConfig = {
      giftPrices: {},
      streakMilestones: {
        50: { color: '#4A90E2', emoji: '🐢', name: 'Linh vật xanh dương' },
        100: { color: '#FFD700', emoji: '🌟', name: 'Linh vật vàng' }
      },
      actionRewards: {
        default: { streak: 1, ecoTokens: 10 },
        milestones: {}
      }
    };

    return {
      success: true,
      message: 'Sử dụng cấu hình mặc định',
      data: defaultConfig
    };
  } catch (error) {
    console.error('[getConfigApi] Error:', error);
    // Return default config on error
    return {
      success: true,
      message: 'Sử dụng cấu hình mặc định (lỗi khi gọi API)',
      data: {
        giftPrices: {},
        streakMilestones: {
          50: { color: '#4A90E2', emoji: '🐢', name: 'Linh vật xanh dương' },
          100: { color: '#FFD700', emoji: '🌟', name: 'Linh vật vàng' }
        },
        actionRewards: {
          default: { streak: 1, ecoTokens: 10 },
          milestones: {}
        }
      }
    };
  }
};

// Update gift price API
// PATCH /api/Config/gift-prices
export const updateGiftPriceApi = async (giftId, price) => {
  try {
    const response = await apiPatch('/Config/gift-prices', {
      giftId: giftId,
      price: price
    }, true); // Cần auth (Admin)

    if (response.success && response.data) {
      const configData = response.data.Data || response.data.data || response.data;
      const rawStreakMilestones = configData.StreakMilestones || configData.streakMilestones || {};
      return {
        success: true,
        message: response.message || 'Cập nhật giá quà thành công',
        data: {
          giftPrices: configData.GiftPrices || configData.giftPrices || {},
          streakMilestones: mapStreakMilestones(rawStreakMilestones),
          actionRewards: configData.ActionRewards || configData.actionRewards || {
            default: { streak: 1, ecoTokens: 10 },
            milestones: {}
          }
        }
      };
    }

    throw new Error(response.message || 'Cập nhật giá quà thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Cập nhật giá quà thất bại'
    };
  }
};

// Update streak milestone API
// PATCH /api/Config/streak-milestones
export const updateStreakMilestoneApi = async (streak, milestone) => {
  try {
    const response = await apiPatch('/Config/streak-milestones', {
      streak: streak,
      milestone: milestone
    }, true); // Cần auth (Admin)

    if (response.success && response.data) {
      const configData = response.data.Data || response.data.data || response.data;
      const rawStreakMilestones = configData.StreakMilestones || configData.streakMilestones || {};
      return {
        success: true,
        message: response.message || 'Cập nhật milestone thành công',
        data: {
          giftPrices: configData.GiftPrices || configData.giftPrices || {},
          streakMilestones: mapStreakMilestones(rawStreakMilestones),
          actionRewards: configData.ActionRewards || configData.actionRewards || {
            default: { streak: 1, ecoTokens: 10 },
            milestones: {}
          }
        }
      };
    }

    throw new Error(response.message || 'Cập nhật milestone thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Cập nhật milestone thất bại'
    };
  }
};

// Update action reward milestone API
// PATCH /api/Config/action-rewards
export const updateActionRewardApi = async (streakMilestone, bonusTokens) => {
  try {
    const response = await apiPatch('/Config/action-rewards', {
      streakMilestone: streakMilestone,
      bonusTokens: bonusTokens
    }, true); // Cần auth (Admin)

    if (response.success && response.data) {
      const configData = response.data.Data || response.data.data || response.data;
      const rawStreakMilestones = configData.StreakMilestones || configData.streakMilestones || {};
      return {
        success: true,
        message: response.message || 'Cập nhật phần thưởng thành công',
        data: {
          giftPrices: configData.GiftPrices || configData.giftPrices || {},
          streakMilestones: mapStreakMilestones(rawStreakMilestones),
          actionRewards: configData.ActionRewards || configData.actionRewards || {
            default: { streak: 1, ecoTokens: 10 },
            milestones: {}
          }
        }
      };
    }

    throw new Error(response.message || 'Cập nhật phần thưởng thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Cập nhật phần thưởng thất bại'
    };
  }
};

// Update default action reward API
// PATCH /api/Config/action-rewards/default
export const updateDefaultActionRewardApi = async (reward) => {
  try {
    const response = await apiPatch('/Config/action-rewards/default', reward, true); // Cần auth (Admin)

    if (response.success && response.data) {
      const configData = response.data.Data || response.data.data || response.data;
      const rawStreakMilestones = configData.StreakMilestones || configData.streakMilestones || {};
      return {
        success: true,
        message: response.message || 'Cập nhật phần thưởng mặc định thành công',
        data: {
          giftPrices: configData.GiftPrices || configData.giftPrices || {},
          streakMilestones: mapStreakMilestones(rawStreakMilestones),
          actionRewards: configData.ActionRewards || configData.actionRewards || {
            default: { streak: 1, ecoTokens: 10 },
            milestones: {}
          }
        }
      };
    }

    throw new Error(response.message || 'Cập nhật phần thưởng mặc định thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Cập nhật phần thưởng mặc định thất bại'
    };
  }
};

// Delete streak milestone API
// DELETE /api/Config/streak-milestones/{streak}
export const deleteStreakMilestoneApi = async (streak) => {
  try {
    const response = await apiDelete(`/Config/streak-milestones/${streak}`, true); // Cần auth (Admin)

    if (response.success && response.data) {
      const configData = response.data.Data || response.data.data || response.data;
      const rawStreakMilestones = configData.StreakMilestones || configData.streakMilestones || {};
      return {
        success: true,
        message: response.message || 'Xóa milestone thành công',
        data: {
          giftPrices: configData.GiftPrices || configData.giftPrices || {},
          streakMilestones: mapStreakMilestones(rawStreakMilestones),
          actionRewards: configData.ActionRewards || configData.actionRewards || {
            default: { streak: 1, ecoTokens: 10 },
            milestones: {}
          }
        }
      };
    }

    throw new Error(response.message || 'Xóa milestone thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Xóa milestone thất bại'
    };
  }
};

// Delete action reward milestone API
// DELETE /api/Config/action-rewards/{streakMilestone}
export const deleteActionRewardApi = async (streakMilestone) => {
  try {
    const response = await apiDelete(`/Config/action-rewards/${streakMilestone}`, true); // Cần auth (Admin)

    if (response.success && response.data) {
      const configData = response.data.Data || response.data.data || response.data;
      const rawStreakMilestones = configData.StreakMilestones || configData.streakMilestones || {};
      return {
        success: true,
        message: response.message || 'Xóa action reward milestone thành công',
        data: {
          giftPrices: configData.GiftPrices || configData.giftPrices || {},
          streakMilestones: mapStreakMilestones(rawStreakMilestones),
          actionRewards: configData.ActionRewards || configData.actionRewards || {
            default: { streak: 1, ecoTokens: 10 },
            milestones: {}
          }
        }
      };
    }

    throw new Error(response.message || 'Xóa action reward milestone thất bại');
  } catch (error) {
    return {
      success: false,
      message: error.message || 'Xóa action reward milestone thất bại'
    };
  }
};
