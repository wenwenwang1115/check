import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UserHome } from './pages/UserHome';
import { AdminHome } from './pages/AdminHome';

type PageType = 'login' | 'register' | 'home';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export default function App() {
  const { isLoggedIn, currentUser, logout } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<PageType>('login');
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const loginTimeStr = localStorage.getItem('check-system-login-time');
    if (loginTimeStr) {
      const loginTime = parseInt(loginTimeStr, 10);
      const now = new Date().getTime();
      
      if (now - loginTime > ONE_DAY_MS) {
        logout();
        localStorage.removeItem('check-system-login-time');
      }
    }
    setIsCheckingSession(false);
  }, [logout]);

  useEffect(() => {
    if (!isCheckingSession) {
      if (isLoggedIn) {
        setCurrentPage('home');
      } else {
        setCurrentPage('login');
      }
    }
  }, [isLoggedIn, isCheckingSession]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageType);
  };

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!isLoggedIn) {
    if (currentPage === 'register') {
      return <Register onNavigate={handleNavigate} />;
    }
    return <Login onNavigate={handleNavigate} />;
  }

  if (currentUser?.role === 'admin') {
    return <AdminHome onNavigate={handleNavigate} />;
  }

  return <UserHome onNavigate={handleNavigate} />;
}
