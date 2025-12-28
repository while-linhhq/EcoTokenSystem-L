import { useAuth } from '../context/AuthContext';
import { useGiftHistory } from '../context/GiftHistoryContext';
import './GiftHistory.css';

const GiftHistory = () => {
  const { user } = useAuth();
  const { giftHistory, loading } = useGiftHistory();
  
  // API đã trả về dữ liệu đã được lọc theo user hiện tại (từ JWT token)
  // Không cần filter lại, sử dụng trực tiếp giftHistory từ context
  const history = giftHistory || [];
  const totalSpent = history.reduce((sum, item) => sum + (item.price || 0), 0);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  return (
    <div className="gift-history-container">
      <div className="history-header">
        <h1>📦 Lịch sử đổi quà</h1>
        <p>Xem lại các quà tặng bạn đã đổi</p>
      </div>

      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-label">Tổng số quà đã đổi</div>
          <div className="stat-value">{history.length}</div>
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
      ) : history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>Bạn chưa đổi quà nào</p>
          <p className="empty-hint">Hãy đến Eco Market để đổi quà tặng thân thiện môi trường!</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
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
                  {item.tokensAfter !== undefined && item.tokensAfter !== null && (
                    <div className="info-row">
                      <span className="info-label">Tokens còn lại:</span>
                      <span className="info-value">🪙 {item.tokensAfter}</span>
                    </div>
                  )}
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

