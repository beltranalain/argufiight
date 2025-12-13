/**
 * Tournaments List Screen
 * Displays all available tournaments
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { tournamentsAPI, Tournament } from '../../services/tournamentsAPI';
import { useAuth } from '../../context/AuthContext';

export default function TournamentsScreen({ navigation }: any) {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  useEffect(() => {
    fetchTournaments();
  }, [filter]);

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      const response = await tournamentsAPI.getTournaments({
        status: filter !== 'ALL' ? filter : undefined,
      });
      setTournaments(response.tournaments || []);
    } catch (error) {
      console.error('Failed to fetch tournaments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchTournaments();
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
        return 'KOH';
      case 'CHAMPIONSHIP':
        return 'Championship';
      case 'BRACKET':
        return 'Bracket';
      default:
        return format;
    }
  };

  const isParticipant = (tournament: Tournament) => {
    if (!user) return false;
    return tournament.participants.some(p => p.userId === user.id);
  };

  const renderTournament = ({ item }: { item: Tournament }) => {
    const participant = isParticipant(item);
    const canJoin = item.status === 'REGISTRATION_OPEN' && 
                    !participant && 
                    (item._count.participants < item.maxParticipants);

    return (
      <TouchableOpacity
        style={styles.tournamentCard}
        onPress={() => navigation.navigate('TournamentDetail', { tournamentId: item.id })}
      >
        <View style={styles.tournamentHeader}>
          <Text style={styles.tournamentName}>{item.name}</Text>
          <View style={styles.badges}>
            <View style={[styles.badge, styles.statusBadge]}>
              <Text style={styles.badgeText}>{formatStatus(item.status)}</Text>
            </View>
            {item.format && (
              <View style={[styles.badge, styles.formatBadge]}>
                <Text style={styles.badgeText}>{formatFormat(item.format)}</Text>
              </View>
            )}
            {item.isPrivate && (
              <View style={[styles.badge, styles.privateBadge]}>
                <Text style={styles.badgeText}>Private</Text>
              </View>
            )}
          </View>
        </View>

        {item.description && (
          <Text style={styles.description} numberOfLines={2}>
            {item.description}
          </Text>
        )}

        <View style={styles.tournamentInfo}>
          <Text style={styles.infoText}>
            Round {item.currentRound}/{item.totalRounds}
          </Text>
          <Text style={styles.infoText}>
            {item._count.participants}/{item.maxParticipants} participants
          </Text>
        </View>

        {canJoin && (
          <TouchableOpacity
            style={styles.joinButton}
            onPress={(e) => {
              e.stopPropagation();
              handleJoinTournament(item.id);
            }}
          >
            <Text style={styles.joinButtonText}>Join Tournament</Text>
          </TouchableOpacity>
        )}

        {participant && (
          <View style={styles.participantBadge}>
            <Text style={styles.participantText}>✓ Joined</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const handleJoinTournament = async (tournamentId: string) => {
    try {
      await tournamentsAPI.joinTournament(tournamentId);
      fetchTournaments(); // Refresh list
    } catch (error: any) {
      console.error('Failed to join tournament:', error);
      alert(error.response?.data?.error || 'Failed to join tournament');
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#00d9ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Filter Buttons */}
      <View style={styles.filterContainer}>
        {(['ALL', 'REGISTRATION_OPEN', 'IN_PROGRESS', 'COMPLETED'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterButton, filter === status && styles.filterButtonActive]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
              {formatStatus(status)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={tournaments}
        renderItem={renderTournament}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00d9ff" />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No tournaments found</Text>
          </View>
        }
      />
    </View>
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
  filterContainer: {
    flexDirection: 'row',
    padding: 10,
    gap: 8,
    backgroundColor: '#111',
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#222',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#00d9ff',
    borderColor: '#00d9ff',
  },
  filterText: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
  },
  filterTextActive: {
    color: '#000',
  },
  listContent: {
    padding: 10,
  },
  tournamentCard: {
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222',
  },
  tournamentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tournamentName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadge: {
    backgroundColor: '#333',
  },
  formatBadge: {
    backgroundColor: '#444',
  },
  privateBadge: {
    backgroundColor: '#555',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  description: {
    color: '#888',
    fontSize: 14,
    marginBottom: 12,
  },
  tournamentInfo: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
  },
  infoText: {
    color: '#aaa',
    fontSize: 12,
  },
  joinButton: {
    backgroundColor: '#00d9ff',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  joinButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  participantBadge: {
    backgroundColor: '#00ff88',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  participantText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: '#888',
    fontSize: 16,
  },
});
