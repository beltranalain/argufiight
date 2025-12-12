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

interface AnalyticsData {
  overview: {
    totalDebates: number;
    activeDebates: number;
    completedDebates: number;
    wonDebates: number;
    winRate: string;
    recentActivity: number;
  };
  engagement: {
    totalLikes: number;
    totalComments: number;
    totalStatements: number;
    averageLikesPerDebate: string;
    averageCommentsPerDebate: string;
  };
  categoryBreakdown: Record<string, number>;
  winRateByCategory: Array<{
    category: string;
    won: number;
    total: number;
    winRate: string;
  }>;
  performance: {
    averageDurationMs: number;
    averageDurationDays: string;
  };
}

export default function AnalyticsScreen() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadAnalytics = async () => {
    try {
      const response = await api.get('/debates/analytics');
      setData(response.data);
    } catch (error: any) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadAnalytics();
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
        <Text style={styles.errorText}>Failed to load analytics</Text>
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
        <Text style={styles.title}>Your Analytics</Text>
        <Text style={styles.subtitle}>Performance insights</Text>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.overview.totalDebates}</Text>
              <Text style={styles.statLabel}>Total Debates</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.overview.wonDebates}</Text>
              <Text style={styles.statLabel}>Won</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.overview.winRate}%</Text>
              <Text style={styles.statLabel}>Win Rate</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{data.overview.activeDebates}</Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
        </View>

        {/* Engagement */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Engagement</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Likes</Text>
              <Text style={styles.infoValue}>{data.engagement.totalLikes.toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Comments</Text>
              <Text style={styles.infoValue}>{data.engagement.totalComments.toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Total Arguments</Text>
              <Text style={styles.infoValue}>{data.engagement.totalStatements.toLocaleString()}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Avg Likes/Debate</Text>
              <Text style={styles.infoValue}>{data.engagement.averageLikesPerDebate}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Avg Comments/Debate</Text>
              <Text style={styles.infoValue}>{data.engagement.averageCommentsPerDebate}</Text>
            </View>
          </View>
        </View>

        {/* Category Breakdown */}
        {Object.keys(data.categoryBreakdown).length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>By Category</Text>
            {Object.entries(data.categoryBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([category, count]) => (
                <View key={category} style={styles.categoryRow}>
                  <Text style={styles.categoryName}>{category}</Text>
                  <Text style={styles.categoryCount}>{count}</Text>
                </View>
              ))}
          </View>
        )}

        {/* Win Rate by Category */}
        {data.winRateByCategory.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Win Rate by Category</Text>
            {data.winRateByCategory.map((item) => (
              <View key={item.category} style={styles.winRateCard}>
                <View style={styles.winRateHeader}>
                  <Text style={styles.winRateCategory}>{item.category}</Text>
                  <Text style={styles.winRateValue}>{item.winRate}%</Text>
                </View>
                <View style={styles.winRateBar}>
                  <View
                    style={[
                      styles.winRateFill,
                      { width: `${parseFloat(item.winRate)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.winRateStats}>
                  {item.won} wins out of {item.total} debates
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Performance */}
        {parseFloat(data.performance.averageDurationDays) > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Avg Debate Duration</Text>
                <Text style={styles.infoValue}>
                  {data.performance.averageDurationDays} days
                </Text>
              </View>
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
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  categoryCount: {
    fontSize: 14,
    color: '#888',
  },
  winRateCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  winRateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  winRateCategory: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  winRateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00aaff',
  },
  winRateBar: {
    height: 6,
    backgroundColor: '#222',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  winRateFill: {
    height: '100%',
    backgroundColor: '#00aaff',
    borderRadius: 3,
  },
  winRateStats: {
    fontSize: 12,
    color: '#666',
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
    textAlign: 'center',
    padding: 20,
  },
});






