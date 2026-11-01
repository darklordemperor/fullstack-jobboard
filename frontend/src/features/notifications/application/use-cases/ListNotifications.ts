import type { NotificationRepository } from "@/features/notifications/application/ports/NotificationRepository";
import type { NotificationCollection } from "@/features/notifications/domain/entities/Notification";

export class ListNotifications {
  constructor(private readonly repository: NotificationRepository) {}

  execute(page?: number, perPage?: number): Promise<NotificationCollection> {
    return this.repository.list(page, perPage);
  }
}
