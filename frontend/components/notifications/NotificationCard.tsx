// components/notifications/NotificationCard.tsx
"use client";

import { Notification } from "@/types/notification";
import Link from "next/link";

interface NotificationCardProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

export default function NotificationCard({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationCardProps) {
  return (
    <div
      className={`relative flex flex-col gap-2 rounded-lg p-4 transition-colors ${
        notification.isRead ? "bg-zinc-900/50" : "bg-zinc-800 border-l-4 border-green-500"
      }`}
    >
      {!notification.isRead && (
        <span className="absolute top-4 right-4 h-2 w-2 rounded-full bg-green-500" />
      )}

      <div className="flex justify-between items-start pr-6">
        <h3 className={`font-bold ${notification.isRead ? "text-zinc-400" : "text-white"}`}>
          {notification.title}
        </h3>
        <span className="text-xs text-zinc-500">
          {new Date(notification.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="text-sm text-zinc-400">{notification.message}</p>

      <div className="mt-2 flex items-center gap-4">
        {notification.link && (
          <Link
            href={notification.link}
            className="text-xs font-bold text-green-500 hover:underline"
          >
            VIEW DETAILS
          </Link>
        )}
        
        {!notification.isRead && (
          <button
            onClick={() => onMarkAsRead(notification.id)}
            className="text-xs font-medium text-zinc-300 hover:text-white"
          >
            Mark as Read
          </button>
        )}

        <button
          onClick={() => onDelete(notification.id)}
          className="text-xs font-medium text-red-500/80 hover:text-red-400"
        >
          Delete
        </button>
      </div>
    </div>
  );
}
