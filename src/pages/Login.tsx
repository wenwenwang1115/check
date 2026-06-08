import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';

interface LoginProps {
  onNavigate: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const { login, isLoggedIn } = useAuthStore();

  useEffect(() => {
    const saved = localStorage.getItem('check-system-remember');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setUsername(data.username || '');
        setPassword(data.password || '');
        setRememberMe(true);
      } catch (e) {
        console.error('Failed to parse remember me data');
      }
    }
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      const loginTime = new Date().getTime();
      localStorage.setItem('check-system-login-time', loginTime.toString());
    }
  }, [isLoggedIn]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const success = login(username, password);
    if (success) {
      if (rememberMe) {
        localStorage.setItem('check-system-remember', JSON.stringify({ username, password }));
      } else {
        localStorage.removeItem('check-system-remember');
      }
    } else {
      setError('用户名或密码错误');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold text-gray-800">功能打卡系统</h1>
          <p className="text-gray-500 mt-2">登录您的账户</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码（需包含数字和字母）"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">密码需包含数字和字母</p>
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-600">记住密码</span>
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-98 transition-all"
          >
            登录
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-500">还没有账户？</span>
          <button
            onClick={() => onNavigate('register')}
            className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            立即注册
          </button>
        </div>

        <div className="mt-8 text-center">
          <span className="text-blue-500 text-sm">开发方@整车耐久开发部</span>
        </div>
      </div>
    </div>
  );
};
