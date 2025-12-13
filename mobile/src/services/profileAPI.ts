/**
 * Profile API service
 */

import api from './api';

export interface UpdateProfileData {
  bio?: string;
  avatarUrl?: string;
}

export interface PastDebate {
  id: string;
  topic: string;
  category: string;
  status: string;
  challenger: {
    id: string;
    username: string;
    avatarUrl: string | null;
  };
  opponent: {
    id: string;
    username: string;
    avatarUrl: string | null;
  } | null;
  winnerId: string | null;
  endedAt: string | null;
  createdAt: string;
  challengeType?: string;
  participants?: Array<{
    id: string;
    userId: string;
    user: {
      id: string;
      username: string;
      avatarUrl: string | null;
    };
  }>;
  tournamentMatch?: {
    tournament: {
      name: string;
      format?: string;
    };
  } | null;
}

export const profileAPI = {
  /**
   * Update user profile
   */
  updateProfile: async (data: UpdateProfileData) => {
    const response = await api.put('/users/profile', data);
    return response.data;
  },

  /**
   * Get user profile by user ID
   */
  getProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },

  /**
   * Get user profile by username
   */
  getProfileByUsername: async (username: string) => {
    const response = await api.get(`/users/username/${username}/profile`);
    return response.data;
  },

  /**
   * Get user's past debates (completed debates)
   */
  getPastDebates: async (userId: string, params?: {
    page?: number;
    limit?: number;
  }): Promise<{ debates: PastDebate[]; pagination?: any }> => {
    const queryParams = new URLSearchParams();
    queryParams.append('userId', userId);
    queryParams.append('status', 'COMPLETED,VERDICT_READY');
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get(`/debates?${queryParams.toString()}`);
    
    // Handle both array and object formats
    if (Array.isArray(response.data)) {
      return { debates: response.data };
    }
    return {
      debates: response.data.debates || [],
      pagination: response.data.pagination,
    };
  },
};





