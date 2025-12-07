import api from './api';

export interface DebateDraft {
  id: string;
  userId: string;
  topic: string;
  description?: string;
  category: string;
  challengerPosition: string;
  totalRounds: number;
  createdAt: string;
  updatedAt: string;
}

export const draftsAPI = {
  // Get all user drafts
  getDrafts: async (): Promise<DebateDraft[]> => {
    const response = await api.get('/debates/drafts');
    return response.data;
  },

  // Save or update a draft
  saveDraft: async (draft: {
    id?: string;
    topic: string;
    description?: string;
    category: string;
    challengerPosition: string;
    totalRounds?: number;
  }): Promise<DebateDraft> => {
    const response = await api.post('/debates/drafts', draft);
    return response.data;
  },

  // Delete a draft
  deleteDraft: async (draftId: string): Promise<void> => {
    await api.delete(`/debates/drafts?id=${draftId}`);
  },
};




