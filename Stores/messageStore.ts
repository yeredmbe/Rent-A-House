/**
 * stores/messageStore.ts
 *
 * Messages are now fully real-time via Convex.
 * Sockets (socket.io) are no longer needed for message delivery.
 *
 * In your chat screen, use:
 *   const messages = useQuery(api.messages.getMessages, { userA: myId, userB: otherId });
 *
 * This query re-runs automatically whenever a new message is inserted — instant,
 * no polling, no socket connection to maintain.
 */

import { create } from "zustand";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import { convex } from "./authStore";

interface MessageState {
  isLoading: boolean;
  selectedUser: { _id: Id<"users">; name: string } | null;
  setSelectedUser: (user: { _id: Id<"users">; name: string } | null) => void;

  sendMessage: (
    senderId: Id<"users">,
    receiverId: Id<"users">,
    msg: { text?: string; image_url?: string }
  ) => Promise<void>;

  markAsRead: (senderId: Id<"users">, receiverId: Id<"users">) => Promise<void>;
  countUnread: (userId: Id<"users">) => Promise<number>;

  adminBroadcast: (
    adminId: Id<"users">,
    payload: { text?: string; image_url?: string; targetRole?: "client" | "landLord" }
  ) => Promise<{ sent: number }>;
}

export const messageStore = create<MessageState>((set) => ({
  isLoading: false,
  selectedUser: null,

  setSelectedUser: (user) => set({ selectedUser: user }),

  // ── SEND MESSAGE ────────────────────────────────────────────────────────────
  // image_url should already be a Cloudinary secure_url — upload on the client first.
  sendMessage: async (senderId, receiverId, msg) => {
    set({ isLoading: true });
    try {
      await convex.mutation(api.messages.sendMessage, {
        senderId,
        receiverId,
        text: msg.text,
        image_url: msg.image_url,
      });
      // No need to manually update local state — useQuery re-runs automatically.
    } catch (err) {
      console.error("sendMessage error:", err);
    } finally {
      set({ isLoading: false });
    }
  },

  // ── MARK MESSAGES AS READ ───────────────────────────────────────────────────
  markAsRead: async (senderId, receiverId) => {
    try {
      await convex.mutation(api.messages.markMessagesAsRead, {
        senderId,
        receiverId,
      });
    } catch (err) {
      console.error("markAsRead error:", err);
    }
  },

  // ── COUNT UNREAD ────────────────────────────────────────────────────────────
  // Prefer useQuery(api.messages.countUnreadMessages, { userId }) in components
  // for live badge counts.
  countUnread: async (userId) => {
    try {
      return await convex.query(api.messages.countUnreadMessages, { userId });
    } catch {
      return 0;
    }
  },

  // ── ADMIN BROADCAST ─────────────────────────────────────────────────────────
  adminBroadcast: async (adminId, payload) => {
    return await convex.mutation(api.messages.adminBroadcast, {
      adminId,
      ...payload,
    });
  },
}));

// ─── REAL-TIME HOOKS ──────────────────────────────────────────────────────────
//
// Conversation messages (live, replaces socket "newMessage" event):
//   const messages = useQuery(api.messages.getMessages, { userA: myId, userB: otherId });
//
// Chat user list (live):
//   const chatUsers = useQuery(api.messages.getChatUsers, { userId: myId });
//
// Unread badge count (live):
//   const unread = useQuery(api.messages.countUnreadMessages, { userId: myId });