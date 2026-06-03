import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── GET NOTIFICATIONS FOR A USER ────────────────────────────────────────────
// Real-time: automatically pushes updates to subscribed clients.
export const getNotifications = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_receiverId", (q) => q.eq("receiverId", args.userId))
            .order("desc")
            .collect();

        return Promise.all(
            notifications.map(async (n) => {
                const sender = await ctx.db.get(n.senderId);
                const home = n.homeId ? await ctx.db.get(n.homeId) : null;
                return {
                    ...n,
                    // FIX: replace raw senderId with populated object
                    senderId: sender
                        ? { _id: sender._id, name: sender.name, email: sender.email, image_url: sender.image_url, role: sender.role }
                        : null,
                    // FIX: replace raw homeId with populated object
                    homeId: home
                        ? { _id: home._id, home_cover: home.home_cover, address: home.address }
                        : null,
                };
            })
        );
    },
});

// ─── COUNT UNREAD NOTIFICATIONS ───────────────────────────────────────────────
export const countUnread = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_receiverId_isRead", (q) =>
                q.eq("receiverId", args.userId).eq("isRead", false)
            )
            .collect();
        return unread.length;
    },
});

// ─── MARK NOTIFICATION AS READ ────────────────────────────────────────────────
export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notificationId, { isRead: true });
    },
});

// ─── MARK ALL NOTIFICATIONS AS READ ──────────────────────────────────────────
export const markAllAsRead = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_receiverId_isRead", (q) =>
                q.eq("receiverId", args.userId).eq("isRead", false)
            )
            .collect();

        await Promise.all(
            unread.map((n) => ctx.db.patch(n._id, { isRead: true }))
        );

        return { count: unread.length };
    },
});

// ─── DELETE NOTIFICATION ──────────────────────────────────────────────────────
export const deleteNotification = mutation({
    args: {
        notificationId: v.id("notifications"),
        userId: v.id("users"), // ownership check
    },
    handler: async (ctx, args) => {
        const notif = await ctx.db.get(args.notificationId);
        if (!notif) throw new ConvexError("NOTIFICATION_NOT_FOUND");
        if (notif.receiverId !== args.userId) throw new ConvexError("UNAUTHORIZED");
        await ctx.db.delete(args.notificationId);
        return { success: true };
    },
});

// ─── SEND PUSH NOTIFICATION ───────────────────────────────────────────────────
/**
 * Helper: Sends an actual push notification to a user's device
 * Called after creating a notification in the database
 */
export const sendPushNotification = mutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
        body: v.string(),
        data: v.optional(v.any()), // homeId, messageId, etc.
    },
    handler: async (ctx, args) => {
        try {
            const user = await ctx.db.get(args.userId);
            if (!user?.ExpoPushToken) {
                // console.warn(`[push] User ${args.userId} has no token`);
                return { success: false, reason: "NO_TOKEN" };
            }

            // Call the HTTP endpoint to send via Expo
            const response = await fetch(
                process.env.EXPO_PUBLIC_CONVEX_SITE_URL
                    ? `${process.env.EXPO_PUBLIC_CONVEX_SITE_URL}/api/v1/notifications/send`
                    : "http://localhost:3210/api/v1/notifications/send",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        userId: args.userId,
                        title: args.title,
                        body: args.body,
                        data: args.data || {},
                    }),
                }
            );

            if (!response.ok) {
                const error = await response.json();
                // console.error(`[push] Failed to send to user ${args.userId}:`, error);
                return { success: false, reason: "EXPO_ERROR", error };
            }

            // console.log(`[push] ✅ Sent to user ${args.userId}`);
            return { success: true };
        } catch (error) {
            const msg = error instanceof Error ? error.message : String(error);
            // console.error(`[push] Error sending notification:`, msg);
            return { success: false, reason: "ERROR", error: msg };
        }
    },
});