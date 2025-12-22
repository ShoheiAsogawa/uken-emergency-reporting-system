import { useState, useEffect } from 'react';
import { isAuthenticated } from '../../lib/cognito';
import Login from './Login';
import Dashboard from './Dashboard';

export default function AdminApp() {
  const [authenticated, setAuthenticated] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const isAuth = await isAuthenticated();
      setAuthenticated(isAuth);
    } catch (err) {
      console.error('認証チェックエラー:', err);
      setAuthenticated(false);
    } finally {
      setChecking(false);
    }
  };

  const handleLoginSuccess = () => {
    setAuthenticated(true);
  };

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return <Dashboard />;
}

