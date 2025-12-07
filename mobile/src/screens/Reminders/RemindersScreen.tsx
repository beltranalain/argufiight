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
import api from '../../services/api';

interface Reminder {
  debateId: string;
  topic: string;
  currentRound: number;
  totalRounds: number;
  roundDeadline: string;
  hoursUntilDeadline: number;
  isUserTurn: boolean;
  opponent?: string;
}

export default function RemindersScreen() {
  const navigation = useNavigation();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadReminders = async () => {
    try {
      const response = await api.get('/debates/reminders');
      setReminders(response.data.reminders || []);
    } catch (error: any) {
      console.error('Failed to load reminders:', error);
      setReminders([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadReminders();
    // Refresh every 5 minutes
    const interval = setInterval(loadReminders, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadReminders();
  };

  const getUrgencyColor = (hours: number) => {
    if (hours < 2) return '#ff0000';
    if (hours < 6) return '#ffaa00';
    return '#00aaff';
  };

  const getUrgencyText = (hours: number) => {
    if (hours < 1) return 'Less than 1 hour';
    if (hours < 2) return 'Less than 2 hours';
    if (hours < 6) return 'Less than 6 hours';
    return `${Math.floor(hours)} hours`;
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
        <Text style={styles.title}>Upcoming Deadlines</Text>
        <Text style={styles.subtitle}>Debates requiring your attention</Text>

        {reminders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#666" />
            <Text style={styles.emptyText}>No upcoming deadlines</Text>
            <Text style={styles.emptySubtext}>
              You're all caught up! Check back later for new reminders.
            </Text>
          </View>
        ) : (
          reminders.map((reminder) => (
            <TouchableOpacity
              key={reminder.debateId}
              style={styles.reminderCard}
              onPress={() =>
                navigation.navigate('DebateDetail' as never, {
                  debateId: reminder.debateId,
                })
              }
            >
              <View style={styles.reminderHeader}>
                <View style={styles.reminderTitleRow}>
                  <Text style={styles.reminderTopic} numberOfLines={2}>
                    {reminder.topic}
                  </Text>
                  {reminder.isUserTurn && (
                    <View style={styles.turnBadge}>
                      <Text style={styles.turnBadgeText}>Your Turn</Text>
                    </View>
                  )}
                </View>
                <View
                  style={[
                    styles.urgencyBadge,
                    { backgroundColor: getUrgencyColor(reminder.hoursUntilDeadline) },
                  ]}
                >
                  <Ionicons name="time" size={14} color="#fff" />
                  <Text style={styles.urgencyText}>
                    {getUrgencyText(reminder.hoursUntilDeadline)}
                  </Text>
                </View>
              </View>

              <View style={styles.reminderInfo}>
                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={16} color="#888" />
                  <Text style={styles.infoText}>
                    vs. {reminder.opponent || 'Waiting...'}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="repeat-outline" size={16} color="#888" />
                  <Text style={styles.infoText}>
                    Round {reminder.currentRound} / {reminder.totalRounds}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Ionicons name="calendar-outline" size={16} color="#888" />
                  <Text style={styles.infoText}>
                    {new Date(reminder.roundDeadline).toLocaleString()}
                  </Text>
                </View>
              </View>

              {reminder.isUserTurn && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() =>
                    navigation.navigate('DebateDetail' as never, {
                      debateId: reminder.debateId,
                    })
                  }
                >
                  <Text style={styles.actionButtonText}>Submit Argument</Text>
                  <Ionicons name="arrow-forward" size={16} color="#000" />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
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
  reminderCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  reminderHeader: {
    marginBottom: 12,
  },
  reminderTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  reminderTopic: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    flex: 1,
    marginRight: 8,
  },
  turnBadge: {
    backgroundColor: '#00ff00',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  turnBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 4,
  },
  urgencyText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  reminderInfo: {
    gap: 8,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#888',
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
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




