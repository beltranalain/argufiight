import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
  TextInput,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { debatesAPI, Debate } from '../../services/debatesAPI';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { avatarAPI } from '../../services/avatarAPI';
import { profileAPI } from '../../services/profileAPI';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useAuth();
  const navigation = useNavigation();
  const [recentDebates, setRecentDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [bioText, setBioText] = useState('');
  const [savingBio, setSavingBio] = useState(false);

  useEffect(() => {
    loadData();
    if (user?.bio) {
      setBioText(user.bio);
    }
    // Debug: Log user data to see if avatar_url is present
    if (user) {
      console.log('ProfileScreen - User data:', {
        id: user.id,
        username: user.username,
        avatar_url: user.avatar_url,
        hasAvatar: !!user.avatar_url,
        avatarType: user.avatar_url ? (user.avatar_url.startsWith('data:') ? 'base64' : user.avatar_url.startsWith('http') ? 'url' : 'other') : 'none',
      });
    }
  }, [user]);

  // Refresh user data when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user) {
        refreshUser();
      }
    });
    return unsubscribe;
  }, [navigation, user]);

  const loadData = async () => {
    if (!user) return;

    try {
      // Load recent debates
      const response = await debatesAPI.getDebates({ userId: user.id, status: 'COMPLETED,VERDICT_READY' });
      // API returns { debates: Debate[], total, page, totalPages }
      const debates = response?.debates || (Array.isArray(response) ? response : []);
      console.log('Loaded user debates:', debates?.length || 0, 'for user:', user.id);
      // Ensure debates is an array before calling slice
      if (Array.isArray(debates)) {
        setRecentDebates(debates.slice(0, 5)); // Show last 5
      } else {
        console.warn('Debates is not an array:', debates);
        setRecentDebates([]);
      }
    } catch (error: any) {
      console.error('Failed to load profile data:', error);
      console.error('Error details:', error.message || error);
      setRecentDebates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveBio = async () => {
    if (!user) return;
    
    setSavingBio(true);
    try {
      await profileAPI.updateProfile({ bio: bioText.trim() });
      await refreshUser();
      setEditingBio(false);
      Alert.alert('Success', 'Bio updated successfully');
    } catch (error: any) {
      console.error('Failed to update bio:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to update bio');
    } finally {
      setSavingBio(false);
    }
  };

  const handlePickImage = async () => {
    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to change your avatar.');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images, // Using deprecated API for now - will update later
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
          console.log('Reading image file from:', asset.uri);
          // Use legacy API - encoding can be string 'base64' or EncodingType enum
          const base64 = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'base64' as any,
          });
          
          const mimeType = asset.mimeType || 'image/jpeg';
          const dataUrl = `data:${mimeType};base64,${base64}`;

          console.log('Image converted to base64, size:', base64.length, 'chars');

          // Send base64 data URL to backend
          const apiUrl = 'http://192.168.1.152:3000';
          console.log('Uploading avatar to:', `${apiUrl}/api/users/avatar`);
          
          const response = await fetch(`${apiUrl}/api/users/avatar`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ avatarUrl: dataUrl }),
          });

          console.log('Upload response status:', response.status);

          if (!response.ok) {
            const errorText = await response.text();
            console.error('Upload error response:', errorText);
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { error: errorText || 'Failed to upload avatar' };
            }
            throw new Error(errorData.error || `Upload failed with status ${response.status}`);
          }

          const data = await response.json();
          console.log('Upload success, data:', data);
          console.log('Avatar URL from response:', data.user?.avatarUrl || data.avatarUrl);
          
          // Verify the avatar URL was returned
          if (!data.user?.avatarUrl && !data.avatarUrl) {
            throw new Error('Avatar URL not returned from server');
          }

          // Refresh user data to get updated avatar
          console.log('Refreshing user data...');
          await refreshUser();
          
          // Wait a moment for the refresh to complete
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Verify the avatar was actually updated
          const updatedUserJson = await AsyncStorage.getItem('user');
          if (updatedUserJson) {
            const updatedUser = JSON.parse(updatedUserJson);
            console.log('User after refresh - avatar_url:', updatedUser.avatar_url);
            if (!updatedUser.avatar_url) {
              console.warn('Avatar URL not found in refreshed user data');
            }
          }
          
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
      Alert.alert('Error', 'Failed to pick image');
    }
  };

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

  const winRate =
    user && user.total_debates > 0
      ? ((user.debates_won / user.total_debates) * 100).toFixed(1)
      : '0.0';

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Profile</Text>

        {user && (
          <View style={styles.profileSection}>
            {/* Profile Picture */}
            <View style={styles.avatarContainer}>
              {user.avatar_url && user.avatar_url.trim() !== '' ? (
                <View style={styles.avatarImageContainer}>
                  {(user.avatar_url.startsWith('data:') || user.avatar_url.startsWith('http://') || user.avatar_url.startsWith('https://')) ? (
                    <Image
                      source={{ uri: user.avatar_url }}
                      style={styles.avatarImage}
                      resizeMode="cover"
                      onError={(error) => {
                        console.error('Image load error:', error);
                      }}
                      onLoad={() => {
                        console.log('Image loaded successfully:', user.avatar_url);
                      }}
                    />
                  ) : (
                    <Text style={styles.avatarText}>
                      {user.username?.charAt(0).toUpperCase() || 'U'}
                    </Text>
                  )}
                </View>
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {user.username?.charAt(0).toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
              {uploadingAvatar && (
                <View style={styles.uploadingOverlay}>
                  <ActivityIndicator size="small" color="#fff" />
                </View>
              )}
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.username}>{user.username}</Text>
              <Text style={styles.email}>{user.email}</Text>
            </View>
            
            {/* Bio Section */}
            <View style={styles.bioContainer}>
              {editingBio ? (
                <View style={styles.bioEditContainer}>
                  <TextInput
                    style={styles.bioInput}
                    value={bioText}
                    onChangeText={setBioText}
                    placeholder="Add a bio..."
                    placeholderTextColor="#666"
                    multiline
                    maxLength={200}
                    autoFocus
                  />
                  <View style={styles.bioActions}>
                    <TouchableOpacity
                      style={styles.bioCancelButton}
                      onPress={() => {
                        setEditingBio(false);
                        setBioText(user.bio || '');
                      }}
                    >
                      <Text style={styles.bioCancelText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.bioSaveButton}
                      onPress={handleSaveBio}
                      disabled={savingBio}
                    >
                      {savingBio ? (
                        <ActivityIndicator size="small" color="#000" />
                      ) : (
                        <Text style={styles.bioSaveText}>Save</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.bioDisplay}
                  onPress={() => setEditingBio(true)}
                >
                  {user.bio ? (
                    <Text style={styles.bioText}>{user.bio}</Text>
                  ) : (
                    <Text style={styles.bioPlaceholder}>Tap to add a bio...</Text>
                  )}
                  <Ionicons name="create-outline" size={16} color="#666" style={styles.bioEditIcon} />
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user.elo_rating}</Text>
                <Text style={styles.statLabel}>ELO Rating</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user.debates_won}</Text>
                <Text style={styles.statLabel}>Wins</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user.debates_lost}</Text>
                <Text style={styles.statLabel}>Losses</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{user.debates_tied}</Text>
                <Text style={styles.statLabel}>Ties</Text>
              </View>
            </View>

            <View style={styles.additionalStats}>
              <View style={styles.additionalStat}>
                <Text style={styles.additionalStatValue}>{user.total_debates}</Text>
                <Text style={styles.additionalStatLabel}>Total Debates</Text>
              </View>
              <View style={styles.additionalStat}>
                <Text style={styles.additionalStatValue}>{winRate}%</Text>
                <Text style={styles.additionalStatLabel}>Win Rate</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions - Horizontal Layout (2 rows of 3) */}
        <View style={styles.quickActionsContainer}>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('SavedDebates' as never)}
            >
              <Ionicons name="bookmark" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Saved</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Stats' as never)}
            >
              <Ionicons name="stats-chart" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Stats</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Achievements' as never)}
            >
              <Ionicons name="trophy-outline" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Achievements</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.quickActionsRow}>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Analytics' as never)}
            >
              <Ionicons name="analytics-outline" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Analytics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Challenges' as never)}
            >
              <Ionicons name="flame-outline" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Challenges</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.quickActionButton}
              onPress={() => navigation.navigate('Settings' as never)}
            >
              <Ionicons name="settings-outline" size={24} color="#fff" />
              <Text style={styles.quickActionText}>Settings</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Debates */}
        {recentDebates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Debates</Text>
            {recentDebates.map((debate) => (
              <TouchableOpacity
                key={debate.id}
                style={styles.debateItem}
                onPress={() =>
                  navigation.navigate('DebateDetail' as never, {
                    debateId: debate.id,
                  })
                }
              >
                <View style={styles.debateItemHeader}>
                  <Text style={styles.debateTopic} numberOfLines={1}>
                    {debate.topic}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          debate.status === 'VERDICT_READY'
                            ? '#00aaff'
                            : debate.status === 'ACTIVE'
                            ? '#00ff00'
                            : '#888',
                      },
                    ]}
                  >
                    <Text style={styles.statusText}>{debate.status}</Text>
                  </View>
                </View>
                <Text style={styles.debateInfo}>
                  vs.{' '}
                  {debate.challengerId === user?.id
                    ? debate.opponent?.username || 'Waiting...'
                    : debate.challenger?.username}
                </Text>
                {debate.winnerId && (
                  <Text
                    style={[
                      styles.debateResult,
                      debate.winnerId === user?.id
                        ? styles.winResult
                        : styles.lossResult,
                    ]}
                  >
                    {debate.winnerId === user?.id ? '✓ Won' : '✗ Lost'}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
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
  profileSection: {
    marginBottom: 32,
    alignItems: 'center',
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
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  userInfo: {
    alignItems: 'center',
    width: '100%',
    marginTop: 8,
  },
  editAvatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00aaff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  editAvatarText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
  username: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
    marginBottom: 16,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  additionalStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
  },
  additionalStat: {
    alignItems: 'center',
  },
  additionalStatValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  additionalStatLabel: {
    fontSize: 12,
    color: '#888',
  },
  section: {
    marginTop: 32,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  debateItem: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  debateItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  debateTopic: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#000',
    fontWeight: '600',
  },
  debateInfo: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  debateResult: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  winResult: {
    color: '#00ff00',
  },
  lossResult: {
    color: '#ff0000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 90,
    justifyContent: 'center',
  },
  quickActionText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 8,
    textAlign: 'center',
  },
  bioContainer: {
    marginTop: 16,
    marginBottom: 8,
    width: '100%',
  },
  bioDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 50,
  },
  bioText: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  bioPlaceholder: {
    flex: 1,
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  bioEditIcon: {
    marginLeft: 8,
  },
  bioEditContainer: {
    backgroundColor: '#111',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333',
    padding: 12,
  },
  bioInput: {
    color: '#fff',
    fontSize: 14,
    minHeight: 60,
    maxHeight: 120,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  bioActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  bioCancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#222',
  },
  bioCancelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bioSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#fff',
  },
  bioSaveText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});

