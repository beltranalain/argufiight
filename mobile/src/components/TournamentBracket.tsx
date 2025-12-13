/**
 * Tournament Bracket Component (Mobile)
 * Displays tournament bracket for BRACKET and CHAMPIONSHIP formats
 */

import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

interface Participant {
  id: string;
  userId: string;
  seed: number;
  status: string;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    eloRating: number;
  };
}

interface Match {
  id: string;
  round: number;
  matchNumber: number;
  participant1Id: string | null;
  participant2Id: string | null;
  winnerId: string | null;
  status: string;
  participant1Score: number | null;
  participant2Score: number | null;
  debate: {
    id: string;
    status: string;
  } | null;
}

interface TournamentBracketProps {
  participants: Participant[];
  matches: Match[];
  totalRounds: number;
  currentRound: number;
  format?: 'BRACKET' | 'CHAMPIONSHIP' | 'KING_OF_THE_HILL';
  tournamentStatus?: string;
}

interface BracketSlot {
  participant: Participant | null;
  matchId: string | null;
  isWinner: boolean;
  debateId: string | null;
  matchStatus: string | null;
  score: number | null;
}

export default function TournamentBracket({
  participants,
  matches,
  totalRounds,
  currentRound,
  format = 'BRACKET',
  tournamentStatus,
}: TournamentBracketProps) {
  const navigation = useNavigation();

  // Build bracket structure
  const bracketStructure = useMemo(() => {
    const structure: BracketSlot[][][] = []; // [round][match][slot]

    // Helper to find participant by ID
    const findParticipant = (participantId: string | null): Participant | null => {
      if (!participantId) return null;
      return participants.find((p) => p.id === participantId) || null;
    };

    // Build bracket round by round
    for (let round = 1; round <= totalRounds; round++) {
      const roundMatches = matches.filter((m) => m.round === round);
      const roundSlots: BracketSlot[][] = [];

      // Sort matches by matchNumber
      roundMatches.sort((a, b) => a.matchNumber - b.matchNumber);

      for (const match of roundMatches) {
        const participant1 = findParticipant(match.participant1Id);
        const participant2 = findParticipant(match.participant2Id);

        // Override match status if tournament is completed
        const effectiveStatus = tournamentStatus === 'COMPLETED' ? 'COMPLETED' : match.status;

        roundSlots.push([
          {
            participant: participant1,
            matchId: match.id,
            isWinner: match.winnerId ? match.winnerId === participant1?.userId : false,
            debateId: match.debate?.id || null,
            matchStatus: effectiveStatus,
            score: match.participant1Score,
          },
          {
            participant: participant2,
            matchId: match.id,
            isWinner: match.winnerId ? match.winnerId === participant2?.userId : false,
            debateId: match.debate?.id || null,
            matchStatus: effectiveStatus,
            score: match.participant2Score,
          },
        ]);
      }

      structure.push(roundSlots);
    }

    return structure;
  }, [participants, matches, totalRounds, tournamentStatus]);

  const handleMatchPress = (debateId: string | null, matchId: string) => {
    if (debateId) {
      navigation.navigate('DebateDetail' as never, { debateId });
    }
  };

  const renderMatch = (slots: BracketSlot[], roundIndex: number, matchIndex: number) => {
    const [slot1, slot2] = slots;
    const matchId = slot1?.matchId || slot2?.matchId || '';
    const debateId = slot1?.debateId || slot2?.debateId || null;
    const matchStatus = slot1?.matchStatus || slot2?.matchStatus || 'PENDING';

    const isCurrentRound = roundIndex + 1 === currentRound;
    const isCompleted = matchStatus === 'COMPLETED';
    const isInProgress = matchStatus === 'IN_PROGRESS';

    return (
      <TouchableOpacity
        key={`${roundIndex}-${matchIndex}`}
        style={styles.matchContainer}
        onPress={() => handleMatchPress(debateId, matchId)}
        disabled={!debateId}
      >
        <View style={[styles.matchBox, isCurrentRound && styles.currentRoundMatch]}>
          {/* Participant 1 */}
          <View
            style={[
              styles.participantSlot,
              slot1?.isWinner && styles.winnerSlot,
              !slot1?.participant && styles.emptySlot,
            ]}
          >
            {slot1?.participant ? (
              <>
                <Text style={styles.participantName} numberOfLines={1}>
                  {slot1.participant.user.username}
                </Text>
                {slot1.score !== null && (
                  <Text style={styles.score}>{slot1.score.toFixed(1)}</Text>
                )}
                {slot1.isWinner && (
                  <Ionicons name="trophy" size={16} color="#ffd700" style={styles.winnerIcon} />
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>TBD</Text>
            )}
          </View>

          {/* VS Divider */}
          <View style={styles.vsDivider}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Participant 2 */}
          <View
            style={[
              styles.participantSlot,
              slot2?.isWinner && styles.winnerSlot,
              !slot2?.participant && styles.emptySlot,
            ]}
          >
            {slot2?.participant ? (
              <>
                <Text style={styles.participantName} numberOfLines={1}>
                  {slot2.participant.user.username}
                </Text>
                {slot2.score !== null && (
                  <Text style={styles.score}>{slot2.score.toFixed(1)}</Text>
                )}
                {slot2.isWinner && (
                  <Ionicons name="trophy" size={16} color="#ffd700" style={styles.winnerIcon} />
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>TBD</Text>
            )}
          </View>

          {/* Status Badge */}
          {isInProgress && (
            <View style={styles.statusBadge}>
              <Text style={styles.statusText}>Live</Text>
            </View>
          )}
          {isCompleted && (
            <View style={[styles.statusBadge, styles.completedBadge]}>
              <Text style={styles.statusText}>Done</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.container}>
      <View style={styles.bracketContainer}>
        {bracketStructure.map((round, roundIndex) => (
          <View key={roundIndex} style={styles.roundContainer}>
            <View style={styles.roundHeader}>
              <Text style={styles.roundTitle}>Round {roundIndex + 1}</Text>
              {roundIndex + 1 === currentRound && (
                <View style={styles.currentBadge}>
                  <Text style={styles.currentBadgeText}>Current</Text>
                </View>
              )}
            </View>
            <View style={styles.matchesContainer}>
              {round.map((match, matchIndex) => renderMatch(match, roundIndex, matchIndex))}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bracketContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 16,
  },
  roundContainer: {
    minWidth: 200,
  },
  roundHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  roundTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  currentBadge: {
    backgroundColor: '#00d9ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  currentBadgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
  matchesContainer: {
    gap: 12,
  },
  matchContainer: {
    marginBottom: 8,
  },
  matchBox: {
    backgroundColor: '#111',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 180,
  },
  currentRoundMatch: {
    borderColor: '#00d9ff',
    borderWidth: 2,
    backgroundColor: '#001a1f',
  },
  participantSlot: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#1a1a1a',
    marginBottom: 4,
    minHeight: 50,
    justifyContent: 'center',
  },
  winnerSlot: {
    backgroundColor: '#1a2a1a',
    borderWidth: 1,
    borderColor: '#00ff88',
  },
  emptySlot: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#333',
    borderStyle: 'dashed',
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  score: {
    fontSize: 12,
    color: '#00d9ff',
    fontWeight: '600',
  },
  winnerIcon: {
    position: 'absolute',
    right: 8,
    top: 8,
  },
  emptyText: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  vsDivider: {
    alignItems: 'center',
    marginVertical: 8,
  },
  vsText: {
    fontSize: 12,
    color: '#888',
    fontWeight: '600',
  },
  statusBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#ff4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  completedBadge: {
    backgroundColor: '#00ff88',
  },
  statusText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
});
