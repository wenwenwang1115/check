import { useEffect, useState } from 'react';
import { useAuthStore } from './store/authStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { UserHome } from './pages/UserHome';
import { AdminHome } from './pages/AdminHome';

type PageType = 'login' | 'register' | 'home';

export default function App() {
  const { isLoggedIn, currentUser } = useAuthStore();
  const [currentPage, setCurrentPage] = useState<PageType>('login');

  useEffect(() => {
    if (isLoggedIn) {
      setCurrentPage('home');
    } else {
      setCurrentPage('login');
    }
  }, [isLoggedIn]);

  const handleNavigate = (page: string) => {
    setCurrentPage(page as PageType);
  };

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