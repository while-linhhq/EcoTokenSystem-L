import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

const Login = () => {
  const [loginType, setLoginType] = useState('phone'); // 'phone' or 'email'
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
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
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Simple validation
    if (loginType === 'phone' && !phone) {
      setError('Vui lòng nhập số điện thoại');
      return;
    }
    if (loginType === 'email' && !email) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu');
      return;
    }

    const loginIdentifier = loginType === 'phone' ? phone : email;

    // Use API for login
    const result = await login(loginIdentifier, password);
    
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

        <div className="login-tabs">
          <button
            className={loginType === 'phone' ? 'active' : ''}
            onClick={() => setLoginType('phone')}
          >
            Số điện thoại
          </button>
          <button
            className={loginType === 'email' ? 'active' : ''}
            onClick={() => setLoginType('email')}
          >
            Email
          </button>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {loginType === 'phone' ? (
            <div className="form-group">
              <label>Số điện thoại</label>
              <input
                type="tel"
                placeholder="Nhập số điện thoại"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          ) : (
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
          <p>🌱 Tài khoản user mặc định:</p>
          <p>Email/SĐT: <strong>user</strong> hoặc <strong>user@example.com</strong> hoặc <strong>0123456789</strong></p>
          <p>Mật khẩu: <strong>user123</strong></p>
          <p style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
            🔐 Tài khoản kiểm duyệt:
          </p>
          <p>Email/SĐT: <strong>moderator</strong> hoặc <strong>kiemduyet</strong></p>
          <p>Mật khẩu: <strong>moderator123</strong></p>
          <p style={{ marginTop: '10px', paddingTop: '10px', borderTop: '1px solid #ddd' }}>
            👑 Tài khoản admin:
          </p>
          <p>Email/SĐT: <strong>admin</strong></p>
          <p>Mật khẩu: <strong>admin123</strong></p>
        </div>
      </div>
    </div>
  );
};

export default Login;

