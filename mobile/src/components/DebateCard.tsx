import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Debate } from '../services/debatesAPI';
import { debatesAPI } from '../services/debatesAPI';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { tagsAPI } from '../services/tagsAPI';

interface DebateCardProps {
  debate: Debate;
  onPress: () => void;
}

export default function DebateCard({ debate, onPress }: DebateCardProps) {
  const navigation = useNavigation();
  const { user } = useAuth();
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [tags, setTags] = useState<{ id: string; name: string; color: string }[]>([]);

  useEffect(() => {
    loadLikeStatus();
    loadTags();
  }, [debate.id]);

  const loadTags = async () => {
    // First check if tags are already in the debate object
    if (debate.tags && debate.tags.length > 0) {
      setTags(debate.tags);
      return;
    }
    
    // Otherwise fetch them
    try {
      const debateTags = await tagsAPI.getTags(debate.id);
      setTags(debateTags);
    } catch (error) {
      // Silently fail - tags are optional
      setTags([]);
    }
  };

  const loadLikeStatus = async () => {
    try {
      const data = await debatesAPI.getLikeStatus(debate.id);
      setLikeCount(data.likeCount || 0);
      setIsLiked(data.liked || false);
    } catch (error) {
      // Silently fail - likes are optional
    }
  };

  const handleUserPress = (userId: string, e: any) => {
    e.stopPropagation();
    navigation.navigate('UserProfile' as never, { userId });
  };

  const handleLikePress = async (e: any) => {
    e.stopPropagation();
    if (!user) return;

    try {
      const data = await debatesAPI.toggleLike(debate.id);
      setLikeCount(data.likeCount);
      setIsLiked(data.liked);
    } catch (error) {
      // Silently fail
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return '#00ff00';
      case 'WAITING':
        return '#ffaa00';
      case 'VERDICT_READY':
        return '#00aaff';
      case 'COMPLETED':
        return '#888';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Active';
      case 'WAITING':
        return 'Waiting';
      case 'VERDICT_READY':
        return 'Verdict Ready';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.header}>
        <Text style={styles.category}>{debate.category}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(debate.status) }]}>
          <Text style={styles.statusText}>{getStatusText(debate.status)}</Text>
        </View>
      </View>

      <Text style={styles.topic} numberOfLines={2}>
        {debate.topic}
      </Text>

      {debate.description && (
        <Text style={styles.description} numberOfLines={2}>
          {debate.description}
        </Text>
      )}

      {/* Tags */}
      {tags.length > 0 && (
        <View style={styles.tagsContainer}>
          {tags.slice(0, 3).map((tag) => (
            <View
              key={tag.id}
              style={[styles.tagChip, { backgroundColor: tag.color + '20', borderColor: tag.color }]}
            >
              <Text style={[styles.tagText, { color: tag.color }]}>#{tag.name}</Text>
            </View>
          ))}
          {tags.length > 3 && (
            <Text style={styles.moreTagsText}>+{tags.length - 3}</Text>
          )}
        </View>
      )}

      <View style={styles.participants}>
        <TouchableOpacity
          style={styles.participant}
          onPress={(e) => debate.challenger && handleUserPress(debate.challenger.id, e)}
          disabled={!debate.challenger}
        >
          <Text style={styles.participantLabel}>Challenger:</Text>
          <Text style={styles.participantName}>
            {debate.challenger?.username || 'Unknown'}
          </Text>
          <Text style={styles.participantPosition}>
            {debate.challengerPosition}
          </Text>
        </TouchableOpacity>

        {debate.opponent && (
          <TouchableOpacity
            style={styles.participant}
            onPress={(e) => handleUserPress(debate.opponent!.id, e)}
          >
            <Text style={styles.participantLabel}>Opponent:</Text>
            <Text style={styles.participantName}>
              {debate.opponent.username}
            </Text>
            <Text style={styles.participantPosition}>
              {debate.opponentPosition}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.footerLeft}>
          <Text style={styles.roundInfo}>
            Round {debate.currentRound} / {debate.totalRounds}
          </Text>
          {debate.spectatorCount > 0 && (
            <Text style={styles.spectators}>
              👁 {debate.spectatorCount}
            </Text>
          )}
        </View>
        <TouchableOpacity
          style={styles.likeButton}
          onPress={handleLikePress}
          disabled={!user}
        >
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={16}
            color={isLiked ? '#ff0000' : '#666'}
          />
          <Text style={[styles.likeCount, isLiked && styles.likeCountActive]}>
            {likeCount}
          </Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  category: {
    fontSize: 12,
    color: '#888',
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  statusBadge: {
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#888',
    marginBottom: 12,
  },
  participants: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  participant: {
    flex: 1,
  },
  participantLabel: {
    fontSize: 11,
    color: '#666',
    marginBottom: 4,
  },
  participantName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
    marginBottom: 2,
  },
  participantPosition: {
    fontSize: 12,
    color: '#888',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  roundInfo: {
    fontSize: 12,
    color: '#888',
  },
  spectators: {
    fontSize: 12,
    color: '#666',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 12,
    color: '#666',
  },
  likeCountActive: {
    color: '#ff0000',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 12,
    marginTop: 4,
  },
  tagChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  moreTagsText: {
    fontSize: 11,
    color: '#888',
    alignSelf: 'center',
    marginLeft: 4,
  },
});

