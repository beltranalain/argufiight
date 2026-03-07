import { apiFetch } from './client';

export const messagesApi = {
  getConversations: () =>
    apiFetch('/api/messages/conversations'),

  createConversation: (userId: string) =>
    apiFetch('/api/messages/conversations', {
      method: 'POST',
      body: { userId },
    }),

  getMessages: (conversationId: string) =>
    apiFetch(`/api/messages/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    apiFetch(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: { content },
    }),
};
