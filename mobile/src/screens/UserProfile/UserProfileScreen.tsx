import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { usersAPI, UserProfile } from '../../services/usersAPI';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import UserFollowButton from '../../components/UserFollowButton';

export default function UserProfileScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const { userId } = route.params as { userId: string };

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);

  const isOwnProfile = currentUser?.id === userId;

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    try {
      const data = await usersAPI.getUserProfile(userId);
      setProfile(data);
      setIsFollowing(data.isFollowing || false);
    } catch (error: any) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    if (!currentUser) {
      Alert.alert('Error', 'You must be logged in to follow users');
      return;
    }

    if (isOwnProfile) {
      return;
    }

    setTogglingFollow(true);
    try {
      const data = await usersAPI.toggleFollow(userId);
      setIsFollowing(data.following);
      // Reload profile to get updated counts
      await loadProfile();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to toggle follow'
      );
    } finally {
      setTogglingFollow(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>User not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Profile Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            {profile.avatarUrl ? (
              <Text style={styles.avatarText}>
                {profile.username.charAt(0).toUpperCase()}
              </Text>
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={40} color="#666" />
              </View>
            )}
          </View>
          <Text style={styles.username}>{profile.username}</Text>
          {profile.bio && <Text style={styles.bio}>{profile.bio}</Text>}
          
          {/* Follow Button */}
          {!isOwnProfile && currentUser && (
            <UserFollowButton
              userId={userId}
              initialFollowing={isFollowing}
              onFollowChange={(following) => {
                setIsFollowing(following);
                loadProfile(); // Reload to update counts
              }}
              size="medium"
            />
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.eloRating}</Text>
            <Text style={styles.statLabel}>ELO Rating</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.debatesWon}</Text>
            <Text style={styles.statLabel}>Wins</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.debatesLost}</Text>
            <Text style={styles.statLabel}>Losses</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{profile.debatesTied}</Text>
            <Text style={styles.statLabel}>Ties</Text>
          </View>
        </View>

        <View style={styles.additionalStats}>
          <View style={styles.additionalStat}>
            <Text style={styles.additionalStatValue}>{profile.totalDebates}</Text>
            <Text style={styles.additionalStatLabel}>Total Debates</Text>
          </View>
          <View style={styles.additionalStat}>
            <Text style={styles.additionalStatValue}>{profile.winRate}%</Text>
            <Text style={styles.additionalStatLabel}>Win Rate</Text>
          </View>
        </View>

        {/* Follow Stats */}
        <View style={styles.followStats}>
          <TouchableOpacity
            style={styles.followStatItem}
            onPress={() => {
              navigation.navigate('Followers' as never, {
                userId: profile.id,
                type: 'followers',
              });
            }}
          >
            <Text style={styles.followStatValue}>{profile.followerCount}</Text>
            <Text style={styles.followStatLabel}>Followers</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.followStatItem}
            onPress={() => {
              navigation.navigate('Followers' as never, {
                userId: profile.id,
                type: 'following',
              });
            }}
          >
            <Text style={styles.followStatValue}>{profile.followingCount}</Text>
            <Text style={styles.followStatLabel}>Following</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Debates */}
        {profile.recentDebates.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Debates</Text>
            {profile.recentDebates.map((debate) => (
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
                  {debate.challenger.id === userId
                    ? debate.opponent?.username || 'Waiting...'
                    : debate.challenger.username}
                </Text>
                {debate.winnerId && (
                  <Text
                    style={[
                      styles.debateResult,
                      debate.winnerId === userId
                        ? styles.winResult
                        : styles.lossResult,
                    ]}
                  >
                    {debate.winnerId === userId ? '✓ Won' : '✗ Lost'}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#333',
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  username: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  bio: {
    fontSize: 14,
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
    marginBottom: 24,
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
    marginTop: 24,
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
  errorText: {
    color: '#ff0000',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
  followButton: {
    marginTop: 16,
    backgroundColor: '#111',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  followButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  followButtonTextActive: {
    color: '#000',
  },
  followStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
    marginBottom: 24,
  },
  followStatItem: {
    alignItems: 'center',
  },
  followStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  followStatLabel: {
    fontSize: 12,
    color: '#888',
  },
});

