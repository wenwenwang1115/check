import { create } from 'zustand';
import { User } from '../types';

interface AuthState {
  currentUser: User | null;
  isLoggedIn: boolean;
  registeredUsers: User[];
  login: (username: string, password: string) => boolean;
  register: (username: string, password: string) => boolean;
  logout: () => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  currentUser: null,
  isLoggedIn: false,
  registeredUsers: [],
  login: (username: string, password: string) => {
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
    const user = get().registeredUsers.find(u => u.username === username);
    if (user) {
      set({ currentUser: user, isLoggedIn: true });
      return true;
    }
    return false;
  },
  register: (username: string, _password: string) => {
    const existing = get().registeredUsers.find(u => u.username === username);
    if (existing) return false;
    const newUser: User = {
      id: `user${Date.now()}`,
      username,
      email: `${username}@example.com`,
      role: 'user',
      createdAt: new Date(),
      isActive: true
    };
    set(state => ({ registeredUsers: [...state.registeredUsers, newUser] }));
    set({ currentUser: newUser, isLoggedIn: true });
    return true;
  },
  logout: () => set({ currentUser: null, isLoggedIn: false }),
  updateUser: (userId: string, updates: Partial<User>) => {
    set(state => ({
      registeredUsers: state.registeredUsers.map(u =>
        u.id === userId ? { ...u, ...updates } : u
      )
    }));
  }
}));
