import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ActionsProvider } from './context/ActionsContext';
import { GiftHistoryProvider } from './context/GiftHistoryContext';
import { ConfigProvider } from './context/ConfigContext';
import { UsersProvider } from './context/UsersContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Home from './pages/Home';
import EcoMarket from './pages/EcoMarket';
import Profile from './pages/Profile';
import SocialFeed from './pages/SocialFeed';
import Moderator from './pages/Moderator';
import GiftHistory from './pages/GiftHistory';
import ActionHistory from './pages/ActionHistory';
import Admin from './pages/Admin';
import Leaderboard from './pages/Leaderboard';
import './App.css';

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isModerator, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Wait for auth to load
  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // Redirect moderator/admin away from user-only pages
  const userOnlyPages = ['/home', '/market', '/gift-history', '/action-history'];
  if ((isModerator() || isAdmin()) && userOnlyPages.includes(location.pathname)) {
    if (isAdmin()) {
      return <Navigate to="/admin" />;
    }
    return <Navigate to="/social" />;
  }

  return children;
};

// Moderator Route component
const ModeratorRoute = ({ children }) => {
  const { isAuthenticated, isModerator, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (!isModerator()) {
    return <Navigate to="/home" />;
  }
  return children;
};

// Admin Route component
const AdminRoute = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (!isAdmin()) {
    return <Navigate to="/home" />;
  }
  return children;
};

// Default Route component - redirects based on user role
const DefaultRoute = () => {
  const { isAuthenticated, isModerator, isAdmin, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Đang tải...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  if (isAdmin()) {
    return <Navigate to="/admin" />;
  }
  if (isModerator()) {
    return <Navigate to="/social" />;
  }
  return <Navigate to="/home" />;
};

function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <UsersProvider>
          <ActionsProvider>
            <GiftHistoryProvider>
              <Router>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route
                    path="/home"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Home />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/market"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <EcoMarket />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/social"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <SocialFeed />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/gift-history"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <GiftHistory />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/action-history"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <ActionHistory />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/leaderboard"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Leaderboard />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/profile"
                    element={
                      <ProtectedRoute>
                        <Layout>
                          <Profile />
                        </Layout>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/moderator"
                    element={
                      <ModeratorRoute>
                        <Layout>
                          <Moderator />
                        </Layout>
                      </ModeratorRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <AdminRoute>
                        <Layout>
                          <Admin />
                        </Layout>
                      </AdminRoute>
                    }
                  />
                  <Route path="/" element={<DefaultRoute />} />
                </Routes>
              </Router>
            </GiftHistoryProvider>
          </ActionsProvider>
        </UsersProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}

export default App;
