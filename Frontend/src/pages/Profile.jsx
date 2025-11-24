import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import './Profile.css';

const Profile = () => {
  const { user, updateUser, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [address, setAddress] = useState(user?.address || '');
  const [notifications, setNotifications] = useState(user?.notifications ?? true);
  const [avatar, setAvatar] = useState(user?.avatar || '🌱');
  const [avatarImage, setAvatarImage] = useState(user?.avatarImage || null);
  const [avatarType, setAvatarType] = useState(user?.avatarImage ? 'image' : 'emoji'); // 'emoji' or 'image'
  
  // Password change form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setNickname(user.nickname || '');
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setDateOfBirth(user.dateOfBirth || '');
      setGender(user.gender || '');
      setAddress(user.address || '');
      setNotifications(user.notifications ?? true);
      setAvatar(user.avatar || '🌱');
      setAvatarImage(user.avatarImage || null);
      setAvatarType(user.avatarImage ? 'image' : 'emoji');
    }
  }, [user]);

  const handleAvatarImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 2MB');
        return;
      }
      
      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImage(reader.result);
        setAvatarType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatarImage = () => {
    setAvatarImage(null);
    setAvatarType('emoji');
    if (!avatar) {
      setAvatar('🌱');
    }
  };

  const avatars = ['🌱', '🌿', '🍃', '🌳', '🌲', '🌴', '🦋', '🐢', '🦎', '🌍'];

  const handleSave = async () => {
    const updatedData = {
      nickname: nickname || user.nickname,
      fullName: fullName || user.fullName,
      email: email || user.email,
      phone: phone || user.phone,
      dateOfBirth: dateOfBirth || user.dateOfBirth,
      gender: gender || user.gender,
      address: address || user.address,
      notifications,
      avatar: avatarType === 'image' ? (avatarImage ? '🖼️' : avatar) : avatar,
      avatarImage: avatarType === 'image' ? avatarImage : null
    };
    const result = await updateUser(updatedData);
    if (result.success) {
      alert(result.message || 'Đã lưu thay đổi!');
    } else {
      alert(result.message || 'Có lỗi xảy ra khi lưu thay đổi');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordError('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Mật khẩu mới phải có ít nhất 6 ký tự');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Mật khẩu mới và xác nhận mật khẩu không khớp');
      return;
    }

    if (oldPassword === newPassword) {
      setPasswordError('Mật khẩu mới phải khác mật khẩu cũ');
      return;
    }

    // Change password
    const result = await changePassword(oldPassword, newPassword);
    if (result.success) {
      setPasswordSuccess(result.message);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } else {
      setPasswordError(result.message);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      logout();
      navigate('/login');
    }
  };

  const getLevelColor = (level) => {
    if (level >= 10) return '#FFD700';
    if (level >= 7) return '#4A90E2';
    if (level >= 5) return '#9B59B6';
    return '#4a7c2a';
  };

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>⚙️ Cài đặt tài khoản</h1>
      </div>

      <div className="profile-content">
        <div className="profile-section">
          <h2>Thông tin cá nhân</h2>
          
          <div className="avatar-section">
            <label>Avatar</label>
            
            <div className="avatar-type-tabs">
              <button
                type="button"
                className={`avatar-tab ${avatarType === 'emoji' ? 'active' : ''}`}
                onClick={() => setAvatarType('emoji')}
              >
                Emoji
              </button>
              <button
                type="button"
                className={`avatar-tab ${avatarType === 'image' ? 'active' : ''}`}
                onClick={() => setAvatarType('image')}
              >
                Ảnh từ máy
              </button>
            </div>

            {avatarType === 'emoji' ? (
              <>
                <div className="avatar-selector">
                  {avatars.map((avt, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`avatar-option ${avatar === avt ? 'selected' : ''}`}
                      onClick={() => setAvatar(avt)}
                    >
                      {avt}
                    </button>
                  ))}
                </div>
                <div className="current-avatar">
                  Avatar hiện tại: <span className="avatar-display">{avatar}</span>
                </div>
              </>
            ) : (
              <div className="avatar-upload-section">
                <div className="avatar-preview-container">
                  {avatarImage ? (
                    <div className="avatar-preview-wrapper">
                      <img src={avatarImage} alt="Avatar preview" className="avatar-preview-image" />
                      <button
                        type="button"
                        className="remove-avatar-btn"
                        onClick={handleRemoveAvatarImage}
                        title="Xóa ảnh"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="avatar-upload-placeholder">
                      <div className="upload-icon-large">📷</div>
                      <p>Chưa có ảnh avatar</p>
                    </div>
                  )}
                </div>
                <label className="avatar-upload-label">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarImageUpload}
                    style={{ display: 'none' }}
                  />
                  <span className="upload-avatar-btn">
                    {avatarImage ? 'Thay đổi ảnh' : 'Chọn ảnh từ máy'}
                  </span>
                </label>
                <p className="avatar-upload-hint">
                  Kích thước tối đa: 2MB. Định dạng: JPG, PNG
                </p>
              </div>
            )}
          </div>

          <div className="form-group">
            <label>Nickname *</label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nhập nickname của bạn"
            />
          </div>

          <div className="form-group">
            <label>Họ và tên</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Nhập họ và tên đầy đủ của bạn"
            />
            <span className="input-hint">Tên đầy đủ của bạn</span>
          </div>

          <div className="form-group">
            <label>Ngày tháng năm sinh</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
            <span className="input-hint">Chọn ngày sinh của bạn</span>
          </div>

          <div className="form-group">
            <label>Giới tính</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="form-select"
            >
              <option value="">-- Chọn giới tính --</option>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
              <option value="other">Khác</option>
            </select>
          </div>

          <div className="form-group">
            <label>Địa chỉ</label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Nhập địa chỉ của bạn"
              rows="3"
              className="form-textarea"
            />
            <span className="input-hint">Địa chỉ nơi ở hiện tại</span>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Nhập email của bạn"
            />
            <span className="input-hint">Email dùng để đăng nhập</span>
          </div>

          <div className="form-group">
            <label>Số điện thoại</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Nhập số điện thoại của bạn"
            />
            <span className="input-hint">Số điện thoại dùng để đăng nhập</span>
          </div>
        </div>

        <div className="profile-section">
          <h2>Thống kê</h2>
          
          <div className="stats-display">
            <div className="stat-item">
              <div className="stat-label">Level sống xanh</div>
              <div className="stat-value" style={{ color: getLevelColor(user?.level || 0) }}>
                Level {user?.level || 0}
              </div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Eco Tokens</div>
              <div className="stat-value">🪙 {user?.ecoTokens || 0}</div>
            </div>

            <div className="stat-item">
              <div className="stat-label">Streak</div>
              <div className="stat-value">🔥 {user?.streak || 0} ngày</div>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Thay đổi mật khẩu</h2>
          
          <form onSubmit={handleChangePassword} className="password-form">
            <div className="form-group">
              <label>Mật khẩu cũ *</label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="Nhập mật khẩu cũ"
              />
            </div>

            <div className="form-group">
              <label>Mật khẩu mới *</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
              />
            </div>

            <div className="form-group">
              <label>Xác nhận mật khẩu mới *</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Nhập lại mật khẩu mới"
              />
            </div>

            {passwordError && (
              <div className="error-message">{passwordError}</div>
            )}

            {passwordSuccess && (
              <div className="success-message">{passwordSuccess}</div>
            )}

            <button type="submit" className="change-password-btn">
              Đổi mật khẩu
            </button>
          </form>
        </div>

        <div className="profile-section">
          <h2>Thông báo</h2>
          
          <div className="notification-setting">
            <div className="setting-item">
              <div className="setting-info">
                <h3>Nhận thông báo</h3>
                <p>Nhận thông báo về streak, quà tặng mới, và cập nhật</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications}
                  onChange={(e) => setNotifications(e.target.checked)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="profile-actions">
          <button className="save-btn" onClick={handleSave}>
            Lưu thay đổi
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;

