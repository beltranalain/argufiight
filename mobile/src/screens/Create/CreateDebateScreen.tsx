import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { debatesAPI, CreateDebateData } from '../../services/debatesAPI';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { draftsAPI, DebateDraft } from '../../services/draftsAPI';
import { tagsAPI, Tag } from '../../services/tagsAPI';

const CATEGORIES = [
  'SPORTS',
  'POLITICS',
  'TECH',
  'ENTERTAINMENT',
  'SCIENCE',
  'OTHER',
] as const;

const POSITIONS = ['FOR', 'AGAINST'] as const;

export default function CreateDebateScreen() {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [topic, setTopic] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('OTHER');
  const [position, setPosition] = useState<typeof POSITIONS[number]>('FOR');
  const [loading, setLoading] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<DebateDraft[]>([]);
  const [showDrafts, setShowDrafts] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    loadTemplates();
    loadDrafts();
    loadTags();
  }, []);

  const loadTags = async () => {
    try {
      const data = await tagsAPI.getTags();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    }
  };

  // Auto-save draft when form changes
  useEffect(() => {
    if (!autoSaveEnabled || !user) return;

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Only auto-save if there's content
    if (topic.trim() || description.trim()) {
      autoSaveTimeoutRef.current = setTimeout(async () => {
        try {
          const draft = await draftsAPI.saveDraft({
            id: currentDraftId || undefined,
            topic: topic.trim(),
            description: description.trim() || undefined,
            category,
            challengerPosition: position,
            totalRounds: 5,
          });
          setCurrentDraftId(draft.id);
        } catch (error) {
          console.error('Auto-save failed:', error);
        }
      }, 2000); // Auto-save after 2 seconds of inactivity
    }

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [topic, description, category, position, currentDraftId, autoSaveEnabled, user]);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/debates/templates');
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Failed to load templates:', error);
    }
  };

  const loadDrafts = async () => {
    if (!user) return;
    try {
      const data = await draftsAPI.getDrafts();
      setDrafts(data);
    } catch (error: any) {
      console.error('Failed to load drafts:', error);
      // Silently fail - drafts are optional
      setDrafts([]);
    }
  };

  const handleLoadDraft = (draft: DebateDraft) => {
    setTopic(draft.topic);
    setDescription(draft.description || '');
    setCategory(draft.category as typeof CATEGORIES[number]);
    setPosition(draft.challengerPosition as typeof POSITIONS[number]);
    setCurrentDraftId(draft.id);
    setShowDrafts(false);
  };

  const handleDeleteDraft = async (draftId: string) => {
    try {
      await draftsAPI.deleteDraft(draftId);
      await loadDrafts();
      if (currentDraftId === draftId) {
        setCurrentDraftId(null);
      }
    } catch (error) {
      console.error('Failed to delete draft:', error);
    }
  };

  const handleUseTemplate = (template: any) => {
    setTopic(template.topic);
    setDescription(template.description || '');
    setCategory(template.category);
    setPosition(template.challengerPosition);
    setShowTemplates(false);
  };

  const handleCreate = async () => {
    if (!topic.trim()) {
      Alert.alert('Error', 'Please enter a debate topic');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'You must be logged in to create a debate');
      return;
    }

    setLoading(true);
    try {
      const data: CreateDebateData = {
        topic: topic.trim(),
        description: description.trim() || undefined,
        category,
        challengerPosition: position,
      };

      const createdDebate = await debatesAPI.createDebate(data);
      
      // Add tags if any selected
      if (selectedTags.length > 0 && createdDebate?.id) {
        try {
          await tagsAPI.addTags(createdDebate.id, selectedTags);
        } catch (error) {
          console.error('Failed to add tags:', error);
          // Don't fail the whole creation if tags fail
        }
      }
      
      // Delete draft if it exists
      if (currentDraftId) {
        try {
          await draftsAPI.deleteDraft(currentDraftId);
        } catch (error) {
          console.error('Failed to delete draft after creation:', error);
        }
      }

      Alert.alert('Success', 'Debate created!', [
        {
          text: 'OK',
          onPress: () => {
            navigation.goBack();
          },
        },
      ]);
    } catch (error: any) {
      console.error('Create debate error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.error || 'Failed to create debate'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
            <View style={styles.titleRow}>
              <View style={styles.titleText}>
                <Text style={styles.title}>Create Debate</Text>
                <Text style={styles.subtitle}>Start a new debate challenge</Text>
                {currentDraftId && (
                  <View style={styles.draftIndicator}>
                    <Ionicons name="save-outline" size={12} color="#00aaff" />
                    <Text style={styles.draftIndicatorText}>Draft saved</Text>
                  </View>
                )}
              </View>
              <View style={styles.headerButtons}>
                <TouchableOpacity
                  style={styles.templateButton}
                  onPress={() => {
                    setShowTemplates(!showTemplates);
                    setShowDrafts(false);
                  }}
                >
                  <Ionicons name="document-text-outline" size={20} color="#fff" />
                  <Text style={styles.templateButtonText}>Templates</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.templateButton}
                  onPress={() => {
                    setShowDrafts(!showDrafts);
                    setShowTemplates(false);
                  }}
                >
                  <Ionicons name="folder-outline" size={20} color="#fff" />
                  <Text style={styles.templateButtonText}>Drafts ({drafts.length})</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Templates */}
            {showTemplates && templates.length > 0 && (
              <View style={styles.templatesContainer}>
                <Text style={styles.templatesTitle}>Choose a Template</Text>
                <ScrollView style={styles.templatesList}>
                  {templates.map((template) => (
                    <TouchableOpacity
                      key={template.id}
                      style={styles.templateCard}
                      onPress={() => handleUseTemplate(template)}
                    >
                      <Text style={styles.templateCategory}>{template.category}</Text>
                      <Text style={styles.templateTopic}>{template.topic}</Text>
                      {template.description && (
                        <Text style={styles.templateDescription} numberOfLines={2}>
                          {template.description}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Drafts */}
            {showDrafts && (
              <View style={styles.templatesContainer}>
                <Text style={styles.templatesTitle}>Your Drafts</Text>
                {drafts.length === 0 ? (
                  <Text style={styles.emptyText}>No drafts yet. Start typing to auto-save!</Text>
                ) : (
                  <ScrollView style={styles.templatesList}>
                    {drafts.map((draft) => (
                      <View key={draft.id} style={styles.draftCard}>
                        <TouchableOpacity
                          style={styles.draftCardContent}
                          onPress={() => handleLoadDraft(draft)}
                        >
                          <View style={styles.draftHeader}>
                            <Text style={styles.draftCategory}>{draft.category}</Text>
                            <Text style={styles.draftDate}>
                              {new Date(draft.updatedAt).toLocaleDateString()}
                            </Text>
                          </View>
                          <Text style={styles.draftTopic} numberOfLines={1}>
                            {draft.topic || 'Untitled Draft'}
                          </Text>
                          {draft.description && (
                            <Text style={styles.draftDescription} numberOfLines={2}>
                              {draft.description}
                            </Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.deleteDraftButton}
                          onPress={() => handleDeleteDraft(draft.id)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#ff0000" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

          <View style={styles.form}>
            <Text style={styles.label}>Topic *</Text>
            <TextInput
              style={styles.input}
              placeholder="What do you want to debate?"
              placeholderTextColor="#666"
              value={topic}
              onChangeText={setTopic}
              multiline
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Add more context about the debate..."
              placeholderTextColor="#666"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Category *</Text>
            <View style={styles.categoryContainer}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryButton,
                    category === cat && styles.categoryButtonActive,
                  ]}
                  onPress={() => setCategory(cat)}
                >
                  <Text
                    style={[
                      styles.categoryButtonText,
                      category === cat && styles.categoryButtonTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Your Position *</Text>
            <View style={styles.positionContainer}>
              {POSITIONS.map((pos) => (
                <TouchableOpacity
                  key={pos}
                  style={[
                    styles.positionButton,
                    position === pos && styles.positionButtonActive,
                  ]}
                  onPress={() => setPosition(pos)}
                >
                  <Text
                    style={[
                      styles.positionButtonText,
                      position === pos && styles.positionButtonTextActive,
                    ]}
                  >
                    {pos}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Tags (Optional)</Text>
            <View style={styles.tagsContainer}>
              {selectedTags.map((tagName) => {
                const tag = tags.find((t) => t.name === tagName);
                return (
                  <TouchableOpacity
                    key={tagName}
                    style={[
                      styles.tagChip,
                      { backgroundColor: tag?.color || '#00aaff' },
                    ]}
                    onPress={() =>
                      setSelectedTags(selectedTags.filter((t) => t !== tagName))
                    }
                  >
                    <Text style={styles.tagChipText}>{tagName}</Text>
                    <Ionicons name="close" size={14} color="#fff" />
                  </TouchableOpacity>
                );
              })}
              {selectedTags.length < 5 && (
                <View style={styles.tagInputContainer}>
                  <TextInput
                    style={styles.tagInput}
                    placeholder="Add tag..."
                    placeholderTextColor="#666"
                    value={tagInput}
                    onChangeText={setTagInput}
                    onSubmitEditing={() => {
                      if (
                        tagInput.trim() &&
                        !selectedTags.includes(tagInput.trim().toLowerCase()) &&
                        selectedTags.length < 5
                      ) {
                        setSelectedTags([
                          ...selectedTags,
                          tagInput.trim().toLowerCase(),
                        ]);
                        setTagInput('');
                      }
                    }}
                  />
                </View>
              )}
            </View>
            {tags.length > 0 && (
              <View style={styles.popularTagsContainer}>
                <Text style={styles.popularTagsLabel}>Popular Tags:</Text>
                <View style={styles.popularTags}>
                  {tags.slice(0, 10).map((tag) => (
                    <TouchableOpacity
                      key={tag.id}
                      style={[
                        styles.popularTag,
                        selectedTags.includes(tag.name) && styles.popularTagSelected,
                        { borderColor: tag.color },
                      ]}
                      onPress={() => {
                        if (selectedTags.includes(tag.name)) {
                          setSelectedTags(selectedTags.filter((t) => t !== tag.name));
                        } else if (selectedTags.length < 5) {
                          setSelectedTags([...selectedTags, tag.name]);
                        }
                      }}
                    >
                      <Text
                        style={[
                          styles.popularTagText,
                          selectedTags.includes(tag.name) && { color: tag.color },
                        ]}
                      >
                        {tag.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.createButton, styles.previewButton]}
                onPress={() => {
                  if (!topic.trim()) return;
                  navigation.navigate('PreviewDebate' as never, {
                    previewData: {
                      topic,
                      description: description.trim() || undefined,
                      category,
                      challengerPosition: position,
                      tags: selectedTags,
                    },
                    onPublish: handleCreate,
                  });
                }}
                disabled={!topic.trim()}
              >
                <Ionicons name="eye-outline" size={20} color={topic.trim() ? '#fff' : '#666'} />
                <Text style={[styles.createButtonText, { color: topic.trim() ? '#fff' : '#666' }]}>
                  Preview
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreate}
                disabled={loading || !topic.trim()}
              >
                {loading ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.createButtonText}>Create Debate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    padding: 20,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 32,
  },
  titleText: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
  },
  templateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#333',
    gap: 6,
  },
  templateButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  templatesContainer: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
    maxHeight: 300,
  },
  templatesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  templatesList: {
    maxHeight: 250,
  },
  templateCard: {
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  templateCategory: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  templateTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  templateDescription: {
    fontSize: 12,
    color: '#888',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
    minHeight: 50,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
  },
  categoryButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  categoryButtonText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  categoryButtonTextActive: {
    color: '#000',
  },
  positionContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  positionButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 8,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  positionButtonActive: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  positionButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  positionButtonTextActive: {
    color: '#000',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  createButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  previewButton: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
  },
  createButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  draftIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  draftIndicatorText: {
    fontSize: 12,
    color: '#00aaff',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  draftCard: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
    alignItems: 'center',
  },
  draftCardContent: {
    flex: 1,
  },
  draftHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  draftCategory: {
    fontSize: 10,
    color: '#666',
    textTransform: 'uppercase',
  },
  draftDate: {
    fontSize: 10,
    color: '#666',
  },
  draftTopic: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  draftDescription: {
    fontSize: 12,
    color: '#888',
  },
  deleteDraftButton: {
    padding: 8,
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagChipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  tagInputContainer: {
    minWidth: 100,
  },
  tagInput: {
    backgroundColor: '#111',
    color: '#fff',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  popularTagsContainer: {
    marginTop: 8,
  },
  popularTagsLabel: {
    fontSize: 12,
    color: '#888',
    marginBottom: 8,
  },
  popularTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  popularTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: '#111',
  },
  popularTagSelected: {
    backgroundColor: '#222',
  },
  popularTagText: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
  },
});

