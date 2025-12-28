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

  // Load gifts from API
  useEffect(() => {
    const loadGifts = async () => {
      try {
        setLoading(true);
        const response = await getGiftsApi();
        if (response.success) {
          // Add default category, description, stock to gifts from API
          const defaultGiftsData = {
            1: { category: 'handmade', description: 'Túi vải thân thiện môi trường, thiết kế độc đáo', stock: 10 },
            2: { category: 'handmade', description: 'Bình nước giữ nhiệt', stock: 15 },
            3: { category: 'handmade', description: 'Bộ ống hút tre', stock: 25 },
            4: { category: 'handmade', description: 'Cốc cà phê handmade', stock: 20 },
            5: { category: 'handmade', description: 'Hộp đựng thức ăn thủy tinh', stock: 12 }
          };
          
          const enrichedGifts = response.data.map(gift => ({
            ...gift,
            ...(defaultGiftsData[gift.id] || { category: 'handmade', description: gift.description || '', stock: 10 })
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

  const filteredGifts = selectedCategory === 'all'
    ? gifts
    : gifts.filter(gift => gift.category === selectedCategory);

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
        {filteredGifts.map(gift => (
          <div key={gift.id} className="gift-card">
            <div className="gift-image">
              {gift.imageUrl || gift.image ? (
                <img src={gift.imageUrl || gift.image} alt={gift.name} />
              ) : (
                <div className="gift-placeholder">🛍️</div>
              )}
            </div>
            <div className="gift-info">
              <h3>{gift.name}</h3>
              <p className="gift-description">{gift.description}</p>
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
        ))}
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

