import { apiGet, apiPut } from '@/src/api/client';
import { NOTIFICATIONS } from '@/src/api/endpoints';

export interface NotificationItem {
  id: number;
  titre: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  lu: boolean;
  dateCreation: string;
  actionUrl?: string | null;
}

export const notificationService = {
  listToday: () => apiGet<NotificationItem[]>(NOTIFICATIONS.AUJOURDHUI),
  listUnread: () => apiGet<NotificationItem[]>(NOTIFICATIONS.NON_LUES),
  unreadCount: () => apiGet<number>(NOTIFICATIONS.NON_LUES_COUNT),
  markRead: (id: number) => apiPut<void>(NOTIFICATIONS.LIRE(id), {}),
  markAllRead: () => apiPut<void>(NOTIFICATIONS.LIRE_TOUTES, {}),
};
