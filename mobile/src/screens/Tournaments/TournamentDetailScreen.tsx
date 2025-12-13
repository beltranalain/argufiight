/**
 * Tournament Detail Screen
 * Shows tournament information, participants, bracket/leaderboard
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { tournamentsAPI, Tournament, TournamentParticipant } from '../../services/tournamentsAPI';
import { useAuth } from '../../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function TournamentDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { user } = useAuth();
  const { tournamentId } = route.params as { tournamentId: string };

  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [participants, setParticipants] = useState<TournamentParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    fetchTournament();
  }, [tournamentId]);

  const fetchTournament = async () => {
    try {
      setLoading(true);
      const data = await tournamentsAPI.getTournament(tournamentId);
      setTournament(data);
      
      // Fetch leaderboard for King of the Hill
      if (data.format === 'KING_OF_THE_HILL') {
        try {
          const leaderboard = await tournamentsAPI.getTournamentLeaderboard(tournamentId);
          setParticipants(leaderboard);
        } catch (error) {
          console.error('Failed to fetch leaderboard:', error);
        }
      }
    } catch (error: any) {
      console.error('Failed to fetch tournament:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to load tournament');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTournament();
  };

  const handleJoin = async () => {
    if (!tournament) return;

    setJoining(true);
    try {
      await tournamentsAPI.joinTournament(tournamentId);
      Alert.alert('Success', 'You have joined the tournament!');
      fetchTournament(); // Refresh
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to join tournament');
    } finally {
      setJoining(false);
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'REGISTRATION_OPEN':
        return 'Registration Open';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      default:
        return status;
    }
  };

  const formatFormat = (format: string) => {
    switch (format) {
      case 'KING_OF_THE_HILL':
        return 'King of the Hill';
      case 'CHAMPIONSHIP':
        return 'Championship';
      case 'BRACKET':
        return 'Bracket';
      default:
        return format;
    }
  };

  const isParticipant = () => {
    if (!user || !tournament) return false;
    return tournament.participants.some(p => p.userId === user.id);
  };

  const canJoin = () => {
    if (!tournament || !user) return false;
    return tournament.status === 'REGISTRATION_OPEN' &&
           !isParticipant() &&
           (tournament._count.participants < tournament.maxParticipants);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
      </View>
    );
  }

  if (!tournament) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Tournament not found</Text>
      </View>
    );
  }

  const participant = isParticipant();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d9ff" />
      }
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{tournament.name}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, styles.statusBadge]}>
              <Text style={styles.badgeText}>{formatStatus(tournament.status)}</Text>
            </View>
            <View style={[styles.badge, styles.formatBadge]}>
              <Text style={styles.badgeText}>{formatFormat(tournament.format)}</Text>
            </View>
            {tournament.isPrivate && (
              <View style={[styles.badge, styles.privateBadge]}>
                <Text style={styles.badgeText}>Private</Text>
              </View>
            )}
          </View>
        </View>

        {tournament.description && (
          <Text style={styles.description}>{tournament.description}</Text>
        )}

        {/* Tournament Info */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Round</Text>
            <Text style={styles.infoValue}>
              {tournament.currentRound}/{tournament.totalRounds}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Participants</Text>
            <Text style={styles.infoValue}>
              {tournament._count.participants}/{tournament.maxParticipants}
            </Text>
          </View>
          {tournament.minElo && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Min ELO</Text>
              <Text style={styles.infoValue}>{tournament.minElo}</Text>
            </View>
          )}
        </View>

        {/* Join Button */}
        {canJoin() && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={handleJoin}
            disabled={joining}
          >
            {joining ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={styles.joinButtonText}>Join Tournament</Text>
            )}
          </TouchableOpacity>
        )}

        {participant && (
          <View style={styles.participantBadge}>
            <Ionicons name="checkmark-circle" size={20} color="#00ff88" />
            <Text style={styles.participantText}>You are participating</Text>
          </View>
        )}

        {/* Participants List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Participants</Text>
          {tournament.participants.length === 0 ? (
            <Text style={styles.emptyText}>No participants yet</Text>
          ) : (
            tournament.participants.map((p) => {
              const participantUser = (tournament as any).participants.find(
                (tp: any) => tp.userId === p.userId
              )?.user;
              
              return (
                <TouchableOpacity
                  key={p.userId}
                  style={[
                    styles.participantItem,
                    p.status === 'ELIMINATED' && styles.eliminatedItem,
                  ]}
                  onPress={() => {
                    navigation.navigate('UserProfile' as never, { userId: p.userId });
                  }}
                >
                  <View style={styles.participantInfo}>
                    <Text style={styles.participantUsername}>
                      {participantUser?.username || 'Unknown'}
                    </Text>
                    {p.status === 'ELIMINATED' && (
                      <Text style={styles.eliminatedText}>
                        Eliminated Round {p.eliminationRound || '?'}
                      </Text>
                    )}
                    {p.cumulativeScore !== null && p.cumulativeScore !== undefined && (
                      <Text style={styles.scoreText}>
                        Score: {p.cumulativeScore.toFixed(2)}
                      </Text>
                    )}
                  </View>
                  {p.status === 'ACTIVE' && (
                    <View style={styles.activeBadge}>
                      <Text style={styles.activeBadgeText}>Active</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Leaderboard for King of the Hill */}
        {tournament.format === 'KING_OF_THE_HILL' && participants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Leaderboard</Text>
            {participants
              .sort((a, b) => (b.cumulativeScore || 0) - (a.cumulativeScore || 0))
              .map((p, index) => (
                <View key={p.id} style={styles.leaderboardItem}>
                  <Text style={styles.rank}>#{index + 1}</Text>
                  <Text style={styles.leaderboardUsername}>{p.user.username}</Text>
                  <Text style={styles.leaderboardScore}>
                    {p.cumulativeScore?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              ))}
          </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  badges: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statusBadge: {
    backgroundColor: '#333',
  },
  formatBadge: {
    backgroundColor: '#6b46c1',
  },
  privateBadge: {
    backgroundColor: '#555',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  description: {
    fontSize: 14,
    color: '#888',
    marginBottom: 16,
    lineHeight: 20,
  },
  infoSection: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#888',
  },
  infoValue: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  joinButton: {
    backgroundColor: '#00d9ff',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  joinButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  participantBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#00ff88',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  participantText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  participantItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222',
  },
  eliminatedItem: {
    backgroundColor: '#2a1111',
    borderColor: '#ff4444',
    opacity: 0.7,
  },
  participantInfo: {
    flex: 1,
  },
  participantUsername: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  eliminatedText: {
    fontSize: 12,
    color: '#ff6666',
  },
  scoreText: {
    fontSize: 12,
    color: '#00d9ff',
    marginTop: 4,
  },
  activeBadge: {
    backgroundColor: '#00ff88',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#00d9ff',
    width: 40,
  },
  leaderboardUsername: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    fontWeight: '600',
  },
  leaderboardScore: {
    fontSize: 14,
    color: '#00ff88',
    fontWeight: '600',
  },
  emptyText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    padding: 20,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 16,
  },
});
