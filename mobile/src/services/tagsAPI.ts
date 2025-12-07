import api from './api';

export interface Tag {
  id: string;
  name: string;
  color: string;
  usageCount?: number;
}

export const tagsAPI = {
  // Get all tags or tags for a debate
  getTags: async (debateId?: string): Promise<Tag[]> => {
    const url = debateId
      ? `/debates/tags?debateId=${debateId}`
      : '/debates/tags';
    const response = await api.get(url);
    return response.data;
  },

  // Add tags to a debate
  addTags: async (debateId: string, tagNames: string[]): Promise<Tag[]> => {
    const response = await api.post('/debates/tags', {
      debateId,
      tagNames,
    });
    return response.data.tags;
  },
};



