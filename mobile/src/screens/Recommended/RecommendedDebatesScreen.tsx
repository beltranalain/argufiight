import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { debatesAPI, Debate } from '../../services/debatesAPI';
import DebateCard from '../../components/DebateCard';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function RecommendedDebatesScreen() {
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDebates = async () => {
    if (!isAuthenticated) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      // Try advanced recommendations first, fallback to basic
      try {
        const response = await api.get('/debates/recommendations/advanced?limit=20');
        setDebates(response.data || []);
      } catch (error) {
        // Fallback to basic recommendations
        const data = await debatesAPI.getRecommendedDebates();
        setDebates(data || []);
      }
    } catch (error: any) {
      console.error('Failed to load recommended debates:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load recommended debates.');
      setDebates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDebates();
  }, [isAuthenticated]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDebates();
  };

  const handleDebatePress = (debate: Debate) => {
    navigation.navigate('DebateDetail' as never, { debateId: debate.id });
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
        <Text style={styles.title}>Recommended</Text>
        <Text style={styles.subtitle}>Debates tailored for you</Text>

        {!isAuthenticated ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Please log in to get personalized recommendations.</Text>
          </View>
        ) : debates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No recommendations available.</Text>
            <Text style={styles.emptySubtext}>
              Participate in more debates to help us find more for you!
            </Text>
          </View>
        ) : (
          debates.map((debate) => (
            <View key={debate.id}>
              {debate.reason && (
                <View style={styles.recommendationBadge}>
                  <Text style={styles.recommendationText}>{debate.reason}</Text>
                </View>
              )}
              <DebateCard
                debate={debate}
                onPress={() => handleDebatePress(debate)}
              />
            </View>
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
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#444',
    textAlign: 'center',
  },
  recommendationBadge: {
    backgroundColor: '#00aaff20',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#00aaff',
  },
  recommendationText: {
    fontSize: 12,
    color: '#00aaff',
    fontStyle: 'italic',
  },
});

