import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import * as AuthSession from 'expo-auth-session';
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
      
      console.log('[Google Login] Starting OAuth flow...');
      console.log('[Google Login] Auth URL:', authUrl);
      console.log('[Google Login] Redirect URI:', redirectUri);
      
      // Use WebBrowser with the mobile callback URL
      // The callback will redirect to a deep link
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri
      );

      console.log('[Google Login] OAuth result:', result.type, result.url);

      if (result.type === 'success') {
        const resultUrl = result.url;
        console.log('[Google Login] Result URL:', resultUrl);
        
        // The callback redirects to a deep link, so result.url should be the deep link
        if (resultUrl.startsWith('honorableai://')) {
          console.log('[Google Login] Deep link detected, parsing...');
          // Deep link - parse it directly
          await handleDeepLink(resultUrl);
        } else if (resultUrl.includes('/api/auth/google/mobile-callback')) {
          console.log('[Google Login] Callback URL detected, fetching redirect...');
          // If we got the callback URL, the redirect might not have been followed
          // Try to fetch it and see if we get redirected
          try {
            const response = await fetch(resultUrl, { 
              method: 'GET',
              redirect: 'follow',
            });
            
            console.log('[Google Login] Fetch response URL:', response.url);
            console.log('[Google Login] Fetch response status:', response.status);
            
            // Check if the final URL is a deep link
            if (response.url && response.url.startsWith('honorableai://')) {
              console.log('[Google Login] Redirect to deep link detected');
              await handleDeepLink(response.url);
            } else {
              // Try to get token from the callback URL query params
              const urlObj = new URL(resultUrl);
              const token = urlObj.searchParams.get('token');
              if (token) {
                console.log('[Google Login] Token found in URL params');
                await AsyncStorage.setItem('auth_token', token);
                await refreshUser();
              } else {
                // Try to parse JSON response if callback returned JSON
                try {
                  const data = await response.json();
                  if (data.success && data.token) {
                    console.log('[Google Login] Token found in JSON response');
                    await AsyncStorage.setItem('auth_token', data.token);
                    if (data.user) {
                      setUser(data.user);
                      await AsyncStorage.setItem('user', JSON.stringify(data.user));
                    } else {
                      await refreshUser();
                    }
                  } else {
                    throw new Error(data.error || 'Failed to get token from callback');
                  }
                } catch (jsonError) {
                  console.error('[Google Login] Could not parse JSON:', jsonError);
                  throw new Error('Could not extract token from callback. Response URL: ' + response.url);
                }
              }
            }
          } catch (fetchError: any) {
            console.error('[Google Login] Error processing callback:', fetchError);
            console.error('[Google Login] Error details:', fetchError.message, fetchError.stack);
            throw new Error(`Failed to complete Google login: ${fetchError.message}`);
          }
        } else {
          console.error('[Google Login] Unexpected callback URL:', resultUrl);
          throw new Error('Unexpected callback URL: ' + resultUrl);
        }
      } else if (result.type === 'cancel') {
        console.log('[Google Login] User cancelled');
        throw new Error('Google login cancelled');
      } else {
        console.error('[Google Login] Failed with type:', result.type);
        throw new Error('Google login failed');
      }
    } catch (error: any) {
      console.error('[Google Login] Error:', error);
      console.error('[Google Login] Error message:', error.message);
      console.error('[Google Login] Error stack:', error.stack);
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


