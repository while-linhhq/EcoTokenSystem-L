import { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useGiftHistory } from '../context/GiftHistoryContext';
import { formatDate } from '../utils/dateUtils';
import { Search } from 'lucide-react';
import './GiftHistory.css';

const GiftHistory = () => {
  const { user } = useAuth();
  const { giftHistory, loading } = useGiftHistory();
  const [searchTerm, setSearchTerm] = useState('');
  
  // API đã trả về dữ liệu đã được lọc theo user hiện tại (từ JWT token)
  // Không cần filter lại, sử dụng trực tiếp giftHistory từ context
  const history = giftHistory || [];
  
  // Filter history based on search term
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return history;
    
    const term = searchTerm.toLowerCase();
    return history.filter(item => {
      const name = (item.giftName || '').toLowerCase();
      const description = (item.giftDescription || '').toLowerCase();
      return name.includes(term) || description.includes(term);
    });
  }, [history, searchTerm]);
  
  // Total spent should be calculated from all history, not filtered
  const totalSpent = history.reduce((sum, item) => sum + (item.price || 0), 0);
  
  // Tính số token còn lại sau mỗi lần đổi quà
  // History được sắp xếp từ mới đến cũ (OrderByDescending)
  // tokensAfter của item = số token sau khi đổi quà đó
  const currentPoints = user?.currentPoints || user?.ecoTokens || 0;
  
  // Tính tokensAfter cho mỗi item
  // Item đầu tiên (mới nhất): tokensAfter = currentPoints (sau khi đổi quà này, số token là currentPoints)
  // Item tiếp theo: tokensAfter = currentPoints + price của item trước (vì đã đổi item trước nên token giảm)
  // tokensAfter = currentPoints + tổng điểm đã đổi từ item này trở về sau (các item mới hơn hoặc bằng)
  const historyWithTokens = filteredHistory.map((item, index) => {
    // Tính tổng điểm đã đổi từ item này trở về sau (các item mới hơn hoặc bằng, tức là từ đầu mảng đến item này)
    // Vì history được sắp xếp từ mới đến cũ, index 0 là mới nhất
    const pointsSpentFromThis = history.slice(0, index + 1).reduce((sum, spentItem) => sum + (spentItem.price || 0), 0);
    // tokensAfter = currentPoints + tổng điểm đã đổi từ item này trở về sau
    // Đây là số token trước khi đổi item này, nhưng chúng ta cần số token sau khi đổi
    // Vậy tokensAfter = currentPoints + pointsSpentFromThis - item.price
    // = currentPoints + (pointsSpentFromThis - item.price)
    // = currentPoints + pointsSpentBeforeThis
    const pointsSpentBeforeThis = history.slice(0, index).reduce((sum, spentItem) => sum + (spentItem.price || 0), 0);
    const tokensAfter = currentPoints + pointsSpentBeforeThis;
    return {
      ...item,
      tokensAfter
    };
  });

  return (
    <div className="gift-history-container">
      <div className="history-header">
        <h1>📦 Lịch sử đổi quà</h1>
        <p>Xem lại các quà tặng bạn đã đổi</p>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên quà..."
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

      {searchTerm && (
        <div className="search-results-info">
          Tìm thấy <strong>{filteredHistory.length}</strong> quà cho "{searchTerm}"
        </div>
      )}

      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-label">Tổng số quà đã đổi</div>
          <div className="stat-value">{filteredHistory.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Tổng Eco Tokens đã dùng</div>
          <div className="stat-value">🪙 {totalSpent}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">
          <div className="empty-icon">⏳</div>
          <p>Đang tải lịch sử đổi quà...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>{searchTerm ? 'Không tìm thấy quà nào' : 'Bạn chưa đổi quà nào'}</p>
          <p className="empty-hint">{searchTerm ? 'Thử tìm kiếm với từ khóa khác' : 'Hãy đến Cửa hàng để đổi quà tặng thân thiện môi trường!'}</p>
        </div>
      ) : (
        <div className="history-list">
          {historyWithTokens.map((item) => (
            <div key={item.id} className="history-item">
              <div className="gift-image-large">
                {item.giftImageUrl || item.giftImage ? (
                  <img src={item.giftImageUrl || item.giftImage} alt={item.giftName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }} />
                ) : (
                  <div style={{ fontSize: '3em' }}>🛍️</div>
                )}
              </div>
              <div className="gift-details">
                <h3>{item.giftName}</h3>
                {item.giftDescription && <p className="gift-description">{item.giftDescription}</p>}
                <div className="exchange-info">
                  <div className="info-row">
                    <span className="info-label">Giá:</span>
                    <span className="info-value">🪙 {item.price} Eco Tokens</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Thời gian:</span>
                    <span className="info-value">{formatDate(item.exchangedAt)}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Tokens còn lại:</span>
                    <span className="info-value">🪙 {item.tokensAfter !== undefined && item.tokensAfter !== null ? item.tokensAfter : 0}</span>
                  </div>
                </div>
              </div>
              <div className="exchange-status">
                <span className="status-badge completed">✅ Đã đổi</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GiftHistory;

