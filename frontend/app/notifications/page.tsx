// app/notifications/page.tsx
"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/home/Sidebar";
import TopBar from "@/components/home/TopBar";
import NotificationCard from "@/components/notifications/NotificationCard";
import { sidebarNavItems, mockUser } from "@/data/mockHomeData";
import { mockNotifications } from "@/data/mockNotifications";
import { Notification, UserRole } from "@/types/notification";

export default function NotificationsPage() {
  // Simulate fetching role-based notifications
  const userRole = (mockUser.role as UserRole) || "listener";
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    setNotifications(mockNotifications[userRole]);
  }, [userRole]);

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="flex min-h-screen flex-col bg-black md:flex-row">
      <Sidebar navItems={sidebarNavItems} />

      <div className="flex min-w-0 flex-1 flex-col pb-20 md:pb-0">
        <TopBar user={mockUser} />

        <main className="flex-1 px-4 py-8 md:px-12 max-w-4xl mx-auto w-full">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            {notifications.length > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-sm font-bold text-green-500 hover:text-green-400"
              >
                Mark All as Read
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-4 text-6xl text-zinc-700">🔔</div>
              <h2 className="text-xl font-semibold text-white">No notifications yet</h2>
              <p className="text-zinc-500">We&apos;ll let you know when something important happens.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {notifications.map((notif) => (
                <NotificationCard
                  key={notif.id}
                  notification={notif}
                  onMarkAsRead={handleMarkAsRead}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
