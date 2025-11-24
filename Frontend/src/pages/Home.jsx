import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActions } from '../context/ActionsContext';
import Calendar from '../components/Calendar';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const { addPendingAction, getUserActions } = useActions();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [description, setDescription] = useState('');
  const [approvedDates, setApprovedDates] = useState([]);

  // Get approved actions dates for calendar
  useEffect(() => {
    const loadApprovedDates = async () => {
      if (!user?.id || !getUserActions) {
        setApprovedDates([]);
        return;
      }
      try {
        const userActions = await getUserActions(user.id);
        const approved = userActions.filter(action => action && action.status === 'approved');
        const dates = approved.map(action => action.reviewedAt || action.submittedAt).filter(Boolean);
        setApprovedDates(dates);
      } catch (error) {
        console.error('Error loading approved dates:', error);
        setApprovedDates([]);
      }
    };
    loadApprovedDates();
  }, [user?.id, getUserActions]);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmitAction = async () => {
    if (!selectedImage) {
      alert('Vui lòng chọn ảnh hành động xanh của bạn');
      return;
    }
    
    // Add to pending actions for moderator review using API
    const result = await addPendingAction({
      userId: user?.id,
      userName: user?.nickname || 'Người dùng',
      userAvatar: user?.avatar || '🌱',
      userAvatarImage: user?.avatarImage || null,
      imagePreview: imagePreview,
      description: description || 'Hành động sống xanh',
      imageEmoji: '📷',
      tag: 'default'
    });

    if (result.success) {
      alert(result.message || 'Đã gửi hành động xanh! Vui lòng chờ kiểm duyệt từ moderator.');
      setSelectedImage(null);
      setImagePreview(null);
      setDescription('');
      // Navigate to action history page
      navigate('/action-history');
    } else {
      alert(result.message || 'Có lỗi xảy ra khi gửi hành động');
    }
  };

  const getMascotColor = () => {
    if (user?.streak >= 100) return '#FFD700'; // Gold
    if (user?.streak >= 50) return '#4A90E2'; // Blue
    return '#4a7c2a'; // Green
  };

  return (
    <div className="home-container">
      <div className="home-header">
        <h1>Chào mừng, {user?.nickname || 'Người Dùng'}! 🌱</h1>
        <p>Hãy tiếp tục hành trình sống xanh của bạn</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card eco-tokens">
          <div className="stat-icon">🪙</div>
          <div className="stat-content">
            <h3>Eco Tokens</h3>
            <p className="stat-value">{user?.ecoTokens || 0}</p>
            <span className="stat-label">Tổng số token</span>
          </div>
        </div>

        <div className="stat-card streak">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <h3>Streak</h3>
            <p className="stat-value">{user?.streak || 0}</p>
            <span className="stat-label">Ngày liên tiếp</span>
          </div>
        </div>
      </div>

      <div className={`mascot-section ${user?.streak >= 100 ? 'golden-mascot' : ''}`}>
        {user?.streak >= 100 && (
          <div className="golden-badge">
            <span className="badge-icon">🏆</span>
            <span className="badge-text">LINH VẬT VÀNG</span>
          </div>
        )}
        <div className={`mascot ${user?.streak >= 100 ? 'golden' : user?.streak >= 50 ? 'blue' : 'green'}`} style={{ color: getMascotColor() }}>
          {user?.streak >= 100 ? '🌟' : user?.streak >= 50 ? '🐢' : '🌱'}
        </div>
        <p className="mascot-text">
          {user?.streak >= 100
            ? 'Linh vật vàng - Bạn là người hùng xanh!'
            : user?.streak >= 50
            ? 'Linh vật xanh dương - Tiếp tục phát huy!'
            : 'Linh vật xanh lá - Hãy duy trì streak!'}
        </p>
        {user?.streak >= 100 ? (
          <div className="golden-achievement">
            <p className="achievement-title">🎉 Thành tựu đặc biệt!</p>
            <p className="achievement-desc">
              Bạn đã duy trì streak {user?.streak} ngày liên tiếp! 
              Đây là một thành tựu tuyệt vời trong hành trình sống xanh của bạn.
            </p>
            <div className="achievement-stats">
              <div className="achievement-stat">
                <span className="stat-icon">🔥</span>
                <span className="stat-text">{user?.streak} ngày streak</span>
              </div>
              <div className="achievement-stat">
                <span className="stat-icon">🪙</span>
                <span className="stat-text">{user?.ecoTokens || 0} Eco Tokens</span>
              </div>
            </div>
          </div>
        ) : (
          <p className="mascot-progress">
            Còn {100 - (user?.streak || 0)} ngày để đạt linh vật vàng
          </p>
        )}
      </div>

      <div className="upload-section">
        <h2>📸 Đăng tải hành động xanh</h2>
        <p className="upload-description">
          Chụp ảnh hành động sống xanh của bạn (đi xe đạp, mang cốc cá nhân, trồng cây, phân loại rác...)
        </p>

        <div className="upload-area">
          {imagePreview ? (
            <div className="image-preview-container">
              <img src={imagePreview} alt="Preview" className="image-preview" />
              <button
                className="remove-image-btn"
                onClick={() => {
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
              >
                ✕
              </button>
            </div>
          ) : (
            <label className="upload-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <div className="upload-placeholder">
                <div className="upload-icon">📷</div>
                <p>Chọn ảnh hoặc kéo thả vào đây</p>
                <span>JPG, PNG (tối đa 5MB)</span>
              </div>
            </label>
          )}
        </div>

        {imagePreview && (
          <>
            <div className="form-group">
              <label>Mô tả hành động (tùy chọn)</label>
              <textarea
                placeholder="Mô tả hành động xanh của bạn..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="description-input"
              />
            </div>
            <button className="submit-action-btn" onClick={handleSubmitAction}>
              Gửi hành động xanh
            </button>
          </>
        )}
      </div>

      <div className="calendar-section">
        <Calendar approvedDates={approvedDates} />
      </div>

      <div className="info-section">
        <h3>💡 Gợi ý hành động xanh</h3>
        <div className="action-suggestions">
          <div className="suggestion-item">🚴 Đi xe đạp thay vì xe máy</div>
          <div className="suggestion-item">☕ Mang cốc cá nhân đến quán cà phê</div>
          <div className="suggestion-item">🌳 Trồng một cái cây</div>
          <div className="suggestion-item">♻️ Phân loại rác tại nguồn</div>
          <div className="suggestion-item">🚰 Sử dụng bình nước tái sử dụng</div>
          <div className="suggestion-item">🛍️ Mang túi vải khi mua sắm</div>
        </div>
      </div>
    </div>
  );
};

export default Home;

