import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useConfig } from '../context/ConfigContext';
import { useUsers } from '../context/UsersContext';
import './Admin.css';

const Admin = () => {
  const { user } = useAuth();
  const { config, updateGiftPrice, updateStreakMilestone, updateActionReward, updateDefaultActionReward } = useConfig();
  const { createModerator, updateUser, searchUsers, loadAllUsers } = useUsers();
  const [activeTab, setActiveTab] = useState('moderators');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);

  // Moderator creation form
  const [modEmail, setModEmail] = useState('');
  const [modPassword, setModPassword] = useState('');
  const [modNickname, setModNickname] = useState('');

  // Gift price form
  const [giftId, setGiftId] = useState('');
  const [giftPrice, setGiftPrice] = useState('');

  // Streak milestone form
  const [streakValue, setStreakValue] = useState('');
  const [milestoneColor, setMilestoneColor] = useState('#FFD700');
  const [milestoneEmoji, setMilestoneEmoji] = useState('🌟');
  const [milestoneName, setMilestoneName] = useState('');

  // Action reward form
  const [actionTag, setActionTag] = useState('');
  const [actionStreak, setActionStreak] = useState('1');
  const [actionTokens, setActionTokens] = useState('10');

  const [filteredUsers, setFilteredUsers] = useState([]);

  // Load filtered users
  useEffect(() => {
    const loadFilteredUsers = async () => {
      const users = await searchUsers(searchTerm);
      setFilteredUsers(Array.isArray(users) ? users : []);
    };
    loadFilteredUsers();
  }, [searchTerm, searchUsers]);

  const handleCreateModerator = async (e) => {
    e.preventDefault();
    if (!modEmail || !modPassword || !modNickname) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const result = await createModerator({
      email: modEmail,
      password: modPassword,
      nickname: modNickname,
      avatar: '👮',
      notifications: true
    });
    if (result.success) {
      alert(result.message || `Đã tạo tài khoản moderator: ${result.data.nickname}`);
      setModEmail('');
      setModPassword('');
      setModNickname('');
      await loadAllUsers();
    } else {
      alert(result.message || 'Có lỗi xảy ra khi tạo moderator');
    }
  };

  const handleUpdateGiftPrice = async (e) => {
    e.preventDefault();
    if (!giftId || !giftPrice) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const result = await updateGiftPrice(parseInt(giftId), parseInt(giftPrice));
    if (result.success) {
      alert(result.message || `Đã cập nhật giá quà ID ${giftId} thành ${giftPrice} Eco Tokens`);
      setGiftId('');
      setGiftPrice('');
    } else {
      alert(result.message || 'Có lỗi xảy ra khi cập nhật giá quà');
    }
  };

  const handleUpdateStreakMilestone = async (e) => {
    e.preventDefault();
    if (!streakValue || !milestoneName) {
      alert('Vui lòng điền đầy đủ thông tin');
      return;
    }
    const result = await updateStreakMilestone(parseInt(streakValue), {
      color: milestoneColor,
      emoji: milestoneEmoji,
      name: milestoneName
    });
    if (result.success) {
      alert(result.message || `Đã cập nhật milestone streak ${streakValue}`);
      setStreakValue('');
      setMilestoneName('');
    } else {
      alert(result.message || 'Có lỗi xảy ra khi cập nhật milestone');
    }
  };

  const handleUpdateActionReward = async (e) => {
    e.preventDefault();
    if (!actionTag) {
      alert('Vui lòng nhập tag');
      return;
    }
    const result = await updateActionReward(actionTag, {
      streak: parseInt(actionStreak),
      ecoTokens: parseInt(actionTokens)
    });
    if (result.success) {
      alert(result.message || `Đã cập nhật phần thưởng cho tag: ${actionTag}`);
      setActionTag('');
      setActionStreak('1');
      setActionTokens('10');
    } else {
      alert(result.message || 'Có lỗi xảy ra khi cập nhật phần thưởng');
    }
  };

  const handleUpdateDefaultReward = async (e) => {
    e.preventDefault();
    const result = await updateDefaultActionReward({
      streak: parseInt(actionStreak),
      ecoTokens: parseInt(actionTokens)
    });
    if (result.success) {
      alert(result.message || 'Đã cập nhật phần thưởng mặc định');
      setActionStreak('1');
      setActionTokens('10');
    } else {
      alert(result.message || 'Có lỗi xảy ra khi cập nhật phần thưởng mặc định');
    }
  };

  const handleEditUser = (user) => {
    setSelectedUser(user);
  };

  const handleSaveUser = async () => {
    if (!selectedUser) return;
    const result = await updateUser(selectedUser.id, selectedUser);
    if (result.success) {
      alert(result.message || 'Đã cập nhật thông tin user');
      setSelectedUser(null);
      await loadAllUsers();
    } else {
      alert(result.message || 'Có lỗi xảy ra khi cập nhật user');
    }
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h1>👑 Trang Quản Trị</h1>
        <p>Xin chào, {user?.nickname || 'Admin'}</p>
      </div>

      <div className="admin-tabs">
        <button
          className={activeTab === 'moderators' ? 'active' : ''}
          onClick={() => setActiveTab('moderators')}
        >
          👮 Tạo Moderator
        </button>
        <button
          className={activeTab === 'gifts' ? 'active' : ''}
          onClick={() => setActiveTab('gifts')}
        >
          🎁 Quản lý Quà
        </button>
        <button
          className={activeTab === 'streaks' ? 'active' : ''}
          onClick={() => setActiveTab('streaks')}
        >
          🔥 Quản lý Streak
        </button>
        <button
          className={activeTab === 'rewards' ? 'active' : ''}
          onClick={() => setActiveTab('rewards')}
        >
          🎁 Phần thưởng
        </button>
        <button
          className={activeTab === 'users' ? 'active' : ''}
          onClick={() => setActiveTab('users')}
        >
          👥 Quản lý User
        </button>
      </div>

      {activeTab === 'moderators' && (
        <div className="admin-section">
          <h2>Tạo tài khoản kiểm duyệt</h2>
          <form onSubmit={handleCreateModerator} className="admin-form">
            <div className="form-group">
              <label>Email *</label>
              <input
                type="email"
                value={modEmail}
                onChange={(e) => setModEmail(e.target.value)}
                placeholder="Email đăng nhập"
                required
              />
            </div>
            <div className="form-group">
              <label>Mật khẩu *</label>
              <input
                type="password"
                value={modPassword}
                onChange={(e) => setModPassword(e.target.value)}
                placeholder="Mật khẩu"
                required
              />
            </div>
            <div className="form-group">
              <label>Nickname *</label>
              <input
                type="text"
                value={modNickname}
                onChange={(e) => setModNickname(e.target.value)}
                placeholder="Tên hiển thị"
                required
              />
            </div>
            <button type="submit" className="submit-btn">Tạo Moderator</button>
          </form>
        </div>
      )}

      {activeTab === 'gifts' && (
        <div className="admin-section">
          <h2>Quy định điểm đổi quà</h2>
          <form onSubmit={handleUpdateGiftPrice} className="admin-form">
            <div className="form-group">
              <label>ID Quà *</label>
              <input
                type="number"
                value={giftId}
                onChange={(e) => setGiftId(e.target.value)}
                placeholder="ID của quà (1-8)"
                required
              />
            </div>
            <div className="form-group">
              <label>Giá (Eco Tokens) *</label>
              <input
                type="number"
                value={giftPrice}
                onChange={(e) => setGiftPrice(e.target.value)}
                placeholder="Số Eco Tokens cần để đổi"
                required
              />
            </div>
            <button type="submit" className="submit-btn">Cập nhật giá</button>
          </form>
          <div className="current-config">
            <h3>Giá quà hiện tại:</h3>
            <div className="config-list">
              {Object.entries(config.giftPrices).map(([id, price]) => (
                <div key={id} className="config-item">
                  Quà ID {id}: {price} Eco Tokens
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'streaks' && (
        <div className="admin-section">
          <h2>Quy ước điểm linh vật (Streak Milestones)</h2>
          <form onSubmit={handleUpdateStreakMilestone} className="admin-form">
            <div className="form-group">
              <label>Số ngày Streak *</label>
              <input
                type="number"
                value={streakValue}
                onChange={(e) => setStreakValue(e.target.value)}
                placeholder="Ví dụ: 50, 100"
                required
              />
            </div>
            <div className="form-group">
              <label>Màu sắc</label>
              <input
                type="color"
                value={milestoneColor}
                onChange={(e) => setMilestoneColor(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Emoji</label>
              <input
                type="text"
                value={milestoneEmoji}
                onChange={(e) => setMilestoneEmoji(e.target.value)}
                placeholder="🌟"
              />
            </div>
            <div className="form-group">
              <label>Tên linh vật *</label>
              <input
                type="text"
                value={milestoneName}
                onChange={(e) => setMilestoneName(e.target.value)}
                placeholder="Ví dụ: Linh vật vàng"
                required
              />
            </div>
            <button type="submit" className="submit-btn">Cập nhật Milestone</button>
          </form>
          <div className="current-config">
            <h3>Milestones hiện tại:</h3>
            <div className="config-list">
              {Object.entries(config.streakMilestones).map(([streak, milestone]) => (
                <div key={streak} className="config-item">
                  {milestone.emoji} Streak {streak}: {milestone.name} ({milestone.color})
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div className="admin-section">
          <h2>Quy ước điểm bài đăng sống xanh theo tag</h2>
          <form onSubmit={handleUpdateActionReward} className="admin-form">
            <div className="form-group">
              <label>Tag hành động *</label>
              <input
                type="text"
                value={actionTag}
                onChange={(e) => setActionTag(e.target.value)}
                placeholder="Ví dụ: xe-dap, trong-cay, mang-coc"
                required
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Streak</label>
                <input
                  type="number"
                  value={actionStreak}
                  onChange={(e) => setActionStreak(e.target.value)}
                  min="0"
                />
              </div>
              <div className="form-group">
                <label>Eco Tokens</label>
                <input
                  type="number"
                  value={actionTokens}
                  onChange={(e) => setActionTokens(e.target.value)}
                  min="0"
                />
              </div>
            </div>
            <button type="submit" className="submit-btn">Cập nhật phần thưởng</button>
          </form>
          <div className="admin-form" style={{ marginTop: '30px' }}>
            <h3>Cập nhật phần thưởng mặc định</h3>
            <form onSubmit={handleUpdateDefaultReward}>
              <div className="form-row">
                <div className="form-group">
                  <label>Streak mặc định</label>
                  <input
                    type="number"
                    value={actionStreak}
                    onChange={(e) => setActionStreak(e.target.value)}
                    min="0"
                  />
                </div>
                <div className="form-group">
                  <label>Eco Tokens mặc định</label>
                  <input
                    type="number"
                    value={actionTokens}
                    onChange={(e) => setActionTokens(e.target.value)}
                    min="0"
                  />
                </div>
              </div>
              <button type="submit" className="submit-btn">Cập nhật mặc định</button>
            </form>
          </div>
          <div className="current-config">
            <h3>Phần thưởng theo tag hiện tại:</h3>
            <div className="config-list">
              <div className="config-item">
                Mặc định: {config.actionRewards.default.streak} Streak, {config.actionRewards.default.ecoTokens} Tokens
              </div>
              {Object.entries(config.actionRewards.tags).map(([tag, reward]) => (
                <div key={tag} className="config-item">
                  {tag}: {reward.streak} Streak, {reward.ecoTokens} Tokens
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="admin-section">
          <h2>Quản lý User</h2>
          <div className="search-box">
            <input
              type="text"
              placeholder="Tìm kiếm user (tên, email, số điện thoại)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          <div className="users-list">
            {filteredUsers.map((u) => (
              <div key={u.id} className="user-card">
                <div className="user-info">
                  {u.avatarImage ? (
                    <img src={u.avatarImage} alt={u.nickname} className="user-avatar-image" />
                  ) : (
                    <div className="user-avatar">{u.avatar || '👤'}</div>
                  )}
                  <div className="user-details">
                    <h3>{u.nickname || 'Chưa có tên'}</h3>
                    <p>Email: {u.email || 'N/A'}</p>
                    <p>SĐT: {u.phone || 'N/A'}</p>
                    <p>Role: {u.role || 'user'}</p>
                    {u.ecoTokens !== undefined && <p>Eco Tokens: {u.ecoTokens}</p>}
                    {u.streak !== undefined && <p>Streak: {u.streak}</p>}
                  </div>
                </div>
                <button className="edit-btn" onClick={() => handleEditUser(u)}>
                  Chỉnh sửa
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedUser && (
        <div className="modal-overlay" onClick={() => setSelectedUser(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Chỉnh sửa User: {selectedUser.nickname}</h2>
            <div className="form-group">
              <label>Nickname</label>
              <input
                type="text"
                value={selectedUser.nickname || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, nickname: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={selectedUser.email || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                value={selectedUser.phone || ''}
                onChange={(e) => setSelectedUser({ ...selectedUser, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Eco Tokens</label>
              <input
                type="number"
                value={selectedUser.ecoTokens || 0}
                onChange={(e) => setSelectedUser({ ...selectedUser, ecoTokens: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Streak</label>
              <input
                type="number"
                value={selectedUser.streak || 0}
                onChange={(e) => setSelectedUser({ ...selectedUser, streak: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="form-group">
              <label>Level</label>
              <input
                type="number"
                value={selectedUser.level || 0}
                onChange={(e) => setSelectedUser({ ...selectedUser, level: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div className="modal-actions">
              <button className="save-btn" onClick={handleSaveUser}>Lưu</button>
              <button className="cancel-btn" onClick={() => setSelectedUser(null)}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin;

