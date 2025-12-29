import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useActions } from '../context/ActionsContext';
import { useConfig } from '../context/ConfigContext';
import { formatDate } from '../utils/dateUtils';
import './Moderator.css';

const Moderator = () => {
  const { user } = useAuth();
  const { getPendingActions, approveAction, rejectAction, getApprovedActions, getRejectedActions, loadActions } = useActions();
  const { getActionReward } = useConfig();
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'approved', 'rejected'
  const [comment, setComment] = useState('');

  // Reload actions khi component mount hoặc khi tab thay đổi
  // Loại bỏ loadActions khỏi dependencies để tránh infinite loop
  useEffect(() => {
    const userRole = user?.role || user?.roleName || '';
    const userRoleName = user?.roleName || user?.role || '';
    const isModeratorOrAdmin = 
      userRole === 'Moderator' || userRole === 'moderator' || 
      userRole === 'Admin' || userRole === 'admin' ||
      userRoleName === 'Moderator' || userRoleName === 'moderator' ||
      userRoleName === 'Admin' || userRoleName === 'admin';
    
    console.log('[Moderator] Checking role:', {
      'user.role': user?.role,
      'user.roleName': user?.roleName,
      userRole,
      userRoleName,
      isModeratorOrAdmin
    });
    
    if (user && isModeratorOrAdmin) {
      console.log('[Moderator] Loading actions for Moderator/Admin...');
      loadActions();
    } else {
      console.warn('[Moderator] User is not Moderator/Admin, skipping loadActions');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, activeTab, user?.role, user?.roleName]); // Thêm user.role và user.roleName vào dependencies

  const pendingActions = getPendingActions();
  const approvedActions = getApprovedActions();
  const rejectedActions = getRejectedActions();

  // Debug logging
  useEffect(() => {
    console.log('[Moderator] Current state:', {
      pendingActions: pendingActions.length,
      approvedActions: approvedActions.length,
      rejectedActions: rejectedActions.length,
      activeTab,
      userRole: user?.role || user?.roleName
    });
  }, [pendingActions, approvedActions, rejectedActions, activeTab, user]);

  const handleApprove = async (action) => {
    if (window.confirm(`Xác nhận duyệt bài viết "${action.title || 'Hành động xanh'}" từ ${action.userName || 'Người dùng'}?`)) {
      // Get reward based on tag or use default
      const tag = action.tag || 'default';
      const reward = getActionReward(tag);
      
      const result = await approveAction(action.id, comment || 'Hành động xanh được xác nhận!', reward);
      
      if (result.success) {
        setComment('');
        alert(`Đã duyệt bài viết! Người dùng sẽ nhận +${reward.streak} streak và +${reward.ecoTokens} Eco Tokens.`);
        // ActionsContext sẽ tự động reload sau khi approve
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
    if (window.confirm(`Từ chối bài viết "${action.title || 'Hành động xanh'}" từ ${action.userName || 'Người dùng'}?`)) {
      const result = await rejectAction(action.id, comment);
      
      if (result.success) {
        setComment('');
        alert('Đã từ chối bài viết. Người dùng sẽ nhận được thông báo nhắc nhở.');
        // ActionsContext sẽ tự động reload sau khi reject
      } else {
        alert(result.message || 'Có lỗi xảy ra khi từ chối hành động');
      }
    }
  };

  // Render card chi tiết cho pending actions
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
            <div className="action-time">Gửi: {formatDate(action.submittedAt)}</div>
          </div>
        </div>
        <div className={`action-status status-${action.status}`}>
          ⏳ Chờ duyệt
        </div>
      </div>

      <div className="action-image">
        {action.imageUrl && action.imageUrl.trim() !== '' ? (
          <img 
            src={action.imageUrl} 
            alt={action.title || 'Hành động xanh'}
            onError={(e) => {
              console.error('[Moderator] Image load error:', {
                src: e.target.src,
                imageUrl: action.imageUrl,
                actionId: action.id,
                actionTitle: action.title
              });
              e.target.style.display = 'none';
              const placeholder = e.target.nextElementSibling;
              if (!placeholder || !placeholder.classList.contains('image-placeholder')) {
                const placeholderDiv = document.createElement('div');
                placeholderDiv.className = 'image-placeholder';
                placeholderDiv.textContent = action.imageEmoji || '📷';
                e.target.parentNode.appendChild(placeholderDiv);
              }
            }}
          />
        ) : (
          <div className="image-placeholder">{action.imageEmoji || '📷'}</div>
        )}
      </div>

      {action.title && (
        <div className="action-title">
          <strong>Tiêu đề:</strong> {action.title}
        </div>
      )}

      {(action.content || action.description) && (
        <div className="action-description">
          <strong>Nội dung:</strong> {action.content || action.description}
        </div>
      )}

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
    </div>
  );

  // Render list item tinh gọn cho approved/rejected actions
  const renderActionListItem = (action) => (
    <div key={action.id} className="action-list-item">
      <div className="action-list-thumbnail">
        {action.imageUrl && action.imageUrl.trim() !== '' ? (
          <img 
            src={action.imageUrl} 
            alt={action.title || 'Hành động xanh'}
            onError={(e) => {
              e.target.style.display = 'none';
              const placeholder = e.target.nextElementSibling;
              if (!placeholder || !placeholder.classList.contains('thumbnail-placeholder')) {
                const placeholderDiv = document.createElement('div');
                placeholderDiv.className = 'thumbnail-placeholder';
                placeholderDiv.textContent = action.imageEmoji || '📷';
                e.target.parentNode.appendChild(placeholderDiv);
              }
            }}
          />
        ) : (
          <div className="thumbnail-placeholder">{action.imageEmoji || '📷'}</div>
        )}
      </div>
      <div className="action-list-content">
        <div className="action-list-header">
          <div className="action-list-user">
            {action.userAvatarImage ? (
              <img src={action.userAvatarImage} alt={action.userName} className="list-user-avatar-image" />
            ) : (
              <div className="list-user-avatar">{action.userAvatar || '🌱'}</div>
            )}
            <span className="list-user-name">{action.userName}</span>
          </div>
          <div className={`list-status-badge status-${action.status}`}>
            {action.status === 'approved' && '✅ Đã duyệt'}
            {action.status === 'rejected' && '❌ Đã từ chối'}
          </div>
        </div>
        <div className="action-list-title">{action.title || 'Hành động xanh'}</div>
        <div className="action-list-meta">
          <span className="list-time">
            {action.status === 'approved' && action.reviewedAt && `Duyệt: ${formatDate(action.reviewedAt)}`}
            {action.status === 'rejected' && action.reviewedAt && `Từ chối: ${formatDate(action.reviewedAt)}`}
            {!action.reviewedAt && action.submittedAt && `Gửi: ${formatDate(action.submittedAt)}`}
          </span>
          {action.status === 'approved' && action.awardedPoints > 0 && (
            <span className="list-reward">🪙 +{action.awardedPoints} điểm</span>
          )}
        </div>
        {(action.comment || action.rejectionReason) && (
          <div className={`list-comment ${action.status === 'approved' ? 'approved' : 'rejected'}`}>
            {action.comment || action.rejectionReason}
          </div>
        )}
      </div>
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

      <div className={activeTab === 'pending' ? 'actions-list' : 'actions-list-compact'}>
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
              approvedActions.map(renderActionListItem)
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
              rejectedActions.map(renderActionListItem)
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Moderator;

