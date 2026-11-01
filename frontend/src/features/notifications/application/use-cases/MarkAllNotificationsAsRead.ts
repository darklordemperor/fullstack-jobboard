import type { NotificationRepository } from "@/features/notifications/application/ports/NotificationRepository";

export class MarkAllNotificationsAsRead {
  constructor(private readonly repository: NotificationRepository) {}

  execute(): Promise<void> {
    return this.repository.markAllAsRead();
  }
}
