import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { debatesAPI, Debate } from '../../services/debatesAPI';
import DebateCard from '../../components/DebateCard';
import FilterBar from '../../components/FilterBar';
import { DebateCardSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function DebatesScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [allDebates, setAllDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  const loadDebates = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const response = await debatesAPI.getDebates({ userId: user.id });
      // API returns { debates: Debate[], total, page, totalPages } or array
      const debates = response?.debates || (Array.isArray(response) ? response : []);
      console.log('Loaded user debates:', debates?.length || 0, 'for user:', user.id);
      if (Array.isArray(debates)) {
        setAllDebates(debates);
        applyFilters(debates);
      } else {
        console.warn('Debates is not an array:', debates);
        setAllDebates([]);
        setDebates([]);
      }
    } catch (error: any) {
      console.error('Failed to load debates:', error);
      console.error('Error details:', error.response?.data || error.message || error);
      setAllDebates([]);
      setDebates([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const applyFilters = (debatesToFilter: Debate[]) => {
    let filtered = [...debatesToFilter];

    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter((d) => d.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'ALL') {
      filtered = filtered.filter((d) => d.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (d) =>
          d.topic.toLowerCase().includes(query) ||
          d.description?.toLowerCase().includes(query)
      );
    }

    setDebates(filtered);
  };

  useEffect(() => {
    loadDebates();
  }, [user]);

  useEffect(() => {
    applyFilters(allDebates);
  }, [selectedCategory, selectedStatus, searchQuery, allDebates]);

  const onRefresh = () => {
    setRefreshing(true);
    loadDebates();
  };

  const handleDebatePress = (debate: Debate) => {
    navigation.navigate('DebateDetail' as never, { debateId: debate.id });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <DebateCardSkeleton count={3} />
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
        <Text style={styles.title}>Your Debates</Text>
        <Text style={styles.subtitle}>Active and past debates</Text>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search your debates..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Bar */}
        <FilterBar
          selectedCategory={selectedCategory}
          selectedStatus={selectedStatus}
          onCategoryChange={setSelectedCategory}
          onStatusChange={setSelectedStatus}
        />

        {debates.length === 0 ? (
          <EmptyState
            icon="chatbubbles-outline"
            title="No active debates"
            message="You don't have any active debates yet. Create one to get started!"
            actionLabel="Create Debate"
            onAction={() => navigation.navigate('CreateDebate' as never)}
          />
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 16,
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
});
