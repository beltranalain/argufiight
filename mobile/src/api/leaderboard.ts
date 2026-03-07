import { apiFetch } from './client';

export const leaderboardApi = {
  get: (page = 1, limit = 25) =>
    apiFetch(`/api/leaderboard?page=${page}&limit=${limit}`),

  getTournament: () =>
    apiFetch('/api/leaderboard/tournaments'),
};
