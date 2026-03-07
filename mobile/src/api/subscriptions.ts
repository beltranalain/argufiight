import { apiFetch } from './client';

export const subscriptionsApi = {
  getCurrent: () => apiFetch('/api/subscriptions'),

  getPricing: () => apiFetch('/api/subscriptions/pricing'),

  getUsage: () => apiFetch('/api/subscriptions/usage'),

  validatePromoCode: (code: string) =>
    apiFetch('/api/subscriptions/validate-promo-code', {
      method: 'POST',
      body: { code },
    }),
};
