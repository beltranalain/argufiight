import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, View, Linking } from 'react-native';
import { AuthNavigator } from './AuthNavigator';
import { AppNavigator } from './AppNavigator';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme';
import { BASE_URL } from '../api/client';
import { registerForPushNotifications } from '../utils/notifications';

/** Extract token from an auth callback URL (exp://...?token=...&success=true) */
function extractAuthToken(url: string): string | null {
  try {
    // Handle exp:// URLs by extracting query string after '?'
    const qsIndex = url.indexOf('?');
    if (qsIndex === -1) return null;
    const params = new URLSearchParams(url.substring(qsIndex));
    if (params.get('success') === 'true' && params.get('token')) {
      return params.get('token');
    }
  } catch {}
  return null;
}

export function RootNavigator() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading, loadStoredToken, setUser, setToken } = useAuthStore();
  const [initializing, setInitializing] = useState(true);
  // Prevent double-processing the same auth URL (race with LoginScreen.handleGoogleLogin)
  const processingAuthRef = useRef(false);

  // Handle incoming deep link auth callbacks (Google OAuth redirect)
  useEffect(() => {
    async function handleAuthUrl(url: string) {
      const authToken = extractAuthToken(url);
      if (!authToken) return;

      // Skip if LoginScreen's handleGoogleLogin is already handling this
      // (both fire simultaneously on Android when the OAuth redirect lands)
      if (processingAuthRef.current) return;
      processingAuthRef.current = true;

      try {
        await setToken(authToken);
        // Use raw fetch instead of apiFetch to avoid triggering clearAuth() on transient 401.
        // LoginScreen's handleGoogleLogin manages the full auth flow with polling fallback.
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 8000);
        const res = await fetch(`${BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${authToken}` },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setUser(data.user);
            registerForPushNotifications().catch(() => {});
          }
        }
        // If me() fails, token is already set — LoginScreen polling will recover.
      } catch {
        // Network error or timeout — token set, LoginScreen polling will recover.
      } finally {
        processingAuthRef.current = false;
      }
    }

    // Check if the app was opened with an auth URL
    Linking.getInitialURL().then((url) => {
      if (url) handleAuthUrl(url);
    });

    // Listen for auth URLs while the app is running
    const sub = Linking.addEventListener('url', ({ url }) => handleAuthUrl(url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    async function init() {
      const storedToken = await loadStoredToken();
      if (storedToken) {
        await setToken(storedToken);
        // Show UI immediately — enrich user data in background (non-blocking)
        (async () => {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 8000);
            const res = await fetch(`${BASE_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
              signal: controller.signal,
            });
            clearTimeout(timer);
            if (res.ok) {
              const data = await res.json();
              if (data.user) {
                setUser(data.user);
                registerForPushNotifications().catch(() => {});
              }
            }
          } catch {
            // Network error or timeout — user stays logged in via token.
          }
        })();
      }
      setInitializing(false);
    }
    init();
  }, []);

  if (initializing || isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return isAuthenticated ? <AppNavigator /> : <AuthNavigator />;
}
