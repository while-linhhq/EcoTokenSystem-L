import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
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
          <h1>🌱 EcoToken</h1>
          <p>Biến lối sống xanh thành giá trị thật</p>
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
          Chưa có tài khoản? <a href="#register">Đăng ký ngay</a>
        </p>
        <div className="moderator-hint">
          <p><strong>📝 Tài khoản mẫu để test:</strong></p>
          <p style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
            👑 Tài khoản Admin:
          </p>
          <p>Tên đăng nhập: <strong>admin</strong></p>
          <p>Mật khẩu: <strong>Admin@123</strong></p>
          <p style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
            🌱 Tài khoản User:
          </p>
          <p>Tên đăng nhập: <strong>user_test</strong></p>
          <p>Mật khẩu: <strong>User@123</strong></p>
          <p style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
            💡 Lưu ý: Backend chỉ hỗ trợ đăng nhập bằng tên đăng nhập (username)
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

