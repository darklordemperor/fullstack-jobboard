"use client";

import { create } from "zustand";
import {
  listNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
} from "@/features/notifications/composition/notificationDependencies";
import type {
  AppNotification,
  NotificationCollection,
} from "@/features/notifications/domain/entities/Notification";

export interface NotificationsUseCasePort {
  listNotifications: {
    execute(page?: number, perPage?: number): Promise<NotificationCollection>;
  };
  markNotificationAsRead: {
    execute(id: string): Promise<AppNotification>;
  };
  markAllNotificationsAsRead: {
    execute(): Promise<void>;
  };
}

export type NotificationsStatus = "idle" | "loading" | "ready" | "error";

export interface NotificationsStoreState {
  items: AppNotification[];
  unreadCount: number;
  status: NotificationsStatus;
  error: string | null;
  loadNotifications: (force?: boolean) => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  resetNotifications: () => void;
}

export function createNotificationsStore(useCases: NotificationsUseCasePort) {
  return create<NotificationsStoreState>((set, get) => ({
    items: [],
    unreadCount: 0,
    status: "idle",
    error: null,

    loadNotifications: async (force = false) => {
      const current = get();
      if (!force && current.status === "ready") {
        return;
      }

      set({ status: "loading", error: null });

      try {
        const result = await useCases.listNotifications.execute(1, 20);
        set({
          items: result.items,
          unreadCount: result.unreadCount,
          status: "ready",
          error: null,
        });
      } catch (error) {
        set({
          status: "error",
          error:
            error instanceof Error
              ? error.message
              : "Unable to load notifications.",
        });
      }
    },

    markAsRead: async (id: string) => {
      const previousItems = get().items;
      const previousUnread = get().unreadCount;

      // Optimistic update
      set((state) => ({
        items: state.items.map((item) =>
          item.id === id
            ? { ...item, readAt: item.readAt ?? new Date().toISOString() }
            : item,
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));

      try {
        const updated = await useCases.markNotificationAsRead.execute(id);
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, readAt: updated.readAt } : item,
          ),
        }));
      } catch {
        // Rollback on failure
        set({
          items: previousItems,
          unreadCount: previousUnread,
        });
      }
    },

    markAllAsRead: async () => {
      const previousItems = get().items;
      const previousUnread = get().unreadCount;
      const now = new Date().toISOString();

      // Optimistic update
      set((state) => ({
        items: state.items.map((item) => ({
          ...item,
          readAt: item.readAt ?? now,
        })),
        unreadCount: 0,
      }));

      try {
        await useCases.markAllNotificationsAsRead.execute();
      } catch {
        set({
          items: previousItems,
          unreadCount: previousUnread,
        });
      }
    },

    resetNotifications: () => {
      set({
        items: [],
        unreadCount: 0,
        status: "idle",
        error: null,
      });
    },
  }));
}

export const useNotificationsStore = createNotificationsStore({
  listNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
});
