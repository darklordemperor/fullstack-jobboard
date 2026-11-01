export interface AppNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  url: string;
  readAt: string | null;
  createdAt: string;
}

export interface NotificationCollection {
  items: AppNotification[];
  unreadCount: number;
  pagination: {
    currentPage: number;
    perPage: number;
    lastPage: number;
    total: number;
  };
}
