// data/mockNotifications.ts
import { Notification, UserRole } from "@/types/notification";

export const mockNotifications: Record<UserRole, Notification[]> = {
  listener: [
    {
      id: "1",
      title: "Subscription Warning",
      message: "Your premium subscription expires in 3 days. Renew now to keep listening offline.",
      type: "warning",
      isRead: false,
      createdAt: "2026-07-02T10:00:00Z",
    },
    {
      id: "2",
      title: "New Release",
      message: "The Weeknd just dropped a new single: 'Midnight Melodies'.",
      type: "info",
      isRead: true,
      createdAt: "2026-07-01T15:30:00Z",
      link: "/track/123",
    },
  ],
  artist: [
    {
      id: "3",
      title: "Verification Approved",
      message: "Congratulations! Your artist profile has been verified. You can now upload music.",
      type: "success",
      isRead: false,
      createdAt: "2026-07-02T09:00:00Z",
    },
    {
      id: "4",
      title: "Financial Report",
      message: "Your monthly royalty calculation for June is ready for review.",
      type: "info",
      isRead: false,
      createdAt: "2026-07-01T12:00:00Z",
    },
  ],
  admin: [
    {
      id: "5",
      title: "New Support Ticket",
      message: "Ticket #404: User reports issues with payment gateway.",
      type: "alert",
      isRead: false,
      createdAt: "2026-07-02T11:15:00Z",
    },
    {
      id: "6",
      title: "Artist Verification Request",
      message: "A new artist 'Luna' has submitted documents for verification.",
      type: "info",
      isRead: false,
      createdAt: "2026-07-02T08:45:00Z",
    },
  ],
  support: [
    {
      id: "7",
      title: "System Alert",
      message: "High volume of tickets detected regarding login issues.",
      type: "alert",
      isRead: false,
      createdAt: "2026-07-02T10:30:00Z",
    },
  ],
};
