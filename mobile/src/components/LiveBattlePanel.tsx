/**
 * Live Battle Panel Component
 * Shows user's active debate that requires their attention
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { debatesAPI, Debate } from '../services/debatesAPI';

interface LiveBattlePanelProps {
  onPress?: () => void;
}

export default function LiveBattlePanel({ onPress }: LiveBattlePanelProps) {
  const { user } = useAuth();
  const navigation = useNavigation();
  const [activeDebate, setActiveDebate] = useState<Debate | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchActiveDebate();
      // Refresh every 30 seconds
      const interval = setInterval(fetchActiveDebate, 30000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchActiveDebate = async () => {
    if (!user) return;

    try {
      const debate = await debatesAPI.getActiveDebate(user.id);
      setActiveDebate(debate);
    } catch (error) {
      console.error('Failed to fetch active debate:', error);
      setActiveDebate(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePress = () => {
    if (activeDebate) {
      if (onPress) {
        onPress();
      } else {
        navigation.navigate('DebateDetail' as never, { debateId: activeDebate.id });
      }
    }
  };

  if (loading) {
    return null; // Don't show loading state, just hide panel
  }

  if (!activeDebate) {
    return null; // Don't show panel if no active debate
  }

  // Calculate display round (tournament round vs debate round)
  const displayRound = activeDebate.tournamentMatch
    ? activeDebate.tournamentMatch.round.roundNumber
    : activeDebate.currentRound;
  const displayTotalRounds = activeDebate.tournamentMatch
    ? activeDebate.tournamentMatch.tournament.totalRounds
    : activeDebate.totalRounds;

  // Check if it's user's turn (simplified - would need full debate details for accurate check)
  const isGroupDebate = activeDebate.challengeType === 'GROUP' || 
                       (activeDebate.participants && activeDebate.participants.length > 2);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Live Battle</Text>
          {isGroupDebate && (
            <View style={styles.tournamentBadge}>
              <Text style={styles.tournamentBadgeText}>Tournament</Text>
            </View>
          )}
        </View>

        <Text style={styles.topic} numberOfLines={2}>
          {activeDebate.topic}
        </Text>

        <View style={styles.infoRow}>
          <Text style={styles.roundText}>
            Round {displayRound}/{displayTotalRounds}
          </Text>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.viewButton} onPress={handlePress}>
          <Text style={styles.viewButtonText}>View Debate →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111',
    borderRadius: 12,
    margin: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#00d9ff',
    shadowColor: '#00d9ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  tournamentBadge: {
    backgroundColor: '#6b46c1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tournamentBadgeText: {
    fontSize: 10,
    color: '#fff',
    fontWeight: '600',
  },
  topic: {
    fontSize: 14,
    color: '#fff',
    marginBottom: 12,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  roundText: {
    fontSize: 12,
    color: '#888',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00ff00',
  },
  liveText: {
    fontSize: 12,
    color: '#00ff00',
    fontWeight: '600',
  },
  viewButton: {
    backgroundColor: '#00d9ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
