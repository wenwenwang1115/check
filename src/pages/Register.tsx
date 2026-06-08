import React, { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getTodayInviteCode } from '../data/mockData';

interface RegisterProps {
  onNavigate: (page: string) => void;
}

export const Register: React.FC<RegisterProps> = ({ onNavigate }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuthStore();

  // 验证密码是否包含数字和字母
  const validatePassword = (pwd: string): boolean => {
    const hasLetter = /[a-zA-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    return hasLetter && hasNumber;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password || !inviteCode) {
      setError('请填写所有必填字段');
      return;
    }

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    if (!validatePassword(password)) {
      setError('密码必须包含字母和数字');
      return;
    }

    // 验证邀请码
    const todayCode = getTodayInviteCode();
    if (inviteCode !== todayCode) {
      setError('邀请码无效或已过期');
      return;
    }

    register(username, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚗</div>
          <h1 className="text-2xl font-bold text-gray-800">功能打卡系统</h1>
          <p className="text-gray-500 mt-2">创建新账户</p>
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
            <p className="mt-1 text-xs text-gray-500">
              密码长度至少6位，必须包含字母和数字
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              确认密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              邀请码
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              placeholder="请输入当日邀请码"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
            />
            <p className="mt-1 text-xs text-gray-500">
              请向管理员获取当日邀请码
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 active:scale-98 transition-all"
          >
            注册
          </button>
        </form>

        <div className="mt-6 text-center">
          <span className="text-gray-500">已有账户？</span>
          <button
            onClick={() => onNavigate('login')}
            className="ml-2 text-blue-600 hover:text-blue-700 font-medium"
          >
            立即登录
          </button>
        </div>
      </div>
    </div>
  );
};