import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';

interface LoginProps {
  onNavigate: (page: string) => void;
}

export const Login: React.FC<LoginProps> = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    const success = login(username, password);
    if (!success) {
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
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
      </div>
    </div>
  );
};