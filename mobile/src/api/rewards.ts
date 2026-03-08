import { apiFetch } from './client';

export const rewardsApi = {
  dailyLogin: () =>
    apiFetch<{ rewarded: boolean; rewardAmount: number; message: string }>('/api/rewards/daily-login', {
      method: 'POST',
    }),
};
