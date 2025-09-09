import { FirebaseService } from '@/lib/firebaseService';

export type NotificationType = 'requisition' | 'issuance' | 'gate_pass' | 'system';

export interface NotificationRecord {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  data?: Record<string, any>;
}

export interface CreateNotificationData extends Omit<NotificationRecord, 'id' | 'created_at' | 'is_read'> {
  is_read?: boolean;
}

export const notificationService = {
  async create(data: CreateNotificationData): Promise<NotificationRecord> {
    const id = await FirebaseService.create('notifications', {
      ...data,
      is_read: data.is_read ?? false,
      created_at: new Date().toISOString(),
    });
    return { id, ...data, created_at: new Date().toISOString(), is_read: data.is_read ?? false } as NotificationRecord;
  },

  async markRead(id: string): Promise<void> {
    await FirebaseService.update('notifications', id, { is_read: true });
  },

  async getRecent(limitCount = 10): Promise<NotificationRecord[]> {
    const rows = await FirebaseService.query<NotificationRecord>('notifications');
    return (rows || [])
      .sort((a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
      .slice(0, limitCount);
  }
};

export default notificationService;


