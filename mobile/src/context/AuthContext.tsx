import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
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

  // Handle deep links for OAuth callback (defined outside useEffect so it can be used in loginWithGoogle)
  const handleDeepLink = async (urlString: string) => {
    try {
      // Parse the deep link URL
      // Format: honorableai://auth/callback?token=...&success=true&userId=...
      if (urlString.startsWith('honorableai://auth/callback')) {
        // Parse URL manually since URL constructor doesn't work with custom schemes
        const urlParts = urlString.split('?');
        if (urlParts.length > 1) {
          const params = new URLSearchParams(urlParts[1]);
          const token = params.get('token');
          const success = params.get('success');
          const userId = params.get('userId');
          
          if (success === 'true' && token) {
            // Store token
            await AsyncStorage.setItem('auth_token', token);
            
            // Fetch user data
            try {
              const userResponse = await api.get('/auth/me');
              const userData = userResponse.data.user || userResponse.data;
              setUser(userData);
              await AsyncStorage.setItem('user', JSON.stringify(userData));
            } catch (userError: any) {
              console.error('Error fetching user data:', userError);
              // Token is stored, user can refresh
            }
          }
        }
      }
    } catch (error: any) {
      console.error('Error handling deep link:', error);
    }
  };

  useEffect(() => {
    loadUser();
    
    // Listen for deep links
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });
    
    // Check if app was opened via deep link
    Linking.getInitialURL().then((url) => {
      if (url) {
        handleDeepLink(url);
      }
    });
    
    return () => {
      subscription.remove();
    };
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
      const authUrl = `${baseUrl}/api/auth/google?returnTo=${encodeURIComponent('honorableai://auth/callback')}`;
      const redirectUri = `${baseUrl}/api/auth/google/mobile-callback`;
      
      // Use WebBrowser with the mobile callback URL
      // The callback will return JSON which we'll parse
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      if (result.type === 'success') {
        console.log('OAuth result URL:', result.url);
        
        // The callback redirects to a deep link, so result.url should be the deep link
        if (result.url.startsWith('honorableai://')) {
          // Deep link - parse it directly
          await handleDeepLink(result.url);
        } else if (result.url.includes('/api/auth/google/mobile-callback')) {
          // If we somehow got the callback URL instead of the deep link,
          // try to extract token from query params or fetch the redirect
          try {
            // The callback should have redirected, but if not, try fetching
            const response = await fetch(result.url, { redirect: 'follow' });
            const finalUrl = response.url;
            
            if (finalUrl.startsWith('honorableai://')) {
              await handleDeepLink(finalUrl);
            } else {
              // Try to get token from URL query params as fallback
              const urlObj = new URL(result.url);
              const token = urlObj.searchParams.get('token');
              if (token) {
                await AsyncStorage.setItem('auth_token', token);
                await refreshUser();
              } else {
                throw new Error('Could not extract token from callback');
              }
            }
          } catch (fetchError: any) {
            console.error('Error processing callback:', fetchError);
            throw new Error('Failed to complete Google login. Please try again.');
          }
        } else {
          throw new Error('Unexpected callback URL: ' + result.url);
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


