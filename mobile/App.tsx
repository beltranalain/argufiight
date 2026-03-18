import React, { useState, useCallback, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Inter_200ExtraLight,
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';

import { RootNavigator } from './src/navigation/RootNavigator';
import { linking } from './src/navigation/linking';
import { ThemeContext, colors, ThemeMode } from './src/theme';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Keep splash screen visible while loading fonts
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 2 * 60 * 1000,   // 2 minutes — reduce refetches on tab switches
      gcTime: 10 * 60 * 1000,     // 10 minutes — keep cache longer on mobile
      refetchOnWindowFocus: false, // mobile: don't refetch when app regains focus
      refetchOnReconnect: true,
    },
  },
});

export default function App() {
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');

  const [fontsLoaded] = useFonts({
    Inter_200ExtraLight,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  const toggleTheme = useCallback(() => {
    setThemeMode((m) => (m === 'dark' ? 'light' : 'dark'));
  }, []);

  if (!fontsLoaded) return null;

  const themeColors = colors[themeMode];

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeContext.Provider value={{ mode: themeMode, colors: themeColors, toggleTheme }}>
        <SafeAreaProvider>
          <QueryClientProvider client={queryClient}>
            <NavigationContainer
              linking={linking}
              theme={{
                dark: themeMode === 'dark',
                colors: {
                  primary: themeColors.accent,
                  background: themeColors.bg,
                  card: themeColors.surface,
                  text: themeColors.text,
                  border: themeColors.border,
                  notification: themeColors.red,
                },
                fonts: {
                  regular: { fontFamily: 'Inter_400Regular', fontWeight: '400' },
                  medium: { fontFamily: 'Inter_500Medium', fontWeight: '500' },
                  bold: { fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
                  heavy: { fontFamily: 'Inter_600SemiBold', fontWeight: '600' },
                },
              }}
            >
              <RootNavigator />
            </NavigationContainer>
          </QueryClientProvider>
        </SafeAreaProvider>
        <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      </ThemeContext.Provider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}
