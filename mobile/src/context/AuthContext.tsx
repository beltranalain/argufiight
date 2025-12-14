import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import { authAPI, User } from '../services/api';
import api from '../services/api';

// Complete web browser authentication session
WebBrowser.maybeCompleteAuthSession();

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  signup: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      if (userJson) {
        const userData = JSON.parse(userJson);
        setUser(userData);
        // Try to refresh user data from API, but don't block if it fails
        refreshUser().catch((error) => {
          console.log('Could not refresh user (API may be unavailable):', error.message);
          // App continues with cached user data
        });
      }
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      const data = await authAPI.login({ email, password });
      setUser(data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Login failed');
    }
  };

  const signup = async (email: string, password: string, username: string) => {
    try {
      const data = await authAPI.signup({ email, password, username });
      setUser(data.user);
    } catch (error: any) {
      throw new Error(error.response?.data?.error || 'Signup failed');
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
    } catch (error) {
      console.error('Error logging out:', error);
      // Clear local state even if API call fails
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await authAPI.getMe();
      // API might return { user: ... } or just the user object
      const userData = response.user || response;
      console.log('Refreshed user data:', {
        id: userData.id,
        username: userData.username,
        avatar_url: userData.avatar_url,
        hasAvatar: !!userData.avatar_url,
      });
      setUser(userData);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAuthenticated: !!user,
        login,
        loginWithGoogle,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};


