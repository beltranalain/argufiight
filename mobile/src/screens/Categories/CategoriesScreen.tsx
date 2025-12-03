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

interface CategoryStat {
  category: string;
  total: number;
  active: number;
  completed: number;
  waiting: number;
  engagement: {
    likes: number;
    comments: number;
    total: number;
  };
}

export default function CategoriesScreen() {
  const navigation = useNavigation();
  const [categories, setCategories] = useState<CategoryStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCategories = async () => {
    try {
      const response = await api.get('/debates/categories');
      setCategories(response.data || []);
    } catch (error: any) {
      console.error('Failed to load categories:', error);
      setCategories([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCategories();
  };

  const handleCategoryPress = (category: string) => {
    // Navigate to debates filtered by category
    navigation.navigate('Home' as never);
    // In a full implementation, you'd pass the category filter
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'SPORTS':
        return '🏀';
      case 'POLITICS':
        return '🏛️';
      case 'TECH':
        return '💻';
      case 'ENTERTAINMENT':
        return '🎬';
      case 'SCIENCE':
        return '🔬';
      default:
        return '📋';
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
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#fff" />
      }
    >
      <View style={styles.content}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>Explore debates by category</Text>

        {categories.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No categories available</Text>
          </View>
        ) : (
          categories.map((category) => (
            <TouchableOpacity
              key={category.category}
              style={styles.categoryCard}
              onPress={() => handleCategoryPress(category.category)}
            >
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryIcon}>{getCategoryIcon(category.category)}</Text>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.category}</Text>
                  <Text style={styles.categoryTotal}>
                    {category.total} {category.total === 1 ? 'debate' : 'debates'}
                  </Text>
                </View>
              </View>

              <View style={styles.categoryStats}>
                <View style={styles.statItem}>
                  <Ionicons name="play-circle" size={16} color="#00ff00" />
                  <Text style={styles.statText}>{category.active} Active</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#00aaff" />
                  <Text style={styles.statText}>{category.completed} Completed</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time" size={16} color="#ffaa00" />
                  <Text style={styles.statText}>{category.waiting} Waiting</Text>
                </View>
              </View>

              <View style={styles.engagementBar}>
                <View style={styles.engagementItem}>
                  <Ionicons name="heart" size={14} color="#ff0000" />
                  <Text style={styles.engagementText}>
                    {category.engagement.likes.toLocaleString()}
                  </Text>
                </View>
                <View style={styles.engagementItem}>
                  <Ionicons name="chatbubble" size={14} color="#00aaff" />
                  <Text style={styles.engagementText}>
                    {category.engagement.comments.toLocaleString()}
                  </Text>
                </View>
              </View>
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
  categoryCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  categoryTotal: {
    fontSize: 14,
    color: '#888',
  },
  categoryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#333',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: '#888',
  },
  engagementBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  engagementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  engagementText: {
    fontSize: 12,
    color: '#666',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});


