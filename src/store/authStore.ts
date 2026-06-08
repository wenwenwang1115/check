import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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

const STORAGE_KEY = 'check-system-auth';

const validateAuthData = (data: unknown): Record<string, unknown> => {
  if (typeof data !== 'object' || data === null) {
    return {};
  }
  
  const obj = data as Record<string, unknown>;
  
  if (!Array.isArray(obj.registeredUsers)) {
    obj.registeredUsers = [];
  }
  
  return obj;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
        const users = get().registeredUsers;
        const user = Array.isArray(users) ? users.find(u => u.username === username) : null;
        if (user) {
          set({ currentUser: user, isLoggedIn: true });
          return true;
        }
        return false;
      },
      register: (username: string, _password: string) => {
        const users = get().registeredUsers;
        if (!Array.isArray(users)) return false;
        
        const existing = users.find(u => u.username === username);
        if (existing) return false;
        const newUser: User = {
          id: `user${Date.now()}`,
          username,
          email: `${username}@example.com`,
          role: 'user',
          createdAt: new Date(),
          isActive: true
        };
        set(state => ({ registeredUsers: [...(Array.isArray(state.registeredUsers) ? state.registeredUsers : []), newUser] }));
        set({ currentUser: newUser, isLoggedIn: true });
        return true;
      },
      logout: () => set({ currentUser: null, isLoggedIn: false }),
      updateUser: (userId: string, updates: Partial<User>) => {
        set(state => ({
          registeredUsers: Array.isArray(state.registeredUsers) 
            ? state.registeredUsers.map(u => u.id === userId ? { ...u, ...updates } : u)
            : []
        }));
      }
    }),
    {
      name: STORAGE_KEY,
      getStorage: () => localStorage,
      partialize: (state) => ({
        registeredUsers: state.registeredUsers,
        currentUser: state.currentUser,
        isLoggedIn: state.isLoggedIn
      }),
      version: 2,
      migrate: (persistedState, version) => {
        if (version < 2) {
          return validateAuthData(persistedState);
        }
        return persistedState;
      },
      merge: (persistedState, currentState) => {
        const fixed = validateAuthData(persistedState);
        return { ...currentState, ...fixed };
      }
    }
  )
);
