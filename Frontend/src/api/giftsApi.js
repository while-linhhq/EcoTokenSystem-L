import { createResponse, createError, delay } from './api';

// Mock gifts data
const defaultGifts = [
  { id: 1, name: 'Túi vải thân thiện', price: 50, tag: 'tui-vai', description: 'Túi vải tái sử dụng', image: '👜' },
  { id: 2, name: 'Bình nước inox', price: 100, tag: 'binh-nuoc', description: 'Bình nước giữ nhiệt', image: '🥤' },
  { id: 3, name: 'Ống hút tre', price: 30, tag: 'ong-hut', description: 'Bộ ống hút tre', image: '🌿' },
  { id: 4, name: 'Cốc cà phê tre', price: 80, tag: 'coc-ca-phe', description: 'Cốc cà phê handmade', image: '☕' },
  { id: 5, name: 'Hộp đựng thức ăn', price: 120, tag: 'hop-thuc-an', description: 'Hộp đựng thức ăn thủy tinh', image: '🍱' }
];

// Get gifts API
export const getGiftsApi = async () => {
  await delay(400);

  // Get custom prices from config
  const configStr = localStorage.getItem('appConfig');
  const config = configStr ? JSON.parse(configStr) : {};
  const giftPrices = config.giftPrices || {};

  // Merge with default prices
  const gifts = defaultGifts.map(gift => ({
    ...gift,
    price: giftPrices[gift.id] !== undefined ? giftPrices[gift.id] : gift.price
  }));

  return createResponse(gifts, true);
};

// Exchange gift API
export const exchangeGiftApi = async (userId, giftId, giftPrice) => {
  await delay(700);

  // Get user
  const userStr = localStorage.getItem(`user_${userId}`) || localStorage.getItem('user');
  if (!userStr) {
    return createError('Không tìm thấy user', 404);
  }

  const user = JSON.parse(userStr);

  // Check balance
  if (user.ecoTokens < giftPrice) {
    return createError(`Bạn không đủ Eco Tokens! Cần ${giftPrice} tokens, bạn có ${user.ecoTokens} tokens.`, 400);
  }

  // Get gift info
  const gifts = defaultGifts;
  const gift = gifts.find(g => g.id === giftId);
  if (!gift) {
    return createError('Không tìm thấy quà', 404);
  }

  // Update user balance
  const updatedUser = {
    ...user,
    ecoTokens: user.ecoTokens - giftPrice
  };
  localStorage.setItem(`user_${userId}`, JSON.stringify(updatedUser));

  // Update current user if it's the same
  const currentUser = localStorage.getItem('user');
  if (currentUser) {
    const current = JSON.parse(currentUser);
    if (current.id === userId) {
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  }

  // Add to gift history
  const giftHistory = JSON.parse(localStorage.getItem('giftHistory') || '[]');
  giftHistory.unshift({
    id: Date.now(),
    userId,
    giftId,
    giftName: gift.name,
    giftImage: gift.image,
    price: giftPrice,
    exchangedAt: new Date().toISOString()
  });
  localStorage.setItem('giftHistory', JSON.stringify(giftHistory));

  return createResponse({
    gift,
    remainingTokens: updatedUser.ecoTokens
  }, true, `Đổi quà thành công! Bạn còn ${updatedUser.ecoTokens} Eco Tokens.`);
};

