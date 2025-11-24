import { createResponse, delay } from './api';

// Get gift history API
export const getGiftHistoryApi = async (userId = null) => {
  await delay(400);

  const historyStr = localStorage.getItem('giftHistory');
  const history = historyStr ? JSON.parse(historyStr) : [];

  if (userId) {
    const userHistory = history.filter(item => item.userId === userId);
    return createResponse(userHistory, true);
  }

  return createResponse(history, true);
};

