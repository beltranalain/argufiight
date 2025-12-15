import api from './api';

export interface DebateInsights {
  debate: {
    id: string;
    topic: string;
    status: string;
    category: string;
    createdAt: string;
  };
  statistics: {
    statements: number;
    likes: number;
    comments: number;
    saves: number;
    shares: number;
    votes: number;
    views: number;
    engagementScore: number;
  };
  participants: {
    challenger: {
      username: string;
      stats: {
        eloRating: number;
        winRate: number;
        totalDebates: number;
      };
    };
    opponent: {
      username: string;
      stats: {
        eloRating: number;
        winRate: number;
        totalDebates: number;
      };
    } | null;
  };
  recentActivity: {
    statements: number;
    comments: number;
    likes: number;
  };
  insights: {
    isPopular: boolean;
    isActive: boolean;
    engagementLevel: 'high' | 'medium' | 'low';
  };
}

export const insightsAPI = {
  getDebateInsights: async (debateId: string): Promise<DebateInsights> => {
    const response = await api.get(`/debates/insights?debateId=${debateId}`);
    return response.data;
  },
};







