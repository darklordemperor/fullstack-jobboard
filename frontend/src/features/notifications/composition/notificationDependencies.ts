import { ListNotifications } from "@/features/notifications/application/use-cases/ListNotifications";
import { MarkAllNotificationsAsRead } from "@/features/notifications/application/use-cases/MarkAllNotificationsAsRead";
import { MarkNotificationAsRead } from "@/features/notifications/application/use-cases/MarkNotificationAsRead";
import { LaravelNotificationRepository } from "@/features/notifications/infrastructure/http/LaravelNotificationRepository";

const repository = new LaravelNotificationRepository();

export const listNotifications = new ListNotifications(repository);
export const markNotificationAsRead = new MarkNotificationAsRead(repository);
export const markAllNotificationsAsRead = new MarkAllNotificationsAsRead(repository);
