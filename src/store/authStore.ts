import { create } from 'zustand';
import { User } from '../types';
import { users } from '../data/mockData';

interface AuthState {
  currentUser: User | null;
  isLoggedIn: boolean;
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isLoggedIn: false,
  login: (username: string, password: string) => {
    // 管理员账户
    if (username === 'admin' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin',
        username: 'admin',
        email: 'admin@example.com',
        role: 'admin',
        createdAt: new Date(),
        isActive: true
      };
      set({ currentUser: adminUser, isLoggedIn: true });
      return true;
    }
    
    // 普通用户
    const user = users.find(
      (u) => u.username === username && u.role === 'user'
    );
    if (user) {
      set({ currentUser: user, isLoggedIn: true });
      return true;
    }
    return false;
  },
  register: (username: string, _password: string) => {
    const newUser: User = {
      id: `user${Date.now()}`,
      username,
      email: `${username}@example.com`,
      role: 'user',
      createdAt: new Date(),
      isActive: true
    };
    set({ currentUser: newUser, isLoggedIn: true });
    return true;
  },
  logout: () => set({ currentUser: null, isLoggedIn: false })
}));