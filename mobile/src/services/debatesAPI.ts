import api from './api';

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface Debate {
  id: string;
  topic: string;
  description?: string;
  category: 'SPORTS' | 'POLITICS' | 'TECH' | 'ENTERTAINMENT' | 'SCIENCE' | 'OTHER';
  challengerId: string;
  opponentId?: string;
  challenger?: {
    id: string;
    username: string;
    avatarUrl?: string;
    eloRating: number;
  };
  opponent?: {
    id: string;
    username: string;
    avatarUrl?: string;
    eloRating: number;
  };
  challengerPosition: 'FOR' | 'AGAINST';
  opponentPosition: 'FOR' | 'AGAINST';
  totalRounds: number;
  currentRound: number;
  status: 'WAITING' | 'ACTIVE' | 'COMPLETED' | 'VERDICT_READY' | 'CANCELLED';
  spectatorCount: number;
  featured: boolean;
  createdAt: string;
  startedAt?: string;
  endedAt?: string;
  roundDeadline?: string;
  winnerId?: string;
  verdictReached: boolean;
  recommendationScore?: number;
  reason?: string;
  tags?: Tag[];
  challengeType?: 'OPEN' | 'DIRECT' | 'GROUP';
  participants?: Array<{
    id: string;
    userId: string;
    status: string;
    user: {
      id: string;
      username: string;
      avatarUrl: string | null;
      eloRating: number;
    };
  }>;
  tournamentMatch?: {
    id: string;
    round: {
      roundNumber: number;
    };
    tournament: {
      id: string;
      name: string;
      format: string;
      totalRounds: number;
    };
  } | null;
}

export interface CreateDebateData {
  topic: string;
  description?: string;
  category: Debate['category'];
  challengerPosition: 'FOR' | 'AGAINST';
  totalRounds?: number;
  speedMode?: boolean;
}

