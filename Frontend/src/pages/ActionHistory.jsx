import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useActions } from '../context/ActionsContext';
import './ActionHistory.css';

const ActionHistory = () => {
  const { user } = useAuth();
  const { getUserActions } = useActions();
  const [activeTab, setActiveTab] = useState('pending'); // Default to 'pending' to show newly submitted actions
  const [error, setError] = useState(null);
  const [allActions, setAllActions] = useState([]);

  useEffect(() => {
    const loadActions = async () => {
      try {
        if (user && getUserActions) {
          const actions = await getUserActions(user.id);
          setAllActions(Array.isArray(actions) ? actions : []);
        } else {
          setAllActions([]);
        }
      } catch (err) {
        // Error handling for user actions
        setError('Có lỗi khi tải dữ liệu hành động');
        setAllActions([]);
      }
    };
    loadActions();
  }, [user?.id, getUserActions]);

  const approvedActions = allActions.filter(action => action && action.status === 'approved');
  const rejectedActions = allActions.filter(action => action && action.status === 'rejected');
  const pendingActions = allActions.filter(action => action && action.status === 'pending');

  const displayedActions = activeTab === 'all' 
    ? allActions 
    : activeTab === 'approved' 
    ? approvedActions 
    : activeTab === 'rejected' 
    ? rejectedActions 
    : pendingActions;

  const totalRewards = {
    streak: approvedActions.reduce((sum, action) => sum + (action?.rewards?.streak || 0), 0),
    ecoTokens: approvedActions.reduce((sum, action) => sum + (action?.rewards?.ecoTokens || 0), 0)
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa có';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
      return date.toLocaleString('vi-VN');
    } catch {
      return 'Ngày không hợp lệ';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <span className="status-badge approved">✅ Đã duyệt</span>;
      case 'rejected':
        return <span className="status-badge rejected">❌ Đã từ chối</span>;
      case 'pending':
        return <span className="status-badge pending">⏳ Chờ duyệt</span>;
      default:
        return null;
    }
  };

  if (!user) {
    return (
      <div className="action-history-container">
        <div className="empty-state">
          <p>Vui lòng đăng nhập để xem lịch sử hành động</p>
        </div>
      </div>
    );
  }

  return (
    <div className="action-history-container">
      <div className="history-header">
        <h1>📸 Lịch sử hành động</h1>
        <p>Xem lại các hành động xanh bạn đã gửi và kết quả duyệt</p>
      </div>

      {error && (
        <div className="error-message" style={{ margin: '20px', padding: '15px', background: '#fee', color: '#c33', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div className="history-stats">
        <div className="stat-card">
          <div className="stat-label">Tổng hành động</div>
          <div className="stat-value">{allActions.length}</div>
        </div>
        <div className="stat-card approved-stat">
          <div className="stat-label">Đã duyệt</div>
          <div className="stat-value">{approvedActions.length}</div>
        </div>
        <div className="stat-card rewards-stat">
          <div className="stat-label">Tổng điểm thưởng</div>
          <div className="stat-value">
            🔥 {totalRewards.streak} Streak<br />
            🪙 {totalRewards.ecoTokens} Tokens
          </div>
        </div>
      </div>

      <div className="history-tabs">
        <button
          className={activeTab === 'all' ? 'active' : ''}
          onClick={() => setActiveTab('all')}
        >
          Tất cả ({allActions.length})
        </button>
        <button
          className={activeTab === 'approved' ? 'active' : ''}
          onClick={() => setActiveTab('approved')}
        >
          ✅ Đã duyệt ({approvedActions.length})
        </button>
        <button
          className={activeTab === 'rejected' ? 'active' : ''}
          onClick={() => setActiveTab('rejected')}
        >
          ❌ Đã từ chối ({rejectedActions.length})
        </button>
        <button
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Chờ duyệt ({pendingActions.length})
        </button>
      </div>

      {displayedActions.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📸</div>
          <p>
            {activeTab === 'all' && 'Bạn chưa gửi hành động xanh nào'}
            {activeTab === 'approved' && 'Chưa có hành động nào được duyệt'}
            {activeTab === 'rejected' && 'Chưa có hành động nào bị từ chối'}
            {activeTab === 'pending' && 'Không có hành động nào đang chờ duyệt'}
          </p>
          {activeTab === 'all' && (
            <p className="empty-hint">Hãy đến trang chủ để đăng tải hành động xanh của bạn!</p>
          )}
        </div>
      ) : (
        <div className="actions-list">
          {displayedActions.map((action) => (
            <div key={action.id} className="action-item">
              <div className="action-image-section">
                {action.imagePreview ? (
                  <img src={action.imagePreview} alt="Hành động xanh" className="action-image" />
                ) : (
                  <div className="image-placeholder">{action.imageEmoji || '📷'}</div>
                )}
              </div>
              
              <div className="action-content">
                <div className="action-header-row">
                  <div className="action-info">
                    <h3>{action.description || 'Hành động sống xanh'}</h3>
                    <div className="action-meta">
                      <span className="meta-item">📅 {formatDate(action.submittedAt)}</span>
                      {action.reviewedAt && (
                        <span className="meta-item">👮 Duyệt: {formatDate(action.reviewedAt)}</span>
                      )}
                    </div>
                  </div>
                  {getStatusBadge(action.status)}
                </div>

                {action.status === 'approved' && action.rewards && (
                  <div className="rewards-section">
                    <div className="rewards-title">🎁 Phần thưởng nhận được:</div>
                    <div className="rewards-details">
                      <span className="reward-item">🔥 +{action.rewards.streak} Streak</span>
                      <span className="reward-item">🪙 +{action.rewards.ecoTokens} Eco Tokens</span>
                    </div>
                  </div>
                )}

                {action.comment && (
                  <div className={`moderator-comment ${action.status === 'approved' ? 'approved' : 'rejected'}`}>
                    <strong>Nhận xét từ moderator:</strong>
                    <p>{action.comment}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActionHistory;

