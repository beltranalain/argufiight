import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from '../../utils/dateUtils';
import api from '../../services/api';

interface Activity {
  id: string;
  type: string;
  userId: string;
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  debateId: string;
  debate: {
    id: string;
    topic: string;
    category: string;
  };
  content?: string;
  winnerId?: string;
  timestamp: string;
}

export default function ActivityScreen() {
  const navigation = useNavigation();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'debates' | 'comments' | 'likes'>('all');

  const loadActivity = async () => {
    try {
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('type', filter);
      params.append('limit', '50');

      const response = await api.get(`/activity?${params.toString()}`);
      setActivities(response.data.activities || []);
    } catch (error: any) {
      console.error('Failed to load activity:', error);
      setActivities([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadActivity();
    // Refresh every 30 seconds
    const interval = setInterval(loadActivity, 30000);
    return () => clearInterval(interval);
  }, [filter]);

  const onRefresh = () => {
    setRefreshing(true);
    loadActivity();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'DEBATE_CREATED':
        return 'add-circle';
      case 'COMMENT_ADDED':
        return 'chatbubble';
      case 'DEBATE_LIKED':
        return 'heart';
      case 'DEBATE_COMPLETED':
        return 'trophy';
      default:
        return 'ellipse';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'DEBATE_CREATED':
        return '#00aaff';
      case 'COMMENT_ADDED':
        return '#00ff00';
      case 'DEBATE_LIKED':
        return '#ff0000';
      case 'DEBATE_COMPLETED':
        return '#ffaa00';
      default:
        return '#888';
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'DEBATE_CREATED':
        return `created a new debate`;
      case 'COMMENT_ADDED':
        return `commented on`;
      case 'DEBATE_LIKED':
        return `liked`;
      case 'DEBATE_COMPLETED':
        return activity.winnerId === activity.userId
          ? `won the debate`
          : `completed a debate`;
      default:
        return 'did something';
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
    <View style={styles.container}>
      {/* Filter Tabs */}
      <View style={styles.filterTabs}>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'all' && styles.filterTabActive]}
          onPress={() => setFilter('all')}
        >
          <Text
            style={[styles.filterTabText, filter === 'all' && styles.filterTabTextActive]}
          >
            All
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'debates' && styles.filterTabActive]}
          onPress={() => setFilter('debates')}
        >
          <Text
            style={[styles.filterTabText, filter === 'debates' && styles.filterTabTextActive]}
          >
            Debates
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'comments' && styles.filterTabActive]}
          onPress={() => setFilter('comments')}
        >
          <Text
            style={[styles.filterTabText, filter === 'comments' && styles.filterTabTextActive]}
          >
            Comments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterTab, filter === 'likes' && styles.filterTabActive]}
          onPress={() => setFilter('likes')}
        >
          <Text
            style={[styles.filterTabText, filter === 'likes' && styles.filterTabTextActive]}
          >
            Likes
          </Text>
        </TouchableOpacity>
      </View>

      {/* Activity Feed */}
      <ScrollView
        style={styles.feed}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
        }
      >
        {activities.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="time-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No activity yet</Text>
            <Text style={styles.emptySubtext}>
              Follow users to see their activity in your feed
            </Text>
          </View>
        ) : (
          activities.map((activity) => (
            <TouchableOpacity
              key={activity.id}
              style={styles.activityCard}
              onPress={() =>
                navigation.navigate('DebateDetail' as never, {
                  debateId: activity.debateId,
                })
              }
            >
              <View style={styles.activityHeader}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: `${getActivityColor(activity.type)}20` },
                  ]}
                >
                  <Ionicons
                    name={getActivityIcon(activity.type) as any}
                    size={20}
                    color={getActivityColor(activity.type)}
                  />
                </View>
                <View style={styles.activityContent}>
                  <View style={styles.activityUserRow}>
                    <TouchableOpacity
                      onPress={() =>
                        navigation.navigate('UserProfile' as never, {
                          userId: activity.userId,
                        })
                      }
                    >
                      <Text style={styles.username}>{activity.user.username}</Text>
                    </TouchableOpacity>
                    <Text style={styles.activityText}> {getActivityText(activity)}</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('DebateDetail' as never, {
                        debateId: activity.debateId,
                      })
                    }
                  >
                    <Text style={styles.debateTopic} numberOfLines={2}>
                      {activity.debate.topic}
                    </Text>
                  </TouchableOpacity>
                  {activity.content && (
                    <Text style={styles.commentPreview} numberOfLines={2}>
                      "{activity.content}"
                    </Text>
                  )}
                  <Text style={styles.timestamp}>
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
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
  filterTabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  filterTabText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  filterTabTextActive: {
    color: '#000',
  },
  feed: {
    flex: 1,
  },
  activityCard: {
    backgroundColor: '#111',
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    padding: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityContent: {
    flex: 1,
  },
  activityUserRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  activityText: {
    fontSize: 14,
    color: '#888',
  },
  debateTopic: {
    fontSize: 15,
    fontWeight: '600',
    color: '#00aaff',
    marginTop: 4,
    marginBottom: 4,
  },
  commentPreview: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 4,
  },
  timestamp: {
    fontSize: 11,
    color: '#666',
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
    marginTop: 8,
  },
});

