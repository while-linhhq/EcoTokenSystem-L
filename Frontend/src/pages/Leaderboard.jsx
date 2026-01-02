import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { getLeaderboardApi } from '../api/usersApi';
import { Search } from 'lucide-react';
import './Leaderboard.css';

const Leaderboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('tokens'); // 'tokens' or 'streak'
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadLeaderboard = async () => {
      try {
        setLoading(true);
        // Load all users (no limit) sorted by activeTab
        const response = await getLeaderboardApi(activeTab, null);
        if (response.success && response.data && Array.isArray(response.data)) {
          setLeaderboard(response.data);
        } else {
          setLeaderboard([]);
        }
      } catch (error) {
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

  // Filter leaderboard based on search term
  const filteredLeaderboard = useMemo(() => {
    if (!searchTerm.trim()) return leaderboard;
    
    const term = searchTerm.toLowerCase();
    return leaderboard.filter(entry => {
      const name = (entry.name || entry.userName || '').toLowerCase();
      const username = (entry.username || '').toLowerCase();
      return name.includes(term) || username.includes(term);
    });
  }, [leaderboard, searchTerm]);

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <h1>🏆 Bảng xếp hạng</h1>
        <p>Thống kê và xếp hạng tất cả người dùng</p>
      </div>

      {/* Search Bar */}
      <div className="search-bar">
        <Search size={20} className="search-icon" />
        <input
          type="text"
          placeholder="Tìm kiếm theo tên người dùng..."
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
          Tìm thấy <strong>{filteredLeaderboard.length}</strong> người dùng cho "{searchTerm}"
        </div>
      )}

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
      ) : filteredLeaderboard.length === 0 ? (
        <div className="empty-state">
          <p>{searchTerm ? 'Không tìm thấy người dùng nào' : 'Chưa có dữ liệu xếp hạng'}</p>
        </div>
      ) : (
        <div className="leaderboard-list">
          {filteredLeaderboard.map((entry, index) => {
            // So sánh userId (có thể là string hoặc Guid)
            const entryUserId = entry.userId?.toString() || entry.userId;
            const currentUserId = user?.id?.toString() || user?.userId?.toString() || user?.id || user?.userId;
            const isCurrentUser = user && entryUserId === currentUserId;

            // Hiển thị giá trị theo tab đang chọn
            const primaryValue = activeTab === 'streak'
              ? `🔥 ${entry.streak || 0} ngày`
              : `🪙 ${entry.currentPoints || 0} điểm`;
            const secondaryValue = activeTab === 'streak'
              ? `🪙 ${entry.currentPoints || 0} điểm`
              : `🔥 ${entry.streak || 0} ngày`;

            return (
              <div
                key={entry.userId || entry.userId || index}
                className={`leaderboard-item ${getRankClass(entry.rank)} ${isCurrentUser ? 'current-user' : ''}`}
              >
                <div className="rank-badge">
                  {getRankEmoji(entry.rank)}
                </div>
                <div className="user-info">
                  <div className="user-avatar">
                    {entry.userAvatarImage ? (
                      <img
                        src={entry.userAvatarImage}
                        alt={entry.userName}
                        className="leaderboard-avatar-image"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          const fallback = e.target.nextSibling;
                          if (fallback) fallback.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span style={{ display: entry.userAvatarImage ? 'none' : 'flex' }}>
                      {entry.userAvatar || '🌱'}
                    </span>
                  </div>
                  <div className="user-details">
                    <div className="user-name">
                      {entry.userName || 'Người dùng'}
                      {isCurrentUser && <span className="you-badge"> (Bạn)</span>}
                    </div>
                    <div className="user-stats">
                      <span className="stat-item stat-primary">{primaryValue}</span>
                      <span className="stat-item stat-secondary">{secondaryValue}</span>
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

