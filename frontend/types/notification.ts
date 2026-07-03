// types/notification.ts

export type UserRole = 'listener' | 'artist' | 'admin' | 'support';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'alert';
  isRead: boolean;
  createdAt: string;
  link?: string; // Optional link for navigation (e.g., new releases)
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
}
