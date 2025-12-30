import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

interface User {
  id: string;
  username: string;
  avatarUrl: string | null;
  eloRating: number;
  debatesWon: number;
  debatesLost: number;
  totalDebates: number;
  followedAt: string;
}

export default function FollowersScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const { currentScheme } = useTheme();
  const { userId, type } = route.params as { userId: string; type: 'followers' | 'following' };

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadUsers = async () => {
    try {
      const endpoint = type === 'followers' ? '/users/followers' : '/users/following';
      const response = await api.get(`${endpoint}?userId=${userId}`);
      setUsers(response.data || []);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [userId, type]);

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const themeStyles = getThemeStyles(currentScheme);

  if (loading) {
    return (
      <View style={themeStyles.loadingContainer}>
        <ActivityIndicator size="large" color={themeStyles.textColor} />
      </View>
    );
  }

  return (
    <ScrollView
      style={themeStyles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={themeStyles.textColor} />
      }
    >
      <View style={themeStyles.content}>
        <Text style={themeStyles.title}>
          {type === 'followers' ? 'Followers' : 'Following'}
        </Text>
        <Text style={themeStyles.subtitle}>
          {users.length} {users.length === 1 ? 'user' : 'users'}
        </Text>

        {users.length === 0 ? (
          <View style={themeStyles.emptyContainer}>
            <Ionicons
              name={type === 'followers' ? 'people-outline' : 'person-outline'}
              size={64}
              color={themeStyles.placeholderColor}
            />
            <Text style={themeStyles.emptyText}>
              No {type === 'followers' ? 'followers' : 'following'} yet
            </Text>
          </View>
        ) : (
          users.map((user) => (
            <TouchableOpacity
              key={user.id}
              style={themeStyles.userCard}
              onPress={() =>
                navigation.navigate('UserProfile' as never, { userId: user.id })
              }
            >
              <View style={themeStyles.userInfo}>
                <View style={themeStyles.avatarContainer}>
                  {user.avatarUrl ? (
                    <Text style={themeStyles.avatarText}>
                      {user.username.charAt(0).toUpperCase()}
                    </Text>
                  ) : (
                    <Ionicons name="person" size={24} color={themeStyles.placeholderColor} />
                  )}
                </View>
                <View style={themeStyles.userDetails}>
                  <Text style={themeStyles.username}>{user.username}</Text>
                  <View style={themeStyles.userStats}>
                    <Text style={themeStyles.statText}>ELO: {user.eloRating}</Text>
                    <Text style={themeStyles.statText}>
                      {user.debatesWon}W / {user.debatesLost}L
                    </Text>
                  </View>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={themeStyles.placeholderColor} />
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const getThemeStyles = (scheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: scheme === 'dark' ? '#000' : '#f0f0f0',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: scheme === 'dark' ? '#000' : '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: scheme === 'dark' ? '#fff' : '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: scheme === 'dark' ? '#888' : '#555',
    marginBottom: 24,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: scheme === 'dark' ? '#666' : '#888',
    marginTop: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: scheme === 'dark' ? '#111' : '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: scheme === 'dark' ? '#333' : '#ccc',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: scheme === 'dark' ? '#222' : '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: scheme === 'dark' ? '#fff' : '#000',
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: scheme === 'dark' ? '#fff' : '#000',
    marginBottom: 4,
  },
  userStats: {
    flexDirection: 'row',
    gap: 12,
  },
  statText: {
    fontSize: 12,
    color: scheme === 'dark' ? '#888' : '#555',
  },
  textColor: {
    color: scheme === 'dark' ? '#fff' : '#000',
  },
  placeholderColor: {
    color: scheme === 'dark' ? '#666' : '#888',
  },
});











