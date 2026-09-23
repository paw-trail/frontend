import { api } from './client';
import type { NotificationCard, NotificationSettings, PageResponse } from './types';

export const notificationsApi = {
  unreadCount: () => api<{ unreadCount: number }>('/notifications/unread-count'),
  /** 새것부터 · size 기본 20 */
  list: (page: number, size = 20) => api<PageResponse<NotificationCard>>('/notifications', { query: { page, size } }),
  /** 없으면 404 NOTIFICATION_NOT_FOUND */
  read: (notificationId: string) => api<null>(`/notifications/${notificationId}/read`, { method: 'PATCH' }),
  readAll: () => api<null>('/notifications/read-all', { method: 'PATCH' }),
  settings: () => api<NotificationSettings>('/notifications/settings'),
  /** 보낸 칸만 바뀐다 */
  updateSettings: (body: Partial<NotificationSettings>) =>
    api<NotificationSettings>('/notifications/settings', { method: 'PATCH', body }),
};
