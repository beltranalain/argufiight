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

  block: (id: string) =>
    apiFetch(`/api/users/${id}/block`, { method: 'POST' }),

  getFollowers: () => apiFetch('/api/users/followers'),

  getFollowing: () => apiFetch('/api/users/following'),

  search: (q: string) =>
    apiFetch(`/api/users/search?q=${encodeURIComponent(q)}`),

  getAchievements: () => apiFetch('/api/users/achievements'),

  getStreaks: () => apiFetch('/api/users/streaks'),

  getTournamentStats: () => apiFetch('/api/profile/tournament-stats'),
};
