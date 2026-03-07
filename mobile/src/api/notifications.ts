import { apiFetch } from './client';

export const notificationsApi = {
  getAll: (unreadOnly = false) =>
    apiFetch(`/api/notifications${unreadOnly ? '?unreadOnly=true' : ''}`),

  markRead: (id: string) =>
    apiFetch(`/api/notifications/${id}/read`, { method: 'POST' }),

  markAllRead: () =>
    apiFetch('/api/notifications/read-all', { method: 'POST' }),

  getPreferences: () =>
    apiFetch('/api/user/notifications'),

  updatePreferences: (prefs: Record<string, boolean>) =>
    apiFetch('/api/user/notifications', {
      method: 'PATCH',
      body: prefs,
    }),

  registerPushToken: (token: string, device: 'ios' | 'android') =>
    apiFetch('/api/fcm/register', {
      method: 'POST',
      body: { token, device },
    }),
};
