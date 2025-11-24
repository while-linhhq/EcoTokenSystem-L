import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useActions } from '../context/ActionsContext';
import { useConfig } from '../context/ConfigContext';
import './Moderator.css';

const Moderator = () => {
  const { user } = useAuth();
  const { getPendingActions, approveAction, rejectAction, getApprovedActions, getRejectedActions } = useActions();
  const { getActionReward } = useConfig();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [comment, setComment] = useState('');

  const pendingActions = getPendingActions();
  const approvedActions = getApprovedActions();
  const rejectedActions = getRejectedActions();

  const handleApprove = async (action) => {
    if (window.confirm(`Xác nhận duyệt hành động từ ${action.userName}?`)) {
      // Get reward based on tag or use default
      const tag = action.tag || 'default';
      const reward = getActionReward(tag);
      
      const result = await approveAction(action.id, comment || 'Hành động xanh được xác nhận!', reward);
      
      if (result.success) {
        setComment('');
        alert(`Đã duyệt hành động! Người dùng sẽ nhận +${reward.streak} streak và +${reward.ecoTokens} Eco Tokens.`);
      } else {
        alert(result.message || 'Có lỗi xảy ra khi duyệt hành động');
      }
    }
  };

  const handleReject = async (action) => {
    if (!comment.trim()) {
      alert('Vui lòng nhập lý do từ chối để nhắc nhở người dùng.');
      return;
    }
    if (window.confirm(`Từ chối hành động từ ${action.userName}?`)) {
      const result = await rejectAction(action.id, comment);
      
      if (result.success) {
        setComment('');
        alert('Đã từ chối hành động. Người dùng sẽ nhận được thông báo nhắc nhở.');
      } else {
        alert(result.message || 'Có lỗi xảy ra khi từ chối hành động');
      }
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN');
  };

  const renderActionCard = (action) => (
    <div key={action.id} className="action-card">
      <div className="action-header">
        <div className="action-user">
          {action.userAvatarImage ? (
            <img src={action.userAvatarImage} alt={action.userName} className="user-avatar-image" />
          ) : (
            <div className="user-avatar">{action.userAvatar || '🌱'}</div>
          )}
          <div className="user-info">
            <div className="user-name">{action.userName}</div>
            <div className="action-time">{formatDate(action.submittedAt)}</div>
          </div>
        </div>
        <div className={`action-status status-${action.status}`}>
          {action.status === 'pending' && '⏳ Chờ duyệt'}
          {action.status === 'approved' && '✅ Đã duyệt'}
          {action.status === 'rejected' && '❌ Đã từ chối'}
        </div>
      </div>

      <div className="action-image">
        {action.imagePreview ? (
          <img src={action.imagePreview} alt="Hành động xanh" />
        ) : (
          <div className="image-placeholder">{action.imageEmoji || '📷'}</div>
        )}
      </div>

      {action.description && (
        <div className="action-description">
          <strong>Mô tả:</strong> {action.description}
        </div>
      )}

      {action.comment && (
        <div className={`moderator-comment ${action.status === 'approved' ? 'approved' : 'rejected'}`}>
          <strong>Nhận xét:</strong> {action.comment}
          {action.reviewedAt && (
            <span className="review-time"> - {formatDate(action.reviewedAt)}</span>
          )}
        </div>
      )}

      {action.status === 'pending' && (
        <div className="action-actions">
          <div className="comment-input-group">
            <textarea
              placeholder="Nhập nhận xét (bắt buộc nếu từ chối)..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows="3"
            />
          </div>
          <div className="action-buttons">
            <button
              className="approve-btn"
              onClick={() => handleApprove(action)}
            >
              ✅ Duyệt (+1 Streak, +10 Tokens)
            </button>
            <button
              className="reject-btn"
              onClick={() => handleReject(action)}
            >
              ❌ Từ chối
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="moderator-container">
      <div className="moderator-header">
        <h1>👮 Trang Kiểm Duyệt</h1>
        <p>Xin chào, {user?.nickname || 'Kiểm Duyệt Viên'}</p>
      </div>

      <div className="stats-summary">
        <div className="stat-box pending">
          <div className="stat-number">{pendingActions.length}</div>
          <div className="stat-label">Chờ duyệt</div>
        </div>
        <div className="stat-box approved">
          <div className="stat-number">{approvedActions.length}</div>
          <div className="stat-label">Đã duyệt</div>
        </div>
        <div className="stat-box rejected">
          <div className="stat-number">{rejectedActions.length}</div>
          <div className="stat-label">Đã từ chối</div>
        </div>
      </div>

      <div className="moderator-tabs">
        <button
          className={activeTab === 'pending' ? 'active' : ''}
          onClick={() => setActiveTab('pending')}
        >
          ⏳ Chờ duyệt ({pendingActions.length})
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
      </div>

      <div className="actions-list">
        {activeTab === 'pending' && (
          <>
            {pendingActions.length === 0 ? (
              <div className="empty-state">
                <p>🎉 Không có hành động nào chờ duyệt!</p>
              </div>
            ) : (
              pendingActions.map(renderActionCard)
            )}
          </>
        )}

        {activeTab === 'approved' && (
          <>
            {approvedActions.length === 0 ? (
              <div className="empty-state">
                <p>Chưa có hành động nào được duyệt</p>
              </div>
            ) : (
              approvedActions.map(renderActionCard)
            )}
          </>
        )}

        {activeTab === 'rejected' && (
          <>
            {rejectedActions.length === 0 ? (
              <div className="empty-state">
                <p>Chưa có hành động nào bị từ chối</p>
              </div>
            ) : (
              rejectedActions.map(renderActionCard)
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Moderator;

