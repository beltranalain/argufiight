import api from './api';

export interface DebateComparison {
  debate1: {
    id: string;
    topic: string;
    category: string;
    status: string;
    createdAt: string;
    challenger: {
      username: string;
      eloRating: number;
      winRate: number;
    };
    opponent: {
      username: string;
      eloRating: number;
      winRate: number;
    } | null;
    statistics: {
      statements: number;
      likes: number;
      comments: number;
      saves: number;
      votes: number;
      engagementScore: number;
    };
  };
  debate2: {
    id: string;
    topic: string;
    category: string;
    status: string;
    createdAt: string;
    challenger: {
      username: string;
      eloRating: number;
      winRate: number;
    };
    opponent: {
      username: string;
      eloRating: number;
      winRate: number;
    } | null;
    statistics: {
      statements: number;
      likes: number;
      comments: number;
      saves: number;
      votes: number;
      engagementScore: number;
    };
  };
  comparison: {
    moreEngaged: string;
    moreRecent: string;
    higherEloChallenger: string;
  };
}

export const compareAPI = {
  compareDebates: async (
    debateId1: string,
    debateId2: string
  ): Promise<DebateComparison> => {
    const response = await api.get(
      `/debates/compare?debateId1=${debateId1}&debateId2=${debateId2}`
    );
    return response.data;
  },
};



