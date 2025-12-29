import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

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
    { path: '/home', label: '🏠 Trang chủ', icon: '🏠' },
    { path: '/market', label: '🛍️ Eco Market', icon: '🛍️' },
    { path: '/social', label: '🌍 Cộng đồng', icon: '🌍' },
    { path: '/leaderboard', label: '🏆 Bảng xếp hạng', icon: '🏆' },
    { path: '/gift-history', label: '📦 Lịch sử quà', icon: '📦' },
    { path: '/action-history', label: '📸 Lịch sử hành động', icon: '📸' }
  ];

  const moderatorNavItems = [
    { path: '/social', label: '🌍 Cộng đồng', icon: '🌍' },
    { path: '/moderator', label: '👮 Kiểm Duyệt', icon: '👮' }
  ];

  const adminNavItems = [
    { path: '/admin', label: '👑 Quản Trị', icon: '👑' }
  ];

  const navItems = isAdm ? adminNavItems : (isMod ? moderatorNavItems : userNavItems);

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to={isAdm ? "/admin" : (isMod ? "/social" : "/home")}>🌱 EcoToken</Link>
          {isAdm && <span className="moderator-badge" style={{ background: 'rgba(255, 215, 0, 0.3)' }}>👑 Admin</span>}
          {isMod && !isAdm && <span className="moderator-badge">👮 Moderator</span>}
        </div>
        <div className="nav-links">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              {item.label}
            </Link>
          ))}
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
                  ⚙️ Cài đặt
                </button>
                <button 
                  className="dropdown-item logout-item" 
                  onClick={handleLogout}
                >
                  🚪 Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </nav>
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;

