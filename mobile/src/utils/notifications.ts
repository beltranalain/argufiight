import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiFetch } from '../api/client';

const isExpoGo = Constants.appOwnership === 'expo';

// Lazy-load expo-notifications to avoid crash in Expo Go (removed in SDK 53)
let Notifications: typeof import('expo-notifications') | null = null;

if (!isExpoGo) {
  Notifications = require('expo-notifications');
  Notifications!.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Register for push notifications and send the token to the backend.
 * Call this after successful login.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (isExpoGo || !Notifications) {
    console.log('Push notifications are not supported in Expo Go (SDK 53+)');
    return null;
  }

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Push notification permission not granted');
    return null;
  }

  // Get the Expo push token
  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: undefined, // Uses the project ID from app.json
  });
  const pushToken = tokenData.data;

  // Register token with backend
  try {
    await apiFetch('/api/fcm/register', {
      method: 'POST',
      body: {
        token: pushToken,
        platform: Platform.OS,
        deviceType: 'EXPO',
      },
    });
  } catch (err) {
    console.error('Failed to register push token:', err);
  }

  // Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#d4f050',
    });
  }

  return pushToken;
}

/**
 * Format relative time from ISO string
 */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const seconds = Math.floor((now - then) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return new Date(dateStr).toLocaleDateString();
}
