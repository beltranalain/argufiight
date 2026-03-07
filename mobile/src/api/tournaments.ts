import { apiFetch } from './client';

export const tournamentsApi = {
  getAll: () => apiFetch('/api/tournaments'),

  get: (id: string) => apiFetch(`/api/tournaments/${id}`),

  join: (id: string) =>
    apiFetch(`/api/tournaments/${id}/join`, { method: 'POST' }),

  create: (data: { name: string; category: string; maxParticipants: number }) =>
    apiFetch('/api/tournaments', { method: 'POST', body: data }),
};
