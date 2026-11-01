import type { NotificationRepository } from "@/features/notifications/application/ports/NotificationRepository";
import type { AppNotification } from "@/features/notifications/domain/entities/Notification";

export class MarkNotificationAsRead {
  constructor(private readonly repository: NotificationRepository) {}

  execute(id: string): Promise<AppNotification> {
    return this.repository.markAsRead(id);
  }
}
