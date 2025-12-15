import api from './api';

export interface VoteData {
  userVote: {
    id: string;
    predictedWinnerId: string;
    votedAt: string;
  } | null;
  voteCounts: {
    challenger: number;
    opponent: number;
    total: number;
  };
}

export const votesAPI = {
  // Vote on a debate (predict winner)
  vote: async (debateId: string, predictedWinnerId: string) => {
    const response = await api.post('/debates/vote', {
      debateId,
      predictedWinnerId,
    });
    return response.data;
  },

  // Get user's vote and vote counts
  getVote: async (debateId: string): Promise<VoteData> => {
    const response = await api.get(`/debates/vote?debateId=${debateId}`);
    return response.data;
  },
};







