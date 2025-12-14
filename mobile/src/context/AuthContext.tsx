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
      
      // Use WebBrowser - the second parameter tells it what URL to listen for
      // When the callback redirects to this deep link, WebBrowser should capture it
      const deepLinkRedirect = 'honorableai://auth/callback';
      
      console.log('[Google Login] Opening auth session, expecting:', deepLinkRedirect);
      
      // Open auth session - the second parameter is the redirect URI pattern to match
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        deepLinkRedirect
      );

      console.log('[Google Login] OAuth result type:', result.type);
      if (result.url) {
        console.log('[Google Login] OAuth result URL:', result.url);
      } else {
        console.log('[Google Login] No URL in result');
      }

      if (result.type === 'success' && result.url) {
        const resultUrl = result.url;
        console.log('[Google Login] Result URL:', resultUrl);
        
        // The callback redirects to a deep link, so result.url should be the deep link
        if (resultUrl.startsWith('honorableai://')) {
          console.log('[Google Login] Deep link detected, parsing...');
          // Deep link - parse it directly
          await handleDeepLink(resultUrl);
        } else if (resultUrl.includes('/api/auth/google/mobile-callback')) {
          console.log('[Google Login] Callback URL detected - fetching token...');
          
          // The callback redirects to deep link, but WebBrowser didn't capture it
          // Fetch the callback URL and extract the deep link from the redirect
          try {
            const response = await fetch(resultUrl, { 
              method: 'GET',
              redirect: 'manual', // Don't follow redirects automatically
            });
            
            console.log('[Google Login] Fetch response status:', response.status);
            
            // Check Location header for redirect to deep link
            const location = response.headers.get('Location');
            if (location && location.startsWith('honorableai://')) {
              console.log('[Google Login] Location header contains deep link:', location);
              // Manually trigger the deep link
              const canOpen = await Linking.canOpenURL(location);
              if (canOpen) {
                console.log('[Google Login] Opening deep link manually...');
                await Linking.openURL(location);
                // The deep link handler will process it
                return;
              } else {
                throw new Error('Cannot open deep link');
              }
            }
            
            // If 302/301 redirect, try to get Location header
            if (response.status >= 300 && response.status < 400) {
              const redirectUrl = response.headers.get('Location');
              if (redirectUrl && redirectUrl.startsWith('honorableai://')) {
                console.log('[Google Login] Redirect URL is deep link:', redirectUrl);
                await Linking.openURL(redirectUrl);
                return;
              }
            }
            
            // Try to parse HTML response for deep link
            const html = await response.text();
            const deepLinkMatch = html.match(/honorableai:\/\/auth\/callback[^"'\s<>]*/);
            if (deepLinkMatch) {
              console.log('[Google Login] Deep link found in HTML:', deepLinkMatch[0]);
              await Linking.openURL(deepLinkMatch[0]);
              return;
            }
            
            throw new Error('Could not extract deep link from callback');
          } catch (fetchError: any) {
            console.error('[Google Login] Error processing callback:', fetchError);
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


