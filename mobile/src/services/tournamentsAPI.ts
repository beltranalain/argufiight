/**
 * Tournament API service
 */

import api from './api';

export interface Tournament {
  id: string;
  name: string;
  description: string;
  format: 'BRACKET' | 'CHAMPIONSHIP' | 'KING_OF_THE_HILL';
  status: 'REGISTRATION_OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  maxParticipants: number;
  currentRound: number;
  totalRounds: number;
  isPrivate: boolean;
  minElo?: number;
  startDate?: string;
  endDate?: string;
  creatorId: string;
  creator: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  participants: Array<{
    id?: string;
    userId: string;
    status: string;
    seed?: number;
    cumulativeScore?: number;
    eliminationRound?: number;
    user?: {
      id: string;
      username: string;
      avatarUrl: string | null;
      eloRating: number;
    };
  }>;
  matches?: Array<{
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
  }>;
  _count: {
    participants: number;
  };
}

export interface TournamentParticipant {
  id: string;
  userId: string;
  status: string;
  seed?: number;
  cumulativeScore?: number;
  eliminationRound?: number;
  user: {
    id: string;
    username: string;
    avatarUrl: string | null;
    eloRating: number;
  };
}

export interface TournamentRound {
  id: string;
  roundNumber: number;
  status: string;
  matches: Array<{
    id: string;
    status: string;
    slot1?: { userId: string; user: { username: string } };
    slot2?: { userId: string; user: { username: string } };
    winnerId?: string;
    debate?: { id: string; status: string };
  }>;
}

export interface TournamentBracket {
  rounds: TournamentRound[];
  participants: TournamentParticipant[];
}

export const tournamentsAPI = {
  /**
   * Get all tournaments with optional filters
   */
  getTournaments: async (params?: {
    status?: string;
    format?: string;
    page?: number;
    limit?: number;
  }): Promise<{ tournaments: Tournament[]; pagination?: any }> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.format) queryParams.append('format', params.format);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/tournaments?${queryParams.toString()}`);
    
    // Handle both array and object formats
    if (Array.isArray(response.data)) {
      return { tournaments: response.data };
    }
    return {
      tournaments: response.data.tournaments || [],
      pagination: response.data.pagination,
    };
  },

  /**
   * Get a single tournament by ID
   */
  getTournament: async (id: string): Promise<Tournament> => {
    const response = await api.get(`/tournaments/${id}`);
    return response.data;
  },

  /**
   * Join a tournament
   */
  joinTournament: async (id: string): Promise<Tournament> => {
    const response = await api.post(`/tournaments/${id}/join`);
    return response.data;
  },

  /**
   * Get tournament bracket view
   */
  getTournamentBracket: async (id: string): Promise<TournamentBracket> => {
    const response = await api.get(`/tournaments/${id}/bracket`);
    return response.data;
  },

  /**
   * Get tournament leaderboard (for King of the Hill)
   */
  getTournamentLeaderboard: async (id: string): Promise<TournamentParticipant[]> => {
    const response = await api.get(`/tournaments/${id}/leaderboard`);
    return response.data.participants || response.data || [];
  },
};
