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
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  debatesThisWeek: number;
  debatesThisMonth: number;
  totalDebates: number;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: string;
  target: number;
  reward: string;
  progress: number;
  completed: boolean;
  progressPercentage: number;
}

export default function ChallengesScreen() {
  const navigation = useNavigation();
  const [streaks, setStreaks] = useState<StreakData | null>(null);
  const [challenge, setChallenge] = useState<DailyChallenge | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [streaksRes, challengeRes] = await Promise.all([
        api.get('/users/streaks'),
        api.get('/challenges/daily'),
      ]);
      setStreaks(streaksRes.data);
      setChallenge(challengeRes.data);
    } catch (error: any) {
      console.error('Failed to load challenges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'PARTICIPATE':
        return 'chatbubbles';
      case 'WIN':
        return 'trophy';
      case 'COMMENT':
        return 'chatbubble-ellipses';
      case 'CREATE':
        return 'add-circle';
      default:
        return 'star';
    }
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
        <Text style={styles.title}>Challenges & Streaks</Text>
        <Text style={styles.subtitle}>Track your progress and achievements</Text>

        {/* Streaks Section */}
        {streaks && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Streaks</Text>
            <View style={styles.streaksGrid}>
              <View style={styles.streakCard}>
                <Ionicons name="flame" size={32} color="#ff6600" />
                <Text style={styles.streakValue}>{streaks.currentStreak}</Text>
                <Text style={styles.streakLabel}>Current Streak</Text>
                <Text style={styles.streakSubtext}>days in a row</Text>
              </View>
              <View style={styles.streakCard}>
                <Ionicons name="trophy" size={32} color="#ffd700" />
                <Text style={styles.streakValue}>{streaks.longestStreak}</Text>
                <Text style={styles.streakLabel}>Longest Streak</Text>
                <Text style={styles.streakSubtext}>best record</Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{streaks.debatesThisWeek}</Text>
                <Text style={styles.statLabel}>This Week</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{streaks.debatesThisMonth}</Text>
                <Text style={styles.statLabel}>This Month</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{streaks.totalDebates}</Text>
                <Text style={styles.statLabel}>Total</Text>
              </View>
            </View>
          </View>
        )}

        {/* Daily Challenge */}
        {challenge && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Daily Challenge</Text>
            <View style={styles.challengeCard}>
              <View style={styles.challengeHeader}>
                <View
                  style={[
                    styles.challengeIconContainer,
                    challenge.completed && styles.challengeIconCompleted,
                  ]}
                >
                  <Ionicons
                    name={getChallengeIcon(challenge.type) as any}
                    size={32}
                    color={challenge.completed ? '#00ff00' : '#fff'}
                  />
                </View>
                <View style={styles.challengeInfo}>
                  <Text style={styles.challengeTitle}>{challenge.title}</Text>
                  <Text style={styles.challengeDescription}>
                    {challenge.description}
                  </Text>
                </View>
                {challenge.completed && (
                  <View style={styles.completedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color="#00ff00" />
                  </View>
                )}
              </View>

              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        width: `${challenge.progressPercentage}%`,
                        backgroundColor: challenge.completed ? '#00ff00' : '#00aaff',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {challenge.progress} / {challenge.target}
                </Text>
              </View>

              <View style={styles.rewardContainer}>
                <Ionicons name="gift" size={16} color="#ffaa00" />
                <Text style={styles.rewardText}>Reward: {challenge.reward}</Text>
              </View>

              {!challenge.completed && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => {
                    if (challenge.type === 'CREATE') {
                      navigation.navigate('CreateDebate' as never);
                    } else if (challenge.type === 'PARTICIPATE') {
                      navigation.navigate('Debates' as never);
                    } else {
                      navigation.navigate('Home' as never);
                    }
                  }}
                >
                  <Text style={styles.actionButtonText}>
                    {challenge.type === 'CREATE'
                      ? 'Create Debate'
                      : challenge.type === 'PARTICIPATE'
                      ? 'Find Debates'
                      : 'Get Started'}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#000" />
                </TouchableOpacity>
              )}
            </View>
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
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 16,
  },
  streaksGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  streakCard: {
    flex: 1,
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  streakValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  streakLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  streakSubtext: {
    fontSize: 12,
    color: '#888',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  challengeCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  challengeIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  challengeIconCompleted: {
    backgroundColor: '#00ff0020',
  },
  challengeInfo: {
    flex: 1,
  },
  challengeTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  challengeDescription: {
    fontSize: 14,
    color: '#888',
  },
  completedBadge: {
    marginLeft: 8,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#222',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#888',
    textAlign: 'right',
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  rewardText: {
    fontSize: 14,
    color: '#ffaa00',
    fontWeight: '500',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});







