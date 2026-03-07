import { apiFetch } from './client';
import { User } from '../store/authStore';

interface LoginResponse {
  token?: string;
  user?: User;
  requires2FA?: boolean;
  requires2FASetup?: boolean;
  error?: string;
}

interface SignupResponse {
  token?: string;
  user?: User;
  error?: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    apiFetch<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: { email, password },
    }),

  signup: (username: string, email: string, password: string) =>
    apiFetch<SignupResponse>('/api/auth/signup', {
      method: 'POST',
      body: { username, email, password },
    }),

  me: () => apiFetch<{ user: User }>('/api/auth/me'),

  logout: () =>
    apiFetch('/api/auth/logout', { method: 'POST' }),

  forgotPassword: (email: string) =>
    apiFetch('/api/auth/forgot-password', {
      method: 'POST',
      body: { email },
    }),

  resetPassword: (token: string, password: string) =>
    apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: { token, password },
    }),

  verify2FA: (code: string) =>
    apiFetch<LoginResponse>('/api/auth/2fa/verify', {
      method: 'POST',
      body: { code },
    }),

  get2FAStatus: () =>
    apiFetch<{ enabled: boolean }>('/api/auth/2fa/status'),

  setup2FA: () =>
    apiFetch<{ qrCode: string; secret: string }>('/api/auth/2fa/setup', { method: 'POST' }),

  disable2FA: (code: string) =>
    apiFetch('/api/auth/2fa/disable', { method: 'POST', body: { code } }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiFetch('/api/auth/reset-password', {
      method: 'POST',
      body: { currentPassword, newPassword },
    }),
};
