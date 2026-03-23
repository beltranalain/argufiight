import { apiFetch, apiUpload } from './client';

export const usersApi = {
  getProfile: () => apiFetch('/api/profile'),

  updateProfile: (data: { username?: string; bio?: string }) =>
    apiFetch('/api/profile', { method: 'PATCH', body: data }),

  uploadAvatar: (formData: FormData) =>
    apiUpload('/api/profile/avatar', formData),

  getUserProfile: (id: string) =>
    apiFetch(`/api/users/${id}/profile`),

  follow: (id: string) =>
    apiFetch(`/api/users/${id}/follow`, { method: 'POST' }),

  block: (id: string, reason?: string) =>
    apiFetch(`/api/users/${id}/block`, { method: 'POST', body: { reason } }),

  unblock: (id: string) =>
    apiFetch(`/api/users/${id}/block`, { method: 'DELETE' }),

  getBlockStatus: (id: string) =>
    apiFetch<{ isBlocked: boolean; isBlockedBy: boolean }>(`/api/users/${id}/block`),

  reportUser: (userId: string, reason: string, description?: string) =>
    apiFetch('/api/reports', { method: 'POST', body: { reason, description } }),

  getFollowers: () => apiFetch('/api/users/followers'),

  getFollowing: () => apiFetch('/api/users/following'),

  search: (q: string) =>
    apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`),

  getAchievements: () => apiFetch('/api/users/achievements'),

  getStreaks: () => apiFetch('/api/users/streaks'),

  getTournamentStats: () => apiFetch('/api/profile/tournament-stats'),
};
