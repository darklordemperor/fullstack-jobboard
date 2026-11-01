import { beforeEach, describe, expect, it, vi } from "vitest";
import { createNotificationsStore } from "./notificationsStore";

describe("notificationsStore", () => {
  const useCases = {
    listNotifications: { execute: vi.fn() },
    markNotificationAsRead: { execute: vi.fn() },
    markAllNotificationsAsRead: { execute: vi.fn() },
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("loads notifications into state", async () => {
    const mockNotification = {
      id: "abc-123",
      type: "application_reviewed",
      title: "Application Reviewed",
      message: "Your application is shortlisted",
      url: "/jobseeker/applications",
      readAt: null,
      createdAt: "2026-11-01T12:00:00Z",
    };

    useCases.listNotifications.execute.mockResolvedValue({
      items: [mockNotification],
      unreadCount: 1,
      pagination: { currentPage: 1, perPage: 20, lastPage: 1, total: 1 },
    });

    const store = createNotificationsStore(useCases);

    await store.getState().loadNotifications();

    expect(store.getState().items).toHaveLength(1);
    expect(store.getState().unreadCount).toBe(1);
    expect(store.getState().status).toBe("ready");
  });

  it("marks a single notification as read optimistically and reconciles", async () => {
    const mockNotification = {
      id: "abc-123",
      type: "application_reviewed",
      title: "Application Reviewed",
      message: "Your application is shortlisted",
      url: "/jobseeker/applications",
      readAt: null,
      createdAt: "2026-11-01T12:00:00Z",
    };

    useCases.listNotifications.execute.mockResolvedValue({
      items: [mockNotification],
      unreadCount: 1,
      pagination: { currentPage: 1, perPage: 20, lastPage: 1, total: 1 },
    });
    useCases.markNotificationAsRead.execute.mockResolvedValue({
      ...mockNotification,
      readAt: "2026-11-01T12:05:00Z",
    });

    const store = createNotificationsStore(useCases);
    await store.getState().loadNotifications();

    await store.getState().markAsRead("abc-123");

    expect(store.getState().unreadCount).toBe(0);
    expect(store.getState().items[0].readAt).toBe("2026-11-01T12:05:00Z");
  });

  it("marks all notifications as read", async () => {
    const mock1 = {
      id: "1",
      type: "app",
      title: "T1",
      message: "M1",
      url: "/",
      readAt: null,
      createdAt: "2026-11-01T12:00:00Z",
    };
    const mock2 = {
      id: "2",
      type: "app",
      title: "T2",
      message: "M2",
      url: "/",
      readAt: null,
      createdAt: "2026-11-01T12:00:00Z",
    };

    useCases.listNotifications.execute.mockResolvedValue({
      items: [mock1, mock2],
      unreadCount: 2,
      pagination: { currentPage: 1, perPage: 20, lastPage: 1, total: 2 },
    });
    useCases.markAllNotificationsAsRead.execute.mockResolvedValue(undefined);

    const store = createNotificationsStore(useCases);
    await store.getState().loadNotifications();

    await store.getState().markAllAsRead();

    expect(store.getState().unreadCount).toBe(0);
    expect(store.getState().items[0].readAt).not.toBeNull();
    expect(store.getState().items[1].readAt).not.toBeNull();
  });
});
