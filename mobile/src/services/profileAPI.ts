/**
 * Profile API service
 */

import api from './api';

export interface UpdateProfileData {
  bio?: string;
  avatarUrl?: string;
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
   * Get user profile
   */
  getProfile: async (userId: string) => {
    const response = await api.get(`/users/${userId}/profile`);
    return response.data;
  },
};


