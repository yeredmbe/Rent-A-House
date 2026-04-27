import { v } from "convex/values";
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
                        ? { _id: sender._id, name: sender.name, email: sender.email, image_url: sender.image_url }
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
        if (!notif) throw new Error("NOTIFICATION_NOT_FOUND");
        if (notif.receiverId !== args.userId) throw new Error("UNAUTHORIZED");
        await ctx.db.delete(args.notificationId);
        return { success: true };
    },
});