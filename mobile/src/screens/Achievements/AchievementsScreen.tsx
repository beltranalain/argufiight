import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import api from '../../services/api';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string;
}

interface AchievementsData {
  achievements: Achievement[];
  totalAchievements: number;
  unlockedCount: number;
}

export default function AchievementsScreen() {
  const [data, setData] = useState<AchievementsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAchievements = async () => {
    try {
      const response = await api.get('/users/achievements');
      setData(response.data);
    } catch (error: any) {
      console.error('Failed to load achievements:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAchievements();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAchievements();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load achievements</Text>
      </View>
    );
  }

  const unlockedAchievements = data.achievements.filter((a) => a.unlocked);
  const lockedAchievements = data.achievements.filter((a) => !a.unlocked);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>Achievements</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${(data.unlockedCount / data.totalAchievements) * 100}%`,
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {data.unlockedCount} / {data.totalAchievements} unlocked
        </Text>

        {/* Unlocked Achievements */}
        {unlockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Unlocked ({unlockedAchievements.length})</Text>
            {unlockedAchievements.map((achievement) => (
              <View key={achievement.id} style={styles.achievementCard}>
                <Text style={styles.achievementIcon}>{achievement.icon}</Text>
                <View style={styles.achievementInfo}>
                  <Text style={styles.achievementName}>{achievement.name}</Text>
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                </View>
                <View style={styles.unlockedBadge}>
                  <Text style={styles.unlockedText}>✓</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Locked Achievements */}
        {lockedAchievements.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Locked ({lockedAchievements.length})</Text>
            {lockedAchievements.map((achievement) => (
              <View key={achievement.id} style={[styles.achievementCard, styles.lockedCard]}>
                <Text style={[styles.achievementIcon, styles.lockedIcon]}>
                  {achievement.icon}
                </Text>
                <View style={styles.achievementInfo}>
                  <Text style={[styles.achievementName, styles.lockedText]}>
                    {achievement.name}
                  </Text>
                  <Text style={[styles.achievementDescription, styles.lockedText]}>
                    {achievement.description}
                  </Text>
                </View>
                <View style={styles.lockedBadge}>
                  <Text style={styles.lockedBadgeText}>🔒</Text>
                </View>
              </View>
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
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#111',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00aaff',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
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
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  lockedCard: {
    opacity: 0.6,
  },
  achievementIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  lockedIcon: {
    opacity: 0.5,
  },
  achievementInfo: {
    flex: 1,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    color: '#888',
  },
  lockedText: {
    color: '#666',
  },
  unlockedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00aaff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unlockedText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lockedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedBadgeText: {
    fontSize: 16,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});



