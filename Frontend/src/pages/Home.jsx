import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useActions } from '../context/ActionsContext';
import { useConfig } from '../context/ConfigContext';
import { getCurrentUserApi } from '../api/authApi';
import Calendar from '../components/Calendar';
import './Home.css';

const Home = () => {
  const { user, updateUser } = useAuth();
  const { addPendingAction, getUserActions } = useActions();
  const { config } = useConfig();
  const navigate = useNavigate();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [approvedDates, setApprovedDates] = useState([]);

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

  // Workflow: Lấy thông tin các bài viết được duyệt của user -> Lấy ngày giờ -> Tính toán và hiển thị
  useEffect(() => {
    const loadApprovedDates = async () => {
      if (!user?.id || !getUserActions) {
        console.log('[Calendar] No user or getUserActions, clearing dates');
        setApprovedDates([]);
        return;
      }
      
      try {
        // Bước 1: Lấy thông tin các bài viết được duyệt của user
        console.log('[Calendar] Step 1: Loading user actions for user:', user.id);
        const userActions = await getUserActions(user.id);
        console.log('[Calendar] Total actions loaded:', userActions?.length || 0);
        
        if (!Array.isArray(userActions) || userActions.length === 0) {
          console.log('[Calendar] No actions found');
          setApprovedDates([]);
          return;
        }
        
        // Lọc các bài viết đã được duyệt (status === 'approved')
        const approved = userActions.filter(action => {
          const isApproved = action && action.status === 'approved';
          if (!isApproved) return false;
          
          // Kiểm tra có approvedRejectedAt không
          const hasDate = action.approvedRejectedAt || action.reviewedAt;
          if (!hasDate) {
            console.warn('[Calendar] Approved action missing date:', action.id, action);
          }
          return hasDate;
        });
        
        console.log('[Calendar] Approved actions found:', approved.length);
        
        if (approved.length === 0) {
          console.log('[Calendar] No approved actions with dates');
          setApprovedDates([]);
          return;
        }
        
        // Bước 2: Lấy thông tin ngày giờ của từng bài viết
        const dates = approved
          .map((action, index) => {
            // Ưu tiên approvedRejectedAt (ngày approve thực tế từ backend)
            const dateStr = action.approvedRejectedAt || action.reviewedAt;
            
            if (!dateStr) {
              console.warn(`[Calendar] Action ${index + 1} missing date:`, action.id, action);
              return null;
            }
            
            try {
              // Parse date string từ backend
              const date = new Date(dateStr);
              
              if (isNaN(date.getTime())) {
                console.warn(`[Calendar] Action ${index + 1} invalid date:`, dateStr, 'for action:', action.id);
                return null;
              }
              
              // Giữ nguyên ISO string để Calendar component xử lý timezone
              const isoString = date.toISOString();
              console.log(`[Calendar] Action ${index + 1} date:`, {
                original: dateStr,
                parsed: isoString,
                localDate: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
              });
              
              return isoString;
            } catch (error) {
              console.warn(`[Calendar] Error parsing date for action ${index + 1}:`, dateStr, error);
              return null;
            }
          })
          .filter(Boolean);
        
        console.log('[Calendar] Valid dates extracted:', dates.length);
        
        // Bước 3: Loại bỏ duplicate dates (nếu có nhiều bài được approve trong cùng một ngày)
        const uniqueDates = Array.from(new Set(dates));
        
        // Log để debug
        console.log('[Calendar] Final result:', {
          totalActions: userActions.length,
          approvedActions: approved.length,
          validDates: dates.length,
          uniqueDates: uniqueDates.length,
          sampleDates: uniqueDates.slice(0, 5).map(d => {
            const date = new Date(d);
            return {
              iso: d,
              local: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
            };
          })
        });
        
        // Bước 4: Set approved dates để Calendar component hiển thị
        setApprovedDates(uniqueDates);
      } catch (error) {
        console.error('[Calendar] Error loading approved dates:', error);
        setApprovedDates([]);
      }
    };
    
    loadApprovedDates();
  }, [user?.id, user?.ecoTokens, user?.streak, getUserActions]); // Thêm user?.ecoTokens và user?.streak để refresh khi user data được cập nhật

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

    // Validate title và content
    if (!title.trim()) {
      alert('Vui lòng nhập tiêu đề bài viết');
      return;
    }

    if (!content.trim()) {
      alert('Vui lòng nhập nội dung bài viết');
      return;
    }
    
    // Add to pending actions for moderator review using API
    // Gửi File object (selectedImage) thay vì base64 (imagePreview)
    const result = await addPendingAction({
      userId: user?.id,
      userName: user?.nickname || 'Người dùng',
      userAvatar: user?.avatar || '🌱',
      userAvatarImage: user?.avatarImage || null,
      imageFile: selectedImage, // Gửi File object để backend có thể upload
      imagePreview: imagePreview, // Giữ lại để hiển thị preview
      title: title.trim(), // Tiêu đề bài viết
      description: content.trim(), // Nội dung bài viết (map sang content)
      content: content.trim(), // Nội dung bài viết
      imageEmoji: '📷',
      tag: 'default'
    });

    if (result.success) {
      alert(result.message || 'Đã gửi hành động xanh! Vui lòng chờ kiểm duyệt từ moderator.');
      setSelectedImage(null);
      setImagePreview(null);
      setTitle('');
      setContent('');
      // Navigate to action history page
      navigate('/action-history');
    } else {
      alert(result.message || 'Có lỗi xảy ra khi gửi hành động');
    }
  };

  // Tính toán linh vật dựa trên config streak milestones
  const getCurrentMascot = useMemo(() => {
    const streak = user?.streak || 0;
    const milestones = config?.streakMilestones || {};
    
    // Chuyển đổi milestones từ object sang array và parse streak
    // Xử lý cả PascalCase (từ backend) và camelCase (từ frontend)
    const milestonesArray = Object.keys(milestones)
      .filter(key => !isNaN(parseInt(key))) // Chỉ lấy keys là số
      .map(key => {
        const milestoneData = milestones[key];
        return {
          streak: parseInt(key),
          emoji: milestoneData?.Emoji || milestoneData?.emoji || '🌱',
          color: milestoneData?.Color || milestoneData?.color || '#4a7c2a',
          name: milestoneData?.Name || milestoneData?.name || 'Linh vật'
        };
      });
    
    // Nếu không có milestones từ config, dùng default
    if (milestonesArray.length === 0) {
      const defaultMascot = {
        streak: 0,
        color: '#4a7c2a',
        emoji: '🌱',
        name: 'Linh vật xanh lá'
      };
      return {
        current: defaultMascot,
        next: null,
        isHighest: false
      };
    }
    
    // Sắp xếp milestones theo thứ tự giảm dần (cao nhất trước)
    const sortedMilestones = milestonesArray.sort((a, b) => b.streak - a.streak);
    
    // Sắp xếp tăng dần để tìm milestone tiếp theo
    const sortedAscending = [...sortedMilestones].sort((a, b) => a.streak - b.streak);
    
    // Tìm milestone cao nhất mà user đã đạt được
    // Tìm milestone đầu tiên (cao nhất) mà streak >= milestone.streak
    const currentMilestone = sortedMilestones.find(m => streak >= m.streak);
    
    // Tìm milestone tiếp theo (cao hơn streak hiện tại)
    const nextMilestone = sortedAscending.find(m => streak < m.streak);
    
    // Nếu user chưa đạt milestone nào, hiển thị milestone đầu tiên (thấp nhất) từ config
    // Thay vì dùng default hardcode
    if (!currentMilestone) {
      const firstMilestone = sortedAscending[0]; // Milestone thấp nhất
      return {
        current: firstMilestone,
        next: firstMilestone,
        isHighest: false
      };
    }
    
    return {
      current: currentMilestone,
      next: nextMilestone,
      isHighest: !nextMilestone // Đã đạt milestone cao nhất
    };
  }, [user?.streak, config?.streakMilestones]);

      const getMascotColor = () => {
        return getCurrentMascot.current.color;
      };

  const getDaysToNextMilestone = () => {
    if (getCurrentMascot.isHighest) {
      return null; // Đã đạt milestone cao nhất
    }
    const currentStreak = user?.streak || 0;
    const nextStreak = getCurrentMascot.next?.streak || 0;
    return Math.max(0, nextStreak - currentStreak);
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

      <div 
        className={`mascot-section ${getCurrentMascot.isHighest ? 'golden-mascot' : ''}`}
        style={{
          '--mascot-color': getCurrentMascot.current.color,
          background: getCurrentMascot.isHighest 
            ? `linear-gradient(135deg, ${getCurrentMascot.current.color} 0%, ${getCurrentMascot.current.color}dd 50%, ${getCurrentMascot.current.color} 100%)`
            : `linear-gradient(135deg, ${getCurrentMascot.current.color}15 0%, ${getCurrentMascot.current.color}30 50%, ${getCurrentMascot.current.color}15 100%)`,
          backgroundSize: '200% 200%',
          backgroundPosition: '0% 50%',
          animation: getCurrentMascot.isHighest ? 'goldenGradient 3s ease infinite' : 'mascotPattern 4s ease infinite',
          border: `3px solid ${getCurrentMascot.current.color}80`,
          boxShadow: `0 8px 30px ${getCurrentMascot.current.color}50, inset 0 0 50px ${getCurrentMascot.current.color}20`,
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Pattern overlay với màu từ config */}
        <div 
          className="mascot-pattern-overlay"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `repeating-linear-gradient(
              45deg,
              transparent,
              transparent 10px,
              ${getCurrentMascot.current.color}08 10px,
              ${getCurrentMascot.current.color}08 20px
            )`,
            animation: 'patternMove 3s linear infinite',
            pointerEvents: 'none'
          }}
        />
        {getCurrentMascot.isHighest && (
          <div 
            className="golden-badge"
            style={{
              backgroundColor: getCurrentMascot.current.color,
              border: `2px solid ${getCurrentMascot.current.color}`
            }}
          >
            <span className="badge-icon">🏆</span>
            <span className="badge-text">{getCurrentMascot.current.name.toUpperCase()}</span>
          </div>
        )}
        <div 
          className={`mascot ${getCurrentMascot.isHighest ? 'golden' : getCurrentMascot.current.streak >= 50 ? 'blue' : 'green'}`} 
          style={{ 
            color: getMascotColor(),
            position: 'relative',
            zIndex: 2,
            textShadow: `0 0 20px ${getCurrentMascot.current.color}80, 0 0 40px ${getCurrentMascot.current.color}40`
          }}
        >
          {getCurrentMascot.current.emoji}
        </div>
        <p 
          className="mascot-text"
          style={{
            color: getCurrentMascot.isHighest ? '#fff' : getCurrentMascot.current.color,
            fontWeight: '600',
            fontSize: '1.2em',
            position: 'relative',
            zIndex: 2,
            textShadow: getCurrentMascot.isHighest ? '0 2px 4px rgba(0,0,0,0.3)' : `0 2px 4px ${getCurrentMascot.current.color}40`
          }}
        >
          {getCurrentMascot.current.name} - {getCurrentMascot.isHighest 
            ? 'Bạn là người hùng xanh!' 
            : 'Tiếp tục phát huy!'}
        </p>
        {getCurrentMascot.isHighest ? (
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
          <p 
            className="mascot-progress"
            style={{
              color: getCurrentMascot.current.color,
              fontWeight: '500',
              fontSize: '1.1em',
              position: 'relative',
              zIndex: 2
            }}
          >
            {getDaysToNextMilestone() !== null ? (
              <>
                Còn <strong>{getDaysToNextMilestone()}</strong> ngày để đạt <strong style={{ color: getCurrentMascot.next?.color || getCurrentMascot.current.color }}>{getCurrentMascot.next?.name || 'milestone tiếp theo'}</strong>
              </>
            ) : (
              'Hãy duy trì streak của bạn!'
            )}
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
              <label>Tiêu đề bài viết *</label>
              <input
                type="text"
                placeholder="Ví dụ: Đi xe đạp đến trường"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="description-input"
                maxLength={200}
                required
              />
              <small style={{ color: '#666', fontSize: '0.85em' }}>
                {title.length}/200 ký tự
              </small>
            </div>
            <div className="form-group">
              <label>Nội dung bài viết *</label>
              <textarea
                placeholder="Mô tả chi tiết hành động xanh của bạn..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows="5"
                className="description-input"
                required
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

