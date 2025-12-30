import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface PreviewData {
  topic: string;
  description?: string;
  category: string;
  challengerPosition: 'FOR' | 'AGAINST';
  tags?: string[];
}

export default function PreviewDebateScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { currentScheme } = useTheme();
  const { previewData, onPublish } = route.params as {
    previewData: PreviewData;
    onPublish: () => void;
  };

  const themeStyles = getThemeStyles(currentScheme);

  const handlePublish = () => {
    onPublish();
    navigation.goBack();
  };

  return (
    <ScrollView style={themeStyles.container}>
      <View style={themeStyles.content}>
        <View style={themeStyles.header}>
          <Text style={themeStyles.title}>Preview Debate</Text>
          <Text style={themeStyles.subtitle}>Review before publishing</Text>
        </View>

        <View style={themeStyles.previewCard}>
          <View style={themeStyles.previewHeader}>
            <Text style={themeStyles.category}>{previewData.category}</Text>
            <View style={themeStyles.statusBadge}>
              <Text style={themeStyles.statusText}>WAITING</Text>
            </View>
          </View>

          <Text style={themeStyles.topic}>{previewData.topic}</Text>

          {previewData.description && (
            <Text style={themeStyles.description}>{previewData.description}</Text>
          )}

          {previewData.tags && previewData.tags.length > 0 && (
            <View style={themeStyles.tagsContainer}>
              {previewData.tags.map((tag, index) => (
                <View key={index} style={themeStyles.tagChip}>
                  <Text style={themeStyles.tagText}>#{tag}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={themeStyles.positionSection}>
            <Text style={themeStyles.positionLabel}>Your Position:</Text>
            <View style={themeStyles.positionBadge}>
              <Text style={themeStyles.positionText}>{previewData.challengerPosition}</Text>
            </View>
          </View>
        </View>

        <View style={themeStyles.actions}>
          <TouchableOpacity
            style={themeStyles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={themeStyles.cancelButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={themeStyles.publishButton}
            onPress={handlePublish}
          >
            <Ionicons name="checkmark-circle" size={20} color="#000" />
            <Text style={themeStyles.publishButtonText}>Publish Debate</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const getThemeStyles = (scheme: 'light' | 'dark') => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: scheme === 'dark' ? '#000' : '#f0f0f0',
  },
  content: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: scheme === 'dark' ? '#fff' : '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: scheme === 'dark' ? '#888' : '#555',
  },
  previewCard: {
    backgroundColor: scheme === 'dark' ? '#111' : '#e0e0e0',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: scheme === 'dark' ? '#333' : '#ccc',
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  category: {
    fontSize: 12,
    color: scheme === 'dark' ? '#888' : '#555',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#ffaa00',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    color: '#000',
    fontWeight: '600',
  },
  topic: {
    fontSize: 24,
    fontWeight: 'bold',
    color: scheme === 'dark' ? '#fff' : '#000',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: scheme === 'dark' ? '#ccc' : '#333',
    lineHeight: 24,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    backgroundColor: scheme === 'dark' ? '#222' : '#ccc',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  tagText: {
    fontSize: 12,
    color: scheme === 'dark' ? '#888' : '#555',
    fontWeight: '600',
  },
  positionSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: scheme === 'dark' ? '#333' : '#ccc',
  },
  positionLabel: {
    fontSize: 14,
    color: scheme === 'dark' ? '#888' : '#555',
    marginBottom: 8,
  },
  positionBadge: {
    backgroundColor: scheme === 'dark' ? '#222' : '#ccc',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  positionText: {
    fontSize: 14,
    color: scheme === 'dark' ? '#fff' : '#000',
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: scheme === 'dark' ? '#111' : '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: scheme === 'dark' ? '#333' : '#ccc',
  },
  cancelButtonText: {
    color: scheme === 'dark' ? '#fff' : '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  publishButton: {
    flex: 2,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  publishButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
});











