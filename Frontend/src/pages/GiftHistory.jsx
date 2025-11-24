import { useAuth } from '../context/AuthContext';
import { useGiftHistory } from '../context/GiftHistoryContext';
import './GiftHistory.css';

const GiftHistory = () => {
  const { user } = useAuth();
  const { getUserGiftHistory } = useGiftHistory();
  
  const history = getUserGiftHistory(user?.id || 0);
  const totalSpent = history.reduce((sum, item) => sum + item.price, 0);

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

      {history.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <p>Bạn chưa đổi quà nào</p>
          <p className="empty-hint">Hãy đến Eco Market để đổi quà tặng thân thiện môi trường!</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((item) => (
            <div key={item.id} className="history-item">
              <div className="gift-image-large">{item.giftImage}</div>
              <div className="gift-details">
                <h3>{item.giftName}</h3>
                <p className="gift-description">{item.giftDescription}</p>
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
                    <span className="info-value">🪙 {item.tokensAfter}</span>
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

