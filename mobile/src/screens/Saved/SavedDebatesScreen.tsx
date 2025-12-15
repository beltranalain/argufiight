import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { debatesAPI, Debate } from '../../services/debatesAPI';
import DebateCard from '../../components/DebateCard';

export default function SavedDebatesScreen() {
  const navigation = useNavigation();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDebates = async () => {
    try {
      const data = await debatesAPI.getSavedDebates();
      setDebates(data || []);
    } catch (error: any) {
      console.error('Failed to load saved debates:', error);
      setDebates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDebates();
  }, []);

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
        <Text style={styles.title}>Saved Debates</Text>
        <Text style={styles.subtitle}>Your favorite debates</Text>

        {debates.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No saved debates yet.</Text>
            <Text style={styles.emptySubtext}>
              Save debates you want to revisit later!
            </Text>
          </View>
        ) : (
          debates.map((debate) => (
            <DebateCard
              key={debate.id}
              debate={debate}
              onPress={() => handleDebatePress(debate)}
            />
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
});







