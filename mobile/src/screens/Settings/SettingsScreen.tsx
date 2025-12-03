import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

export default function SettingsScreen() {
  const { user, logout, refreshUser } = useAuth();
  const { theme, themeMode, setThemeMode } = useTheme();
  const navigation = useNavigation();
  
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Load saved notification preferences
  React.useEffect(() => {
    const loadPreferences = async () => {
      try {
        const pushEnabled = await AsyncStorage.getItem('pushNotificationsEnabled');
        const emailEnabled = await AsyncStorage.getItem('emailNotificationsEnabled');
        if (pushEnabled !== null) {
          setPushNotifications(pushEnabled === 'true');
        }
        if (emailEnabled !== null) {
          setEmailNotifications(emailEnabled === 'true');
        }
      } catch (error) {
        console.error('Failed to load notification preferences:', error);
      }
    };
    loadPreferences();
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to log out?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          onPress: async () => {
            await logout();
          },
          style: 'destructive',
        },
      ],
      { cancelable: true }
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('Profile' as never);
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to change your avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        setUploadingAvatar(true);
        try {
          // Check if user is authenticated
          if (!user) {
            Alert.alert(
              'Authentication Required',
              'Please log in to upload an avatar.',
              [{ text: 'OK' }]
            );
            return;
          }

          // Upload the image file to the backend
          const token = await AsyncStorage.getItem('auth_token');
          
          if (!token) {
            Alert.alert(
              'Authentication Error',
              'Your session has expired. Please log in again.',
              [{ text: 'OK' }]
            );
            return;
          }

          // Read the image file and convert to base64
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64' as any,
          });
          
          const mimeType = asset.mimeType || 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,${base64}`;

          // Send base64 data URL to backend
          const apiUrl = 'http://192.168.1.152:3000';
          
          const response = await fetch(`${apiUrl}/api/users/avatar`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ avatarUrl: dataUrl }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText || 'Failed to upload avatar' };
            }
            throw new Error(errorData.error || `Upload failed with status ${response.status}`);
          }

          // Refresh user data to get updated avatar
          await refreshUser();
          
          Alert.alert('Success', 'Avatar updated successfully!');
        } catch (error: any) {
          console.error('Avatar upload error:', error);
          Alert.alert('Error', error.message || 'Failed to update avatar. Please try again.');
        } finally {
          setUploadingAvatar(false);
        }
      }
    } catch (error: any) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image: ' + error.message);
    }
  };

  const handleChangePassword = () => {
    Alert.alert(
      'Change Password',
      'Password change feature coming soon. For now, please use the "Forgot Password" option on the login screen.',
      [{ text: 'OK' }]
    );
  };

  const handlePushNotifications = async (value: boolean) => {
    setPushNotifications(value);
    await AsyncStorage.setItem('pushNotificationsEnabled', value.toString());
    Alert.alert(
      value ? 'Push Notifications Enabled' : 'Push Notifications Disabled',
      value 
        ? 'You will receive push notifications for debates and updates.'
        : 'You will not receive push notifications.',
      [{ text: 'OK' }]
    );
  };

  const handleEmailNotifications = async (value: boolean) => {
    setEmailNotifications(value);
    await AsyncStorage.setItem('emailNotificationsEnabled', value.toString());
    Alert.alert(
      value ? 'Email Notifications Enabled' : 'Email Notifications Disabled',
      value 
        ? 'You will receive email notifications for debates and updates.'
        : 'You will not receive email notifications.',
      [{ text: 'OK' }]
    );
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'Need help? Contact us at support@honorable.ai or visit our help center.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Email Support', 
          onPress: () => Linking.openURL('mailto:support@honorable.ai')
        },
      ]
    );
  };

  const handleTermsOfService = () => {
    Alert.alert(
      'Terms of Service',
      'Terms of Service will be available soon. For now, please contact support for any questions.',
      [{ text: 'OK' }]
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert(
      'Privacy Policy',
      'Privacy Policy will be available soon. For now, please contact support for any questions.',
      [{ text: 'OK' }]
    );
  };

  const handleAbout = () => {
    Alert.alert(
      'About Honorable.AI',
      'Honorable.AI\nVersion 1.0.0\n\nA platform for intelligent debates and discussions.',
      [{ text: 'OK' }]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          {/* Profile Picture Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              {user?.avatar_url ? (
                <View style={styles.avatarImageContainer}>
                  {user.avatar_url.startsWith('data:') ? (
                    <Image
                      source={{ uri: user.avatar_url }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={40} color="#666" />
                </View>
              )}
              {uploadingAvatar && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.changeAvatarButton}
              onPress={handlePickImage}
              disabled={uploadingAvatar}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.changeAvatarText}>Change Photo</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleEditProfile}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="person-outline" size={24} color="#fff" />
              <Text style={styles.settingLabel}>Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleChangePassword}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="lock-closed-outline" size={24} color="#fff" />
              <Text style={styles.settingLabel}>Change Password</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color="#fff" />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={handlePushNotifications}
              trackColor={{ false: '#333', true: '#00aaff' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="mail-outline" size={24} color="#fff" />
              <Text style={styles.settingLabel}>Email Notifications</Text>
            </View>
            <Switch
              value={emailNotifications}
              onValueChange={handleEmailNotifications}
              trackColor={{ false: '#333', true: '#00aaff' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* App Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="color-palette-outline" size={24} color="#fff" />
              <Text style={styles.settingLabel}>Theme</Text>
            </View>
            <View style={styles.themeOptions}>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeMode === 'light' && styles.themeOptionActive,
                ]}
                onPress={() => setThemeMode('light')}
              >
                <Ionicons name="sunny" size={16} color={themeMode === 'light' ? '#000' : '#888'} />
                <Text
                  style={[
                    styles.themeOptionText,
                    themeMode === 'light' && styles.themeOptionTextActive,
                  ]}
                >
                  Light
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeMode === 'dark' && styles.themeOptionActive,
                ]}
                onPress={() => setThemeMode('dark')}
              >
                <Ionicons name="moon" size={16} color={themeMode === 'dark' ? '#000' : '#888'} />
                <Text
                  style={[
                    styles.themeOptionText,
                    themeMode === 'dark' && styles.themeOptionTextActive,
                  ]}
                >
                  Dark
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.themeOption,
                  themeMode === 'auto' && styles.themeOptionActive,
                ]}
                onPress={() => setThemeMode('auto')}
              >
                <Ionicons name="phone-portrait" size={16} color={themeMode === 'auto' ? '#000' : '#888'} />
                <Text
                  style={[
                    styles.themeOptionText,
                    themeMode === 'auto' && styles.themeOptionTextActive,
                  ]}
                >
                  Auto
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleHelpSupport}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={24} color="#fff" />
              <Text style={styles.settingLabel}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleTermsOfService}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="document-text-outline" size={24} color="#fff" />
              <Text style={styles.settingLabel}>Terms of Service</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handlePrivacyPolicy}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#fff" />
              <Text style={styles.settingLabel}>Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleAbout}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={24} color="#fff" />
              <Text style={styles.settingLabel}>About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, styles.dangerItem]}
            onPress={handleLogout}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="log-out-outline" size={24} color="#ff0000" />
              <Text style={[styles.settingLabel, styles.dangerText]}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 24,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500',
  },
  dangerItem: {
    borderColor: '#ff0000',
  },
  dangerText: {
    color: '#ff0000',
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
    gap: 4,
  },
  themeOptionActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  themeOptionText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '600',
  },
  themeOptionTextActive: {
    color: '#000',
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
  },
  avatarContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  avatarImageContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
    overflow: 'hidden',
    position: 'relative',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#333',
    position: 'relative',
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  changeAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
    borderWidth: 1,
    borderColor: '#555',
  },
  changeAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

