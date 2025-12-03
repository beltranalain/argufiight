import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { leaderboardAPI, LeaderboardUser } from '../../services/leaderboardAPI';

export default function LeaderboardScreen() {
  const navigation = useNavigation();
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadLeaderboard = async () => {
    try {
      const response = await leaderboardAPI.getLeaderboard();
      // Handle both array and object response formats
      const users = Array.isArray(response) ? response : (response?.users || response?.data || []);
      console.log('Leaderboard data:', { response, users, isArray: Array.isArray(users) });
      setUsers(Array.isArray(users) ? users : []);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      setUsers([]); // Set empty array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadLeaderboard();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>Leaderboard</Text>
        <Text style={styles.subtitle}>Top debaters by ELO rating</Text>

        {users.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users yet.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {users.map((user, index) => (
              <TouchableOpacity
                key={user.id}
                style={styles.userRow}
                onPress={() =>
                  navigation.navigate('UserProfile' as never, { userId: user.id })
                }
              >
                <View style={styles.rankContainer}>
                  <Text style={styles.rank}>{user.rank || index + 1}</Text>
                </View>
                <View style={styles.userInfo}>
                  <Text style={styles.username}>{user.username}</Text>
                  <Text style={styles.stats}>
                    {user.debatesWon}W / {user.debatesLost}L / {user.debatesTied}T
                  </Text>
                </View>
                <View style={styles.eloContainer}>
                  <Text style={styles.elo}>{user.eloRating}</Text>
                  <Text style={styles.eloLabel}>ELO</Text>
                </View>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#888',
    marginBottom: 24,
  },
  list: {
    marginTop: 8,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  rankContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  stats: {
    fontSize: 12,
    color: '#888',
  },
  eloContainer: {
    alignItems: 'flex-end',
  },
  elo: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  eloLabel: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
