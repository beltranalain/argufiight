import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

interface QuickActionsData {
  activeDebates: number;
  waitingDebates: number;
  savedDebates: number;
  unreadNotifications: number;
  upcomingDeadlines: number;
}

export default function QuickActions() {
  const navigation = useNavigation();
  const [data, setData] = useState<QuickActionsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuickActions();
    // Refresh every 30 seconds
    const interval = setInterval(loadQuickActions, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadQuickActions = async () => {
    try {
      // Check if user is authenticated first
      const token = await AsyncStorage.getItem('auth_token');
      if (!token) {
        // Not logged in - show empty data
        setData({
          activeDebates: 0,
          waitingDebates: 0,
          savedDebates: 0,
          unreadNotifications: 0,
          upcomingDeadlines: 0,
        });
        setLoading(false);
        return;
      }

      const response = await api.get('/debates/quick-actions');
      setData(response.data);
    } catch (error: any) {
      // Silently handle 401 (unauthorized) - user just isn't logged in
      if (error.response?.status === 401) {
        setData({
          activeDebates: 0,
          waitingDebates: 0,
          savedDebates: 0,
          unreadNotifications: 0,
          upcomingDeadlines: 0,
        });
      } else {
        // Only log non-auth errors
        console.error('Failed to load quick actions:', error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#fff" />
      </View>
    );
  }

  const actions = [
    {
      id: 'active',
      label: 'Active',
      count: data.activeDebates,
      icon: 'play-circle',
      color: '#00ff00',
      onPress: () => navigation.navigate('Debates' as never),
    },
    {
      id: 'waiting',
      label: 'Waiting',
      count: data.waitingDebates,
      icon: 'time',
      color: '#ffaa00',
      onPress: () => navigation.navigate('Debates' as never),
    },
    {
      id: 'saved',
      label: 'Saved',
      count: data.savedDebates,
      icon: 'bookmark',
      color: '#00aaff',
      onPress: () => navigation.navigate('SavedDebates' as never),
    },
    {
      id: 'deadlines',
      label: 'Deadlines',
      count: data.upcomingDeadlines,
      icon: 'notifications',
      color: '#ff0000',
      onPress: () => navigation.navigate('Reminders' as never),
    },
    {
      id: 'tournaments',
      label: 'Tournaments',
      count: 0, // Could fetch tournament count if needed
      icon: 'trophy',
      color: '#6b46c1',
      onPress: () => navigation.navigate('Tournaments' as never),
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((action) => (
        <TouchableOpacity
          key={action.id}
          style={styles.actionButton}
          onPress={action.onPress}
        >
          <View style={[styles.iconContainer, { backgroundColor: `${action.color}20` }]}>
            <Ionicons name={action.icon as any} size={20} color={action.color} />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.countText}>{action.count}</Text>
            <Text style={styles.labelText}>{action.label}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    paddingHorizontal: 8,
    backgroundColor: '#111',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    justifyContent: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'flex-start',
  },
  countText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  labelText: {
    fontSize: 10,
    color: '#888',
  },
});


