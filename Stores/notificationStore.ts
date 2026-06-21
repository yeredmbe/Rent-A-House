/**
 * stores/notificationStore.ts
 *
 * Notifications are real-time via Convex.
 * In your notification screen use:
 *   const notifications = useQuery(api.notifications.getNotifications, { userId });
 *
 * The bell badge count:
 *   const count = useQuery(api.notifications.countUnread, { userId });
 *
 * Both update instantly when a new notification is inserted.
 */

import { create } from "zustand";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { convex } from "./authStore";

interface NotificationState {
  isLoading: boolean;
  markAsRead: (notificationId: Id<"notifications">) => Promise<void>;
  markAllAsRead: (userId: Id<"users">) => Promise<void>;
  deleteNotification: (notificationId: Id<"notifications">, userId: Id<"users">) => Promise<void>;
}

export const notificationStore = create<NotificationState>((set) => ({
  isLoading: false,

  markAsRead: async (notificationId) => {
    try {
      await convex.mutation(api.notifications.markAsRead, { notificationId });
    } catch (err) {
      console.error("markAsRead error:", err);
    }
  },

  markAllAsRead: async (userId) => {
    try {
      await convex.mutation(api.notifications.markAllAsRead, { userId });
    } catch (err) {
      console.error("markAllAsRead error:", err);
    }
  },

  deleteNotification: async (notificationId, userId) => {
    try {
      await convex.mutation(api.notifications.deleteNotification, {
        notificationId,
        userId,
      });
    } catch (err) {
      console.error("deleteNotification error:", err);
    }
  },
}));

// ─── REAL-TIME HOOKS ──────────────────────────────────────────────────────────
//
// Notification list (live, replaces polling + socket "newNotification"):
//   const notifications = useQuery(api.notifications.getNotifications, { userId });
//
// Unread badge count (live):
//   const count = useQuery(api.notifications.countUnread, { userId });