import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BRAND_NAME, SLOGAN, BRAND_EMOJI } from '../constants/branding';
import './Login.css';

const Login = () => {
  // Backend chỉ hỗ trợ login bằng username, không phân biệt phone/email
  // Nếu user đăng ký với phone/email làm username thì vẫn login được
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  // Redirect if already logged in
  useEffect(() => {
    if (loading) return; // Wait for auth to load
    
    if (isAuthenticated) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const user = JSON.parse(savedUser);
          if (user.role === 'admin') {
            navigate('/admin');
          } else if (user.role === 'moderator') {
            navigate('/social');
          } else {
            navigate('/home');
          }
        } catch {
          navigate('/home');
        }
      } else {
        navigate('/home');
      }
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Simple validation
    if (!username) {
      setError('Vui lòng nhập tên đăng nhập');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    // Gọi API login từ backend
    // Backend endpoint: POST /api/User/Login
    const result = await login(username, password);
    
    if (result.success) {
      // Redirect based on role
      const userData = result.data;
      if (userData.role === 'admin') {
        navigate('/admin');
      } else if (userData.role === 'moderator') {
        navigate('/social');
      } else {
        navigate('/home');
      }
    } else {
      setError(result.message || 'Đăng nhập thất bại');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>{BRAND_EMOJI} {BRAND_NAME}</h1>
          <p>{SLOGAN}</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Tên đăng nhập</label>
            <input
              type="text"
              placeholder="Nhập tên đăng nhập (username)"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button">
            Đăng nhập
          </button>
        </form>

        <p className="login-footer">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;

