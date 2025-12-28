import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboardApi } from '../api/usersApi';
import './Leaderboard.css';

const Leaderboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tokens'); // 'tokens' or 'streak'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        console.log('[Leaderboard] Loading leaderboard for tab:', activeTab);
        // Load all users (no limit) sorted by activeTab
        const response = await getLeaderboardApi(activeTab, null);
        console.log('[Leaderboard] Response:', response);
        if (response.success && response.data) {
          console.log('[Leaderboard] Setting leaderboard data:', response.data);
          setLeaderboard(response.data);
        } else {
          console.warn('[Leaderboard] Failed to load leaderboard:', response.message);
          setLeaderboard([]);
        }
      } catch (error) {
        console.error('[Leaderboard] Error loading leaderboard:', error);
        setLeaderboard([]);
      } finally {
        setLoading(false);
      }
    };

    loadLeaderboard();
  }, [activeTab]);

  const getRankEmoji = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getRankClass = (rank) => {
    if (rank === 1) return 'rank-first';
    if (rank === 2) return 'rank-second';
    if (rank === 3) return 'rank-third';
    return '';
  };

  /**
   * Generate emoji avatar từ userName
   */
  const generateAvatarEmoji = (userName) => {
    if (!userName) return '🌱';
    
    const avatars = ['🌱', '🌿', '🍃', '🌳', '🌲', '🌴', '🦋', '🐢', '🦎', '🌍'];
    // Dùng hash của userName để chọn emoji nhất quán
    let hash = 0;
    for (let i = 0; i < userName.length; i++) {
      hash = userName.charCodeAt(i) + ((hash << 5) - hash);
    }
    return avatars[Math.abs(hash) % avatars.length];
  };

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>🏆 Bảng xếp hạng</h1>
        <p>Thống kê và xếp hạng tất cả người dùng</p>
      </div>

      {/* Tabs */}
      <div className="leaderboard-tabs">
        <button
          className={activeTab === 'tokens' ? 'active' : ''}
          onClick={() => setActiveTab('tokens')}
        >
          🪙 Xếp hạng Tokens
        </button>
        <button
          className={activeTab === 'streak' ? 'active' : ''}
          onClick={() => setActiveTab('streak')}
        >
          🔥 Xếp hạng Streak
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <p>Đang tải bảng xếp hạng...</p>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-state">
          <p>Chưa có dữ liệu xếp hạng</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {leaderboard.map((entry, index) => {
            const isCurrentUser = user && entry.userId === user.id;
            return (
              <div
                key={entry.userId || index}
                className={`leaderboard-item ${getRankClass(entry.rank)} ${isCurrentUser ? 'current-user' : ''}`}
              >
                <div className="rank-badge">
                  {getRankEmoji(entry.rank)}
                </div>
                <div className="user-info">
                  <div className="user-avatar">
                    {generateAvatarEmoji(entry.userName)}
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      {entry.userName || 'Người dùng'}
                      {isCurrentUser && <span className="you-badge"> (Bạn)</span>}
                    </div>
                    <div className="user-stats">
                      <span className="stat-item">🪙 {entry.currentPoints || 0} điểm</span>
                      <span className="stat-item">🔥 {entry.streak || 0} ngày</span>
                    </div>
                  </div>
                </div>
                <div className="rank-number">
                  #{entry.rank}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Leaderboard;

