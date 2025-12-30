import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserApi } from '../api/authApi';
import './Profile.css';

const Profile = () => {
  const { user, updateUser, logout, changePassword } = useAuth();
  const navigate = useNavigate();
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [dateOfBirth, setDateOfBirth] = useState(user?.dateOfBirth || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [address, setAddress] = useState(user?.address || '');
  const [notifications, setNotifications] = useState(user?.notifications ?? true);
  const [avatar, setAvatar] = useState(user?.avatar || '🌱');
  const [avatarImage, setAvatarImage] = useState(user?.avatarImage || null);
  const [avatarFile, setAvatarFile] = useState(null); // Store File object for upload
  const [avatarType, setAvatarType] = useState(user?.avatarImage ? 'image' : 'emoji'); // 'emoji' or 'image'

  // Password change form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Refresh user data khi vào trang để đồng bộ tokens và streak với database
  useEffect(() => {
    const refreshUserData = async () => {
      try {
        const response = await getCurrentUserApi();
        if (response.success && response.data) {
          await updateUser(response.data);
        }
      } catch (error) {
        console.error('Error refreshing user data:', error);
        // Không hiển thị lỗi cho user, chỉ log
      }
    };

    if (user?.id) {
      refreshUserData();
    }
  }, [user?.id, updateUser]);

  useEffect(() => {
    if (user) {
      // Database chỉ có field 'Name', nickname và name là một
      const userNickname = user.nickname || user.name || user.fullName || '';

      setNickname(userNickname);
      setEmail(user.email || '');
      setPhone(user.phone || user.phoneNumber || '');

      // Convert dateOfBirth từ ISO format (2012-01-14T00:00:00) sang yyyy-MM-dd cho input type="date"
      let formattedDate = '';
      if (user.dateOfBirth) {
        try {
          const date = new Date(user.dateOfBirth);
          if (!isNaN(date.getTime())) {
            formattedDate = date.toISOString().split('T')[0]; // Format: yyyy-MM-dd
          }
        } catch (error) {
          // Nếu không parse được, thử lấy trực tiếp nếu đã đúng format
          if (typeof user.dateOfBirth === 'string' && user.dateOfBirth.match(/^\d{4}-\d{2}-\d{2}$/)) {
            formattedDate = user.dateOfBirth;
          }
        }
      }
      setDateOfBirth(formattedDate);

      setGender(user.gender || 'Khác'); // Default value nếu không có
      setAddress(user.address || '');
      setNotifications(user.notifications ?? true);
      // Avatar: nếu có avatarImage (base64) thì dùng image, không thì dùng emoji
      const userAvatar = user.avatar || '🌱';
      const userAvatarImage = user.avatarImage || (user.avatar?.startsWith('data:image') ? user.avatar : null);
      setAvatar(userAvatarImage ? '🖼️' : userAvatar);
      setAvatarImage(userAvatarImage);
      setAvatarType(userAvatarImage ? 'image' : 'emoji');
    }
  }, [user]);

  const handleAvatarImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB to match S3StorageService limit)
      if (file.size > 5 * 1024 * 1024) {
        alert('Kích thước ảnh không được vượt quá 5MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        alert('Vui lòng chọn file ảnh');
        return;
      }

      // Store File object for upload
      setAvatarFile(file);

      // Create base64 preview for UI
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarImage(reader.result); // Preview only
        setAvatarType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveAvatarImage = () => {
    setAvatarImage(null);
    setAvatarFile(null); // Clear File object
    setAvatarType('emoji');
    if (!avatar) {
      setAvatar('🌱');
    }
  };

  const avatars = ['🌱', '🌿', '🍃', '🌳', '🌲', '🌴', '🦋', '🐢', '🦎', '🌍'];

  const handleSave = async () => {
    // Validate required fields trước khi gửi
    if (!nickname || nickname.trim() === '') {
      setSaveMessage('');
      alert('Vui lòng nhập nickname (tên hiển thị)');
      return;
    }

    if (!gender || gender.trim() === '') {
      setSaveMessage('');
      alert('Vui lòng chọn giới tính');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      // Create FormData for multipart/form-data upload
      const formData = new FormData();

      // Nickname và name là một - dùng nickname làm name cho backend
      const nameToSave = nickname.trim() || user.nickname || user.name || user.fullName || '';

      // Add all profile fields
      formData.append('name', nameToSave);
      if (email?.trim()) formData.append('email', email.trim());
      if (phone?.trim()) formData.append('phoneNumber', phone.trim());
      if (dateOfBirth) formData.append('dateOfBirth', dateOfBirth);
      if (gender) formData.append('gender', gender);
      if (address?.trim()) formData.append('address', address.trim());

      // Add avatar
      if (avatarType === 'image' && avatarFile) {
        formData.append('avatar', avatarFile); // Send File object
      } else if (avatarType === 'emoji' && avatar) {
        formData.append('avatarEmoji', avatar); // Send emoji character
      }

      const result = await updateUser(formData);

      if (result.success) {
        setSaveMessage('success');
        // Form sẽ tự động cập nhật thông qua useEffect khi user state thay đổi
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
      } else {
        setSaveMessage('error');
        alert(result.message || 'Có lỗi xảy ra khi lưu thay đổi');
        setTimeout(() => {
          setSaveMessage('');
        }, 5000);
      }
    } catch (error) {
      setSaveMessage('error');
      alert('Có lỗi xảy ra: ' + (error.message || 'Lỗi không xác định'));
      setTimeout(() => {
        setSaveMessage('');
      }, 5000);
    } finally {
      setSaving(false);
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

    // Backend yêu cầu MinLength(8) cho NewPassword
    if (newPassword.length < 8) {
      setPasswordError('Mật khẩu mới phải có ít nhất 8 ký tự');
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
              placeholder="Nhập tên hiển thị của bạn"
              required
            />
            <span className="input-hint">Tên hiển thị của bạn</span>
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
            <label>Giới tính *</label>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              className="form-select"
              required
            >
              <option value="">-- Chọn giới tính --</option>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
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
          {saveMessage === 'success' && (
            <div className="success-message" style={{ marginBottom: '10px', padding: '10px', borderRadius: '5px', backgroundColor: '#d4edda', color: '#155724', border: '1px solid #c3e6cb' }}>
              ✅ Đã lưu thay đổi thành công!
            </div>
          )}
          {saveMessage === 'error' && (
            <div className="error-message" style={{ marginBottom: '10px', padding: '10px', borderRadius: '5px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}>
              ❌ Có lỗi xảy ra khi lưu thay đổi
            </div>
          )}
          <button
            className="save-btn"
            onClick={handleSave}
            disabled={saving}
            style={{ opacity: saving ? 0.6 : 1, cursor: saving ? 'not-allowed' : 'pointer' }}
          >
            {saving ? '⏳ Đang lưu...' : '💾 Lưu thay đổi'}
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

