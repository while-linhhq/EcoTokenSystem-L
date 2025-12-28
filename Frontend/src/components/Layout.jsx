import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Layout.css';

const Layout = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isModerator, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isMod = isModerator();
  const isAdm = isAdmin();

  const userNavItems = [
    { path: '/home', label: '🏠 Trang chủ', icon: '🏠' },
    { path: '/market', label: '🛍️ Eco Market', icon: '🛍️' },
    { path: '/social', label: '🌍 Cộng đồng', icon: '🌍' },
    { path: '/leaderboard', label: '🏆 Bảng xếp hạng', icon: '🏆' },
    { path: '/gift-history', label: '📦 Lịch sử quà', icon: '📦' },
    { path: '/action-history', label: '📸 Lịch sử hành động', icon: '📸' },
    { path: '/profile', label: '⚙️ Cài đặt', icon: '⚙️' }
  ];

  const moderatorNavItems = [
    { path: '/social', label: '🌍 Cộng đồng', icon: '🌍' },
    { path: '/moderator', label: '👮 Kiểm Duyệt', icon: '👮' },
    { path: '/profile', label: '⚙️ Cài đặt', icon: '⚙️' }
  ];

  const adminNavItems = [
    { path: '/admin', label: '👑 Quản Trị', icon: '👑' },
    { path: '/profile', label: '⚙️ Cài đặt', icon: '⚙️' }
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
          <div className="nav-user">
            {user.avatarImage ? (
              <img src={user.avatarImage} alt="Avatar" className="user-avatar-small-image" />
            ) : (
              <span className="user-avatar-small">{user.avatar}</span>
            )}
            <span className="user-name-small">{user.nickname}</span>
            <button className="logout-btn-small" onClick={handleLogout}>
              Đăng xuất
            </button>
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

