import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Home, ShoppingBag, Globe, Trophy, Package, Camera, Shield, Crown, Settings, LogOut, Sprout } from 'lucide-react';
import { BRAND_NAME, BRAND_EMOJI } from '../constants/branding';
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
    { path: '/home', label: 'Trang chủ', icon: Home },
    { path: '/market', label: 'Eco Market', icon: ShoppingBag },
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
            <Sprout size={24} className="brand-icon" />
            <span>{BRAND_NAME}</span>
          </Link>
          {isAdm && (
            <span className="moderator-badge" style={{ background: 'rgba(255, 215, 0, 0.3)' }}>
              <Crown size={16} /> Admin
            </span>
          )}
          {isMod && !isAdm && (
            <span className="moderator-badge">
              <Shield size={16} /> Moderator
            </span>
          )}
        </div>
        <div className="nav-links">
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
      <main className="main-content">
        {children}
      </main>
    </div>
  );
};

export default Layout;

