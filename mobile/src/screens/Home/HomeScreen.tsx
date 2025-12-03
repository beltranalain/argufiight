import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { debatesAPI, Debate } from '../../services/debatesAPI';
import DebateCard from '../../components/DebateCard';
import FilterBar from '../../components/FilterBar';
import QuickActions from '../../components/QuickActions';
import { DebateCardSkeleton } from '../../components/LoadingSkeleton';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { haptics } from '../../utils/haptics';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [debates, setDebates] = useState<Debate[]>([]);
  const [allDebates, setAllDebates] = useState<Debate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  const loadDebates = async (page: number = 1) => {
    try {
      const result = await debatesAPI.getTrendingDebates(page, itemsPerPage);
      const data = result.debates || [];
      console.log('Loaded debates:', data.length, 'Page:', page, 'Total:', result.total);
      setAllDebates(data);
      setTotalPages(result.totalPages || 1);
      setTotalItems(result.total || data.length);
      applyFilters(data);
    } catch (error: any) {
      console.error('Failed to load debates:', error);
      console.error('Error details:', error.response?.data || error.message);
      setAllDebates([]);
      setDebates([]);
      setTotalPages(1);
      setTotalItems(0);
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
  }, []);

  useEffect(() => {
    applyFilters(allDebates);
  }, [selectedCategory, selectedStatus, searchQuery, allDebates]);

  useEffect(() => {
    loadDebates();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    haptics.light();
    loadDebates(currentPage);
  };

  const handlePageChange = (page: number) => {
    haptics.selection();
    setCurrentPage(page);
    setLoading(true);
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
        <View style={styles.headerSection}>
          <View>
            <Text style={styles.title}>The Arena</Text>
            <Text style={styles.subtitle}>
              Welcome{user ? `, ${user.username}` : ''}!
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        {user && <QuickActions />}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {debates.length > 0 ? 'Trending Debates' : 'All Debates'}
          </Text>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search debates..."
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
            title="No debates yet"
            message="Be the first to start a debate!"
            actionLabel="Create Debate"
            onAction={() => navigation.navigate('CreateDebate' as never)}
          />
        ) : (
          <>
            {debates.map((debate) => (
              <DebateCard
                key={debate.id}
                debate={debate}
                onPress={() => {
                  haptics.medium();
                  handleDebatePress(debate);
                }}
              />
            ))}
            {totalPages > 1 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
                loading={loading}
                itemsPerPage={itemsPerPage}
                totalItems={totalItems}
              />
            )}
          </>
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
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  headerText: {
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
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
