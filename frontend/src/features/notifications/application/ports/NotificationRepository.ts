import type {
  AppNotification,
  NotificationCollection,
} from "@/features/notifications/domain/entities/Notification";

export interface NotificationRepository {
  list(page?: number, perPage?: number): Promise<NotificationCollection>;
  markAsRead(id: string): Promise<AppNotification>;
  markAllAsRead(): Promise<void>;
}
