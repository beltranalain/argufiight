import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

interface StatsData {
  overview: {
    totalDebates: number;
    activeDebates: number;
    completedDebates: number;
    waitingDebates: number;
    totalUsers: number;
    recentActivity: number;
  };
  engagement: {
    totalStatements: number;
    totalLikes: number;
    totalComments: number;
    avgStatementsPerDebate: string;
    avgLikesPerDebate: string;
    avgCommentsPerDebate: string;
  };
  breakdowns: {
    categories: Array<{
      category: string;
      count: number;
      percentage: string;
    }>;
    statuses: Array<{
      status: string;
      count: number;
      percentage: string;
    }>;
  };
}

export default function StatsScreen() {
  const [data, setData] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const response = await api.get('/debates/stats');
      setData(response.data);
    } catch (error: any) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadStats();
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
        <Text style={styles.errorText}>Failed to load statistics</Text>
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
        <Text style={styles.title}>Platform Statistics</Text>
        <Text style={styles.subtitle}>Real-time debate platform metrics</Text>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Ionicons name="chatbubbles" size={24} color="#00aaff" />
              <Text style={styles.statValue}>
                {data.overview.totalDebates.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Total Debates</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="play-circle" size={24} color="#00ff00" />
              <Text style={styles.statValue}>
                {data.overview.activeDebates.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="checkmark-circle" size={24} color="#00aaff" />
              <Text style={styles.statValue}>
                {data.overview.completedDebates.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Completed</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="people" size={24} color="#fff" />
              <Text style={styles.statValue}>
                {data.overview.totalUsers.toLocaleString()}
              </Text>
              <Text style={styles.statLabel}>Users</Text>
            </View>
          </View>
        </View>

        {/* Engagement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engagement</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="document-text" size={20} color="#00aaff" />
              <Text style={styles.infoLabel}>Total Arguments</Text>
              <Text style={styles.infoValue}>
                {data.engagement.totalStatements.toLocaleString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="heart" size={20} color="#ff0000" />
              <Text style={styles.infoLabel}>Total Likes</Text>
              <Text style={styles.infoValue}>
                {data.engagement.totalLikes.toLocaleString()}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Ionicons name="chatbubble" size={20} color="#00aaff" />
              <Text style={styles.infoLabel}>Total Comments</Text>
              <Text style={styles.infoValue}>
                {data.engagement.totalComments.toLocaleString()}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Avg Arguments/Debate</Text>
              <Text style={styles.infoValue}>
                {data.engagement.avgStatementsPerDebate}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Avg Likes/Debate</Text>
              <Text style={styles.infoValue}>
                {data.engagement.avgLikesPerDebate}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Avg Comments/Debate</Text>
              <Text style={styles.infoValue}>
                {data.engagement.avgCommentsPerDebate}
              </Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        {data.breakdowns.categories.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Category</Text>
            {data.breakdowns.categories
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <View key={item.category} style={styles.breakdownRow}>
                  <View style={styles.breakdownHeader}>
                    <Text style={styles.breakdownLabel}>{item.category}</Text>
                    <Text style={styles.breakdownValue}>
                      {item.count} ({item.percentage}%)
                    </Text>
                  </View>
                  <View style={styles.breakdownBar}>
                    <View
                      style={[
                        styles.breakdownBarFill,
                        { width: `${item.percentage}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Status Breakdown */}
        {data.breakdowns.statuses.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Status</Text>
            {data.breakdowns.statuses
              .sort((a, b) => b.count - a.count)
              .map((item) => (
                <View key={item.status} style={styles.breakdownRow}>
                  <View style={styles.breakdownHeader}>
                    <Text style={styles.breakdownLabel}>{item.status}</Text>
                    <Text style={styles.breakdownValue}>
                      {item.count} ({item.percentage}%)
                    </Text>
                  </View>
                  <View style={styles.breakdownBar}>
                    <View
                      style={[
                        styles.breakdownBarFill,
                        { width: `${item.percentage}%` },
                      ]}
                    />
                  </View>
                </View>
              ))}
          </View>
        )}

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Ionicons name="time" size={20} color="#00ff00" />
              <Text style={styles.infoLabel}>Debates Created (24h)</Text>
              <Text style={styles.infoValue}>
                {data.overview.recentActivity.toLocaleString()}
              </Text>
            </View>
          </View>
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
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#888',
  },
  infoCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
    flex: 1,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
  breakdownRow: {
    marginBottom: 16,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  breakdownLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
  },
  breakdownValue: {
    fontSize: 14,
    color: '#888',
  },
  breakdownBar: {
    height: 6,
    backgroundColor: '#222',
    borderRadius: 3,
    overflow: 'hidden',
  },
  breakdownBarFill: {
    height: '100%',
    backgroundColor: '#00aaff',
    borderRadius: 3,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});
