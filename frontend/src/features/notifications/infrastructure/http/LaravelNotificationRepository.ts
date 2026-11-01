import axios from "axios";
import { NotificationRequestError } from "@/features/notifications/application/errors/NotificationRequestError";
import type { NotificationRepository } from "@/features/notifications/application/ports/NotificationRepository";
import type {
  AppNotification,
  NotificationCollection,
} from "@/features/notifications/domain/entities/Notification";
import { apiClient } from "@/infrastructure/http/apiClient";
import type { components } from "@/infrastructure/http/generated/openapi";

type NotificationCollectionEnvelope =
  components["schemas"]["NotificationCollectionEnvelope"];
type NotificationEnvelope = components["schemas"]["NotificationEnvelope"];
type EmptyEnvelope = components["schemas"]["EmptyEnvelope"];
type LaravelErrorResponse = components["schemas"]["ErrorEnvelope"];

export class LaravelNotificationRepository implements NotificationRepository {
  async list(page = 1, perPage = 15): Promise<NotificationCollection> {
    try {
      const response = await apiClient.get<NotificationCollectionEnvelope>(
        "/api/v1/notifications",
        {
          params: { page, perPage },
        },
      );

      return {
        items: response.data.data.items.map((item) => ({ ...item })),
        unreadCount: response.data.data.unreadCount,
        pagination: { ...response.data.data.pagination },
      };
    } catch (error) {
      if (axios.isAxiosError<LaravelErrorResponse>(error)) {
        throw new NotificationRequestError(
          error.response?.data.message ??
            error.message ??
            "Unable to load notifications.",
          error.response?.status,
          error.response?.data.errors ?? {},
        );
      }

      throw error;
    }
  }

  async markAsRead(id: string): Promise<AppNotification> {
    try {
      const response = await apiClient.patch<NotificationEnvelope>(
        `/api/v1/notifications/${id}/read`,
      );

      return { ...response.data.data };
    } catch (error) {
      if (axios.isAxiosError<LaravelErrorResponse>(error)) {
        throw new NotificationRequestError(
          error.response?.data.message ??
            error.message ??
            "Unable to mark notification as read.",
          error.response?.status,
          error.response?.data.errors ?? {},
        );
      }

      throw error;
    }
  }

  async markAllAsRead(): Promise<void> {
    try {
      await apiClient.post<EmptyEnvelope>("/api/v1/notifications/read-all");
    } catch (error) {
      if (axios.isAxiosError<LaravelErrorResponse>(error)) {
        throw new NotificationRequestError(
          error.response?.data.message ??
            error.message ??
            "Unable to mark all notifications as read.",
          error.response?.status,
          error.response?.data.errors ?? {},
        );
      }

      throw error;
    }
  }
}
