import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGiftHistory } from '../context/GiftHistoryContext';
import { useConfig } from '../context/ConfigContext';
import { getGiftsApi, exchangeGiftApi } from '../api/giftsApi';
import { getCurrentUserApi } from '../api/authApi';
import './EcoMarket.css';

const EcoMarket = () => {
  const { user, login, updateUser } = useAuth();
  const { loadGiftHistory } = useGiftHistory();
  const { getGiftPrice } = useConfig();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);

  const categories = ['all', 'handmade', 'vouchers', 'books', 'movies', 'donations'];

  // Helper function để lấy thông tin tag (giống Admin)
  const getTagInfo = (tag) => {
    const tagMap = {
      handmade: { emoji: '🎨', name: 'Handmade', color: '#e91e63' },
      vouchers: { emoji: '🎫', name: 'Voucher', color: '#2196f3' },
      books: { emoji: '📚', name: 'Sách', color: '#9c27b0' },
      movies: { emoji: '🎬', name: 'Phim', color: '#f44336' },
      donations: { emoji: '❤️', name: 'Quyên góp', color: '#ff5722' }
    };
    return tagMap[tag] || { emoji: '📦', name: tag || 'Khác', color: '#757575' };
  };

  // Load gifts from API
  useEffect(() => {
    const loadGifts = async () => {
      try {
        setLoading(true);
        const response = await getGiftsApi();
        if (response.success) {
          // Sử dụng tag từ API, fallback về 'handmade' nếu không có
          const enrichedGifts = response.data.map(gift => ({
            ...gift,
            tag: gift.tag || gift.category || 'handmade',
            description: gift.description || '',
            stock: gift.stock || 10
          }));
          
          setGifts(enrichedGifts);
        }
      } catch (error) {
        console.error('Error loading gifts:', error);
      } finally {
        setLoading(false);
      }
    };
    loadGifts();
  }, []);

  // Filter gifts by tag (thay vì category)
  const filteredGifts = selectedCategory === 'all'
    ? gifts
    : gifts.filter(gift => (gift.tag || gift.category || 'handmade') === selectedCategory);

  const handleExchange = async (gift) => {
    if (!user) {
      alert('Vui lòng đăng nhập để đổi quà');
      return;
    }

    const price = getGiftPrice(gift.id, gift.price);
    const userPoints = user.currentPoints || user.ecoTokens || 0;

    if (userPoints < price) {
      alert(`Bạn không đủ Eco Tokens! Cần ${price} tokens, bạn có ${userPoints} tokens.`);
      return;
    }

    if (gift.stock <= 0) {
      alert('Quà đã hết hàng!');
      return;
    }

    if (window.confirm(`Bạn có chắc muốn đổi "${gift.name}" với ${price} Eco Tokens?`)) {
      try {
        setLoading(true);
        const response = await exchangeGiftApi(user.id, gift.id, price);
        
        if (response.success) {
          // Refresh toàn bộ user data từ API để đồng bộ tokens và streak với database
          const userResponse = await getCurrentUserApi();
          if (userResponse.success && userResponse.data) {
            await updateUser(userResponse.data);
          }
          
          // Reload gift history từ API (backend đã tự động tạo ItemsHistory)
          await loadGiftHistory(user.id);
          
          const remainingTokens = userResponse.data?.ecoTokens || userResponse.data?.currentPoints || response.data?.remainingTokens || 0;
          alert(response.message || `Đổi quà thành công! Bạn còn ${remainingTokens} Eco Tokens.`);
        } else {
          alert(response.message || 'Có lỗi xảy ra khi đổi quà');
        }
      } catch (error) {
        alert(error.message || 'Có lỗi xảy ra khi đổi quà');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="market-container">
      <div className="market-header">
        <h1>🛍️ Eco Market</h1>
        <p>Đổi Eco Tokens lấy quà tặng thân thiện môi trường</p>
        {user && (
          <div className="user-tokens">
            <span className="token-icon">🪙</span>
            <span className="token-amount">{user.currentPoints || user.ecoTokens || 0} Eco Tokens</span>
          </div>
        )}
      </div>

      <div className="category-filter">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category === 'all' ? 'Tất cả' :
             category === 'handmade' ? 'Handmade' :
             category === 'vouchers' ? 'Voucher' :
             category === 'books' ? 'Sách' :
             category === 'movies' ? 'Phim' :
             'Quyên góp'}
          </button>
        ))}
      </div>

      <div className="gifts-grid">
        {filteredGifts.map(gift => {
          const tagInfo = getTagInfo(gift.tag || gift.category || 'handmade');
          
          return (
            <div key={gift.id} className="gift-card">
              <div className="gift-image-wrapper">
                {gift.imageUrl || gift.image ? (
                  <img src={gift.imageUrl || gift.image} alt={gift.name} className="gift-image" />
                ) : (
                  <div className="gift-placeholder">🛍️</div>
                )}
                <div className="gift-tag-badge" style={{ backgroundColor: tagInfo.color }}>
                  <span className="tag-emoji">{tagInfo.emoji}</span>
                  <span className="tag-name">{tagInfo.name}</span>
                </div>
              </div>
              <div className="gift-info">
                <h3>{gift.name}</h3>
                {gift.description && <p className="gift-description">{gift.description}</p>}
                <div className="gift-footer">
                  <div className="gift-price">
                    <span className="price-icon">🪙</span>
                    <span className="price-amount">{getGiftPrice(gift.id, gift.price)}</span>
                  </div>
                  <div className="gift-stock">
                    Còn: {gift.stock}
                  </div>
                </div>
                <button
                  className="exchange-btn"
                  onClick={() => handleExchange(gift)}
                  disabled={!user || (user.currentPoints || user.ecoTokens || 0) < getGiftPrice(gift.id, gift.price) || gift.stock <= 0}
                >
                  Đổi ngay
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredGifts.length === 0 && (
        <div className="no-gifts">
          <p>Không có quà nào trong danh mục này</p>
        </div>
      )}
    </div>
  );
};

export default EcoMarket;

