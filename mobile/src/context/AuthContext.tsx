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

  const loginWithGoogle = async () => {
    try {
      // Get the base URL for OAuth
      const baseUrl = api.defaults.baseURL?.replace('/api', '') || 'https://www.argufight.com';
      
      // Construct Google OAuth URL with mobile callback indicator
      const authUrl = `${baseUrl}/api/auth/google?returnTo=${encodeURIComponent('mobile://auth/callback')}`;
      const redirectUri = `${baseUrl}/api/auth/google/mobile-callback`;
      
      // Open browser for OAuth with mobile callback URL
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      if (result.type === 'success') {
        // The mobile-callback endpoint returns JSON
        // We need to fetch the callback URL to get the JSON response
        try {
          // Make a request to the callback URL to get the JSON response
          const response = await fetch(result.url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            credentials: 'include', // Include cookies if any
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }
          
          const data = await response.json();
          
          if (data.success && data.user && data.token) {
            setUser(data.user);
            await AsyncStorage.setItem('user', JSON.stringify(data.user));
            await AsyncStorage.setItem('auth_token', data.token);
          } else {
            throw new Error(data.error || 'Failed to get user data');
          }
        } catch (fetchError: any) {
          console.error('Error fetching callback data:', fetchError);
          // If the URL is the callback endpoint, try parsing it differently
          if (result.url.includes('/api/auth/google/mobile-callback')) {
            // The endpoint should return JSON, but if it redirects, we need to handle it
            throw new Error(fetchError.message || 'Failed to complete Google login');
          } else {
            throw new Error('Unexpected callback URL');
          }
        }
      } else if (result.type === 'cancel') {
        throw new Error('Google login cancelled');
      } else {
        throw new Error('Google login failed');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      throw new Error(error.message || 'Google login failed');
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


