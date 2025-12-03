import api from './api';

export interface LeaderboardUser {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  eloRating: number;
  debatesWon: number;
  debatesLost: number;
  debatesTied: number;
  totalDebates: number;
  rank?: number;
}

export const leaderboardAPI = {
  getLeaderboard: async (limit: number = 50): Promise<LeaderboardUser[]> => {
    const response = await api.get(`/leaderboard?limit=${limit}`);
    // Handle both array and object response formats
    const data = response.data;
    if (Array.isArray(data)) {
      return data;
    }
    // If response is an object, try to extract users array
    return data?.users || data?.data || [];
  },
};


