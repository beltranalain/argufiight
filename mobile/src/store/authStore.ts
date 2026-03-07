import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'argufight_jwt';

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl: string | null;
  isAdmin: boolean;
  coins: number;
  eloRating: number;
  bio?: string;
  isBanned: boolean;
  hasCompletedOnboarding: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setToken: (token: string) => Promise<void>;
  setUser: (user: User) => void;
  clearAuth: () => Promise<void>;
  loadStoredToken: () => Promise<string | null>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setToken: async (token: string) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    set({ token, isAuthenticated: true, isLoading: false });
  },

  setUser: (user: User) => {
    set({ user });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    set({ token: null, user: null, isAuthenticated: false, isLoading: false });
  },

  loadStoredToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (token) {
        set({ token, isLoading: false });
        return token;
      }
      set({ isLoading: false });
      return null;
    } catch {
      set({ isLoading: false });
      return null;
    }
  },
}));
