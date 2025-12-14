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
      
      // Use WebBrowser with the web callback URL as the redirect URI
      // The callback will append the token to the URL, which WebBrowser can capture
      console.log('[Google Login] Opening auth session, expecting callback URL with token');
      
      // Open auth session - use the web callback URL as the redirect URI
      // WebBrowser will capture the callback URL when it's loaded
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        redirectUri  // Use the web callback URL, not the deep link
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
        
        // The callback now appends token to the URL itself (not redirecting to deep link)
        if (resultUrl.includes('/api/auth/google/mobile-callback')) {
          console.log('[Google Login] Callback URL detected, extracting token...');
          
          // Extract token from URL query params
          try {
            const urlObj = new URL(resultUrl);
            const token = urlObj.searchParams.get('token');
            const success = urlObj.searchParams.get('success');
            const userId = urlObj.searchParams.get('userId');
            
            if (token && success === 'true') {
              console.log('[Google Login] Token found in callback URL');
              // Store token
              await AsyncStorage.setItem('auth_token', token);
              
              // Fetch user data
              try {
                const userResponse = await api.get('/auth/me');
                const userData = userResponse.data.user || userResponse.data;
                setUser(userData);
                await AsyncStorage.setItem('user', JSON.stringify(userData));
                console.log('[Google Login] User data fetched and stored');
              } catch (userError: any) {
                console.error('[Google Login] Error fetching user data:', userError);
                // Token is stored, user can refresh
              }
              return; // Success!
            } else {
              throw new Error('Token not found in callback URL');
            }
          } catch (urlError: any) {
            console.error('[Google Login] Error parsing callback URL:', urlError);
            throw new Error(`Failed to extract token: ${urlError.message}`);
          }
        } else if (resultUrl.startsWith('honorableai://')) {
          // Fallback: if we somehow get a deep link, handle it
          console.log('[Google Login] Deep link detected, parsing...');
          await handleDeepLink(resultUrl);
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


