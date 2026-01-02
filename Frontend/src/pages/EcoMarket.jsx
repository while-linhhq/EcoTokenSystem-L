import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useGiftHistory } from '../context/GiftHistoryContext';
import { useConfig } from '../context/ConfigContext';
import { getGiftsApi, exchangeGiftApi } from '../api/giftsApi';
import { getCurrentUserApi } from '../api/authApi';
import { showSuccess, showError, showWarning } from '../utils/toast';
import './EcoMarket.css';

const EcoMarket = () => {
  const { user, login, refreshUser } = useAuth();
  const { loadGiftHistory } = useGiftHistory();
  const { getGiftPrice } = useConfig();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = ['all', 'handmade', 'vouchers', 'books', 'movies', 'donations'];

  // Helper function để lấy thông tin tag (giống Admin)
  const getTagInfo = (tag) => {
    const tagMap = {
      handmade: { emoji: '🎨', name: 'Thủ công', color: '#e91e63' },
      vouchers: { emoji: '🎫', name: 'Phiếu khuyến mãi', color: '#2196f3' },
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

  // Filter gifts by tag and search term
  const filteredGifts = gifts
    .filter(gift => {
      // Filter by category
      if (selectedCategory !== 'all') {
        return (gift.tag || gift.category || 'handmade') === selectedCategory;
      }
      return true;
    })
    .filter(gift => {
      // Filter by search term
      if (!searchTerm.trim()) return true;

      const search = searchTerm.toLowerCase();
      const name = (gift.name || '').toLowerCase();
      const description = (gift.description || '').toLowerCase();
      const tag = (gift.tag || gift.category || '').toLowerCase();

      return name.includes(search) || description.includes(search) || tag.includes(search);
    });

  const handleExchange = async (gift) => {
    if (!user) {
      showWarning('Vui lòng đăng nhập để đổi quà');
      return;
    }

    const price = getGiftPrice(gift.id, gift.price);
    const userPoints = user.currentPoints || user.ecoTokens || 0;

    if (userPoints < price) {
      showWarning(`Bạn không đủ Eco Tokens! Cần ${price} tokens, bạn có ${userPoints} tokens.`);
      return;
    }

    if (gift.stock <= 0) {
      showError('Quà đã hết hàng!');
      return;
    }

    if (window.confirm(`Bạn có chắc muốn đổi "${gift.name}" với ${price} Eco Tokens?`)) {
      try {
        setLoading(true);
        const response = await exchangeGiftApi(user.id, gift.id, price);
        
        if (response.success) {
          // Refresh toàn bộ user data từ API để đồng bộ tokens và streak với database
          await refreshUser();  // ✅ ĐÚNG: Chỉ GET, không PATCH

          // Reload gift history từ API (backend đã tự động tạo ItemsHistory)
          await loadGiftHistory(user.id);

          const userResponse = await getCurrentUserApi();
          const remainingTokens = userResponse.data?.ecoTokens || userResponse.data?.currentPoints || response.data?.remainingTokens || 0;
          showSuccess(response.message || `Đổi quà thành công! Bạn còn ${remainingTokens} Eco Tokens.`);
        } else {
          showError(response.message || 'Có lỗi xảy ra khi đổi quà');
        }
      } catch (error) {
        showError(error.message || 'Có lỗi xảy ra khi đổi quà');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="market-container">
      <div className="market-header">
        <h1>🛍️ Cửa hàng</h1>
        <p>Đổi Eco Tokens lấy quà tặng thân thiện môi trường</p>
        {user && (
          <div className="user-tokens">
            <span className="token-icon">🪙</span>
            <span className="token-amount">{user.currentPoints || user.ecoTokens || 0} Eco Tokens</span>
          </div>
        )}
      </div>

      <div className="search-filter-section">
        <div className="search-bar">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm sản phẩm theo tên, mô tả..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          {searchTerm && (
            <button
              className="clear-search"
              onClick={() => setSearchTerm('')}
              title="Xóa tìm kiếm"
            >
              ✕
            </button>
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
               category === 'handmade' ? 'Thủ công' :
               category === 'vouchers' ? 'Phiếu khuyến mãi' :
               category === 'books' ? 'Sách' :
               category === 'movies' ? 'Phim' :
               'Quyên góp'}
            </button>
          ))}
        </div>
      </div>

      {searchTerm && (
        <div className="search-results-info">
          Tìm thấy <strong>{filteredGifts.length}</strong> sản phẩm cho "{searchTerm}"
        </div>
      )}

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