export const debatesAPI = {
  // Get all debates with optional filters and pagination
  getDebates: async (params?: {
    status?: string;
    category?: string;
    userId?: string;
    page?: number;
    limit?: number;
  }): Promise<{ debates: Debate[]; total: number; page: number; totalPages: number }> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.userId) queryParams.append('userId', params.userId);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/debates?${queryParams.toString()}`);
    // Handle both old format (array) and new format (object with pagination)
    if (Array.isArray(response.data)) {
      return {
        debates: response.data,
        total: response.data.length,
        page: 1,
        totalPages: 1,
      };
    }
    return response.data;
  },

  // Get trending/featured debates with pagination
  getTrendingDebates: async (page: number = 1, limit: number = 20): Promise<{ debates: Debate[]; total: number; page: number; totalPages: number }> => {
    // Try trending endpoint first
    try {
      const response = await api.get(`/debates/trending?limit=${limit}&page=${page}`);
      if (response.data) {
        if (Array.isArray(response.data)) {
          return {
            debates: response.data,
            total: response.data.length,
            page: 1,
            totalPages: 1,
          };
        }
        return response.data;
      }
    } catch (error) {
      console.log('Trending debates not available, trying featured');
    }

    // Fallback to featured debates
    try {
      const response = await api.get(`/debates?featured=true&limit=${limit}&page=${page}`);
      if (response.data) {
        if (Array.isArray(response.data)) {
          return {
            debates: response.data,
            total: response.data.length,
            page: 1,
            totalPages: 1,
          };
        }
        return response.data;
      }
    } catch (error) {
      console.log('Featured debates not available, trying all debates');
    }
    
    // Final fallback to all debates ordered by creation date
    const response = await api.get(`/debates?limit=${limit}&page=${page}`);
    const data = response.data || [];
    if (Array.isArray(data)) {
      return {
        debates: data,
        total: data.length,
        page: 1,
        totalPages: 1,
      };
    }
    return data;
  },

  // Get a single debate by ID
  getDebate: async (id: string): Promise<Debate> => {
    console.log('Fetching debate with ID:', id);
    const response = await api.get(`/debates/${id}`);
    console.log('Debate response:', response.data);
    return response.data;
  },

  // Update a debate (only before opponent accepts)
  updateDebate: async (id: string, data: Partial<CreateDebateData>): Promise<Debate> => {
    const response = await api.put(`/debates/${id}`, data);
    return response.data;
  },

  // Delete a debate
  deleteDebate: async (id: string): Promise<void> => {
    await api.delete(`/debates/${id}`);
  },

  // Create a new debate
  createDebate: async (data: CreateDebateData): Promise<Debate> => {
    const response = await api.post('/debates', data);
    return response.data;
  },

  // Accept a debate challenge
  acceptDebate: async (debateId: string, position: 'FOR' | 'AGAINST'): Promise<Debate> => {
    const response = await api.post(`/debates/${debateId}/accept`, { position });
    return response.data;
  },

  // Get statements for a debate
  getStatements: async (debateId: string) => {
    const response = await api.get(`/debates/${debateId}/statements`);
    return response.data;
  },

  // Submit a statement/argument
  submitStatement: async (debateId: string, content: string, round: number) => {
    const response = await api.post(`/debates/${debateId}/statements`, {
      content,
      round,
    });
    return response.data;
  },

  // Get verdicts for a debate
  getVerdicts: async (debateId: string) => {
    const response = await api.get(`/debates/${debateId}/verdicts`);
    return response.data;
  },

  // Get like status and count
  getLikeStatus: async (debateId: string) => {
    const response = await api.get(`/debates/${debateId}/like`);
    return response.data;
  },

  // Toggle like
  toggleLike: async (debateId: string) => {
    const response = await api.post(`/debates/${debateId}/like`);
    return response.data;
  },

  // Get comments for a debate with pagination
  getComments: async (debateId: string, page: number = 1, limit: number = 20): Promise<{ comments: any[]; total: number; page: number; totalPages: number }> => {
    const response = await api.get(`/debates/${debateId}/comments?page=${page}&limit=${limit}`);
    const data = response.data;
    
    // Handle both old format (array) and new format (object with pagination)
    if (Array.isArray(data)) {
      return {
        comments: data,
        total: data.length,
        page: 1,
        totalPages: 1,
      };
    }
    return {
      comments: data.comments || [],
      total: data.total || 0,
      page: data.page || 1,
      totalPages: data.totalPages || 1,
    };
  },

  // Create comment
  createComment: async (debateId: string, content: string, parentId?: string) => {
    const response = await api.post(`/debates/${debateId}/comments`, {
      content,
      parentId,
    });
    return response.data;
  },

  // Update comment
  updateComment: async (debateId: string, commentId: string, content: string) => {
    const response = await api.put(`/debates/${debateId}/comments/${commentId}`, {
      content,
    });
    return response.data;
  },

  // Delete comment
  deleteComment: async (debateId: string, commentId: string) => {
    await api.delete(`/debates/${debateId}/comments/${commentId}`);
  },

  // Get save status
  getSaveStatus: async (debateId: string) => {
    const response = await api.get(`/debates/${debateId}/save`);
    return response.data;
  },

  // Toggle save
  toggleSave: async (debateId: string) => {
    const response = await api.post(`/debates/${debateId}/save`);
    return response.data;
  },

  // Get saved debates
  getSavedDebates: async (): Promise<Debate[]> => {
    const response = await api.get('/debates?saved=true');
    return response.data;
  },

  // Share debate
  shareDebate: async (debateId: string, method?: string) => {
    const response = await api.post(`/debates/${debateId}/share`, { method });
    return response.data;
  },

  // Get recommended debates
  getRecommendedDebates: async (): Promise<Debate[]> => {
    const response = await api.get('/debates/recommended');
    return response.data;
  },

  // Get debate history
  getDebateHistory: async (params?: { status?: string; limit?: number }): Promise<Debate[]> => {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.append('status', params.status);
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    const response = await api.get(`/debates/history?${queryParams.toString()}`);
    return response.data;
  },

  // Get watch status
  getWatchStatus: async (debateId: string) => {
    const response = await api.get(`/debates/${debateId}/watch`);
    return response.data;
  },

  // Toggle watch
  toggleWatch: async (debateId: string) => {
    const response = await api.post(`/debates/${debateId}/watch`);
    return response.data;
  },

  // Export debate
  exportDebate: async (debateId: string): Promise<string> => {
    const response = await api.get(`/debates/${debateId}/export`, {
      responseType: 'text',
    });
    return response.data;
  },

  // Get user's active debate (for Live Battle)
  getActiveDebate: async (userId: string): Promise<Debate | null> => {
    try {
      const response = await api.get(`/debates?userId=${userId}&status=ACTIVE`);
      const data = response.data;
      const debates = Array.isArray(data) ? data : (data.debates || []);
      const active = debates.find((d: Debate) => d.status === 'ACTIVE');
      
      if (active) {
        // Fetch full details
        return await debatesAPI.getDebate(active.id);
      }
      return null;
    } catch (error) {
      console.error('Failed to get active debate:', error);
      return null;
    }
  },
};

