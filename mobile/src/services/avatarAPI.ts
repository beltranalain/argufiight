import api from './api';

export const avatarAPI = {
  updateAvatar: async (avatarUrl: string): Promise<{ success: boolean; user: any }> => {
    const response = await api.post('/users/avatar', { avatarUrl });
    return response.data;
  },
};







