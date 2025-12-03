import api from './api';

export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  eloRating: number;
  debatesWon: number;
  debatesLost: number;
  debatesTied: number;
  totalDebates: number;
}

export const usersAPI = {
  // Search users
  searchUsers: async (query: string, limit: number = 20): Promise<User[]> => {
    const response = await api.get(`/users/search?q=${encodeURIComponent(query)}&limit=${limit}`);
    return response.data;
  },

  // Block a user
  blockUser: async (userId: string): Promise<void> => {
    await api.post(`/users/${userId}/block`);
  },

  // Unblock a user
  unblockUser: async (userId: string): Promise<void> => {
    await api.delete(`/users/${userId}/block`);
  },

  // Check block status
  getBlockStatus: async (userId: string): Promise<{ isBlocked: boolean; isBlockedBy: boolean }> => {
    const response = await api.get(`/users/${userId}/block`);
    return response.data;
  },
};
