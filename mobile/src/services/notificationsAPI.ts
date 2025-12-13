import api from './api';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  debateId: string | null;
  tournamentId?: string | null;
  debate?: {
    id: string;
    topic: string;
    status: string;
  };
  tournament?: {
    id: string;
    name: string;
    status: string;
  };
  read: boolean;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const notificationsAPI = {
  // Get all notifications with pagination
  getNotifications: async (unreadOnly?: boolean, page: number = 1, limit: number = 20): Promise<NotificationsResponse & { total: number; totalPages: number }> => {
    const params = new URLSearchParams();
    if (unreadOnly) params.append('unread', 'true');
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    
    const response = await api.get(`/notifications?${params.toString()}`);
    const data = response.data;
    
    // Handle both old format and new format
    if (data.notifications && Array.isArray(data.notifications)) {
      return {
        ...data,
        total: data.total || data.notifications.length,
        totalPages: data.totalPages || 1,
      };
    }
    return {
      notifications: Array.isArray(data) ? data : [],
      unreadCount: 0,
      total: Array.isArray(data) ? data.length : 0,
      totalPages: 1,
    };
  },

  // Mark notification as read
  markAsRead: async (notificationId: string): Promise<void> => {
    await api.post(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: async (): Promise<void> => {
    await api.post('/notifications/read-all');
  },

  // Subscribe to tournament notifications
  subscribeToTournament: async (tournamentId: string): Promise<void> => {
    await api.post(`/tournaments/${tournamentId}/subscribe`);
  },

  // Unsubscribe from tournament notifications
  unsubscribeFromTournament: async (tournamentId: string): Promise<void> => {
    await api.post(`/tournaments/${tournamentId}/unsubscribe`);
  },
};


