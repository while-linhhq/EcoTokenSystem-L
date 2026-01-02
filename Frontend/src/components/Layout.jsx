import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, ShoppingBag, Globe, Trophy, Package, Camera, Shield, Crown, Settings, LogOut, Facebook, Instagram, Mail } from 'lucide-react';
import { BRAND_NAME, BRAND_EMOJI, SOCIAL_MEDIA, PROJECT_INFO } from '../constants/branding';
import './Layout.css';

// TikTok Icon Component (since lucide-react doesn't have TikTok icon)
const TikTokIcon = ({ size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743 2.895 2.895 0 0 1 2.31-4.644 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.041-.104z"/>
  </svg>
);

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isModerator, isAdmin } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    setDropdownOpen(false);
    logout();
    navigate('/login');
  };

  const handleProfileClick = () => {
    setDropdownOpen(false);
    navigate('/profile');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const isMod = isModerator();
  const isAdm = isAdmin();

  const userNavItems = [
    { path: '/home', label: 'Trang chủ', icon: Home },
    { path: '/market', label: 'Cửa hàng', icon: ShoppingBag },
    { path: '/social', label: 'Cộng đồng', icon: Globe },
    { path: '/leaderboard', label: 'Bảng xếp hạng', icon: Trophy },
    { path: '/gift-history', label: 'Lịch sử quà', icon: Package },
    { path: '/action-history', label: 'Lịch sử hành động', icon: Camera }
  ];

  const moderatorNavItems = [
    { path: '/social', label: 'Cộng đồng', icon: Globe },
    { path: '/moderator', label: 'Kiểm Duyệt', icon: Shield }
  ];

  const adminNavItems = [
    { path: '/admin', label: 'Quản Trị', icon: Crown }
  ];

  const navItems = isAdm ? adminNavItems : (isMod ? moderatorNavItems : userNavItems);

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to={isAdm ? "/admin" : (isMod ? "/social" : "/home")} className="brand-link">
            <img src="/logo_token.png" alt="EcoToken" className="brand-icon" />
            <span className="brand-name-text">{BRAND_NAME}</span>
          </Link>
          {isAdm && (
            <span className="moderator-badge" style={{ background: 'rgba(255, 215, 0, 0.3)' }}>
              <Crown size={16} /> <span className="badge-text">Quản trị</span>
            </span>
          )}
          {isMod && !isAdm && (
            <span className="moderator-badge">
              <Shield size={16} /> <span className="badge-text">Kiểm duyệt</span>
            </span>
          )}
        </div>
        <div className="nav-links desktop-nav">
          {navItems.map(item => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={location.pathname === item.path ? 'active' : ''}
              >
                <IconComponent size={18} className="nav-icon" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
        {user && (
          <div className="nav-user" ref={dropdownRef}>
            <div
              className="user-info-clickable"
              onClick={() => setDropdownOpen(!dropdownOpen)}
            >
              {user.avatarImage ? (
                <img src={user.avatarImage} alt="Avatar" className="user-avatar-small-image" />
              ) : (
                <span className="user-avatar-small">{user.avatar}</span>
              )}
              <span className="user-name-small">{user.nickname || user.name}</span>
              <span className="dropdown-arrow">▼</span>
            </div>
            {dropdownOpen && (
              <div className="user-dropdown">
                <button
                  className="dropdown-item"
                  onClick={handleProfileClick}
                >
                  <Settings size={16} /> Cài đặt
                </button>
                <button
                  className="dropdown-item logout-item"
                  onClick={handleLogout}
                >
                  <LogOut size={16} /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        {navItems.slice(0, 5).map(item => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`bottom-nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <IconComponent size={24} className="bottom-nav-icon" />
              <span className="bottom-nav-label">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <main className="main-content">
        {children}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-main">
            <div className="footer-brand">
              <div className="footer-brand-header">
                <img src="/logo_token.png" alt="EcoToken" className="footer-logo" />
                <span className="footer-brand-name">{BRAND_NAME}</span>
              </div>
              <p className="footer-tagline">{PROJECT_INFO.tagline}</p>
              <p className="footer-description">{PROJECT_INFO.description}</p>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">Liên kết</h4>
              <div className="footer-links">
                <Link to="/home">Trang chủ</Link>
                <Link to="/market">Cửa hàng</Link>
                <Link to="/social">Cộng đồng</Link>
                <Link to="/leaderboard">Bảng xếp hạng</Link>
                <Link to="/action-history">Lịch sử hành động</Link>
              </div>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">Thông tin</h4>
              <div className="footer-info">
                <div className="footer-info-item">
                  <span className="footer-info-label">Mục tiêu:</span>
                  <span className="footer-info-value">Khuyến khích lối sống xanh</span>
                </div>
                <div className="footer-info-item">
                  <span className="footer-info-label">Hệ thống:</span>
                  <span className="footer-info-value">Gamification & Token</span>
                </div>
                <div className="footer-info-item">
                  <span className="footer-info-label">Phiên bản:</span>
                  <span className="footer-info-value">v{PROJECT_INFO.version}</span>
                </div>
              </div>
            </div>

            <div className="footer-column">
              <h4 className="footer-column-title">Liên hệ</h4>
              <div className="footer-contact">
                {SOCIAL_MEDIA.email && (
                  <a href={`mailto:${SOCIAL_MEDIA.email}`} className="footer-contact-item">
                    <Mail size={16} />
                    <span>{SOCIAL_MEDIA.email}</span>
                  </a>
                )}
                {SOCIAL_MEDIA.website && (
                  <a href={SOCIAL_MEDIA.website} target="_blank" rel="noopener noreferrer" className="footer-contact-item">
                    <Globe size={16} />
                    <span>Trang web</span>
                  </a>
                )}
              </div>
              <div className="footer-social">
                {SOCIAL_MEDIA.facebook && (
                  <a href={SOCIAL_MEDIA.facebook} target="_blank" rel="noopener noreferrer" aria-label="Facebook">
                    <Facebook size={20} />
                  </a>
                )}
                {SOCIAL_MEDIA.instagram && (
                  <a href={SOCIAL_MEDIA.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <Instagram size={20} />
                  </a>
                )}
                {SOCIAL_MEDIA.tiktok && (
                  <a href={SOCIAL_MEDIA.tiktok} target="_blank" rel="noopener noreferrer" aria-label="TikTok">
                    <TikTokIcon size={20} />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <span>{PROJECT_INFO.copyright}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;

