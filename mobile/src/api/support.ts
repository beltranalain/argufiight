import { apiFetch } from './client';

export const supportApi = {
  getTickets: () => apiFetch('/api/support/tickets'),

  createTicket: (data: { subject: string; description: string; category?: string }) =>
    apiFetch('/api/support/tickets', { method: 'POST', body: data }),

  getTicket: (id: string) => apiFetch(`/api/support/tickets/${id}`),

  reply: (id: string, content: string) =>
    apiFetch(`/api/support/tickets/${id}/replies`, {
      method: 'POST',
      body: { content },
    }),
};
