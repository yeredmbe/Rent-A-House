import { ConvexError, v } from "convex/values";
import { api } from "./_generated/api";
import { action, mutation, query } from "./_generated/server";

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


export const sendPushNotification = action({
  args: {
    userId: v.id("users"),
    title: v.string(),
    body: v.string(),
    data: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    // ✅ Actions can query the DB via ctx.runQuery
    const user = await ctx.runQuery(api.users.getUserById, { userId: args.userId });

    if (!user?.ExpoPushToken) {
      console.warn(`[push] User ${args.userId} has no token`);
      return { success: false, reason: "NO_TOKEN" };
    }

    const token = user.ExpoPushToken;

    // ✅ Validate it's a real Expo push token
    if (!token.startsWith("ExponentPushToken[") && !token.startsWith("ExpoPushToken[")) {
      console.warn(`[push] Invalid token format: ${token}`);
      return { success: false, reason: "INVALID_TOKEN" };
    }

    // ✅ Actions CAN make fetch calls — send directly to Expo
    const response = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate",
      },
      body: JSON.stringify({
        to: token,
        title: args.title,
        body: args.body,
        data: args.data ?? {},
        sound: "default",
        badge: 1,
        priority: "high",
      }),
    });

    const result = await response.json();

    // Expo returns { data: { status: "ok" } } on success
    if (result?.data?.status === "ok") {
      console.log(`[push] ✅ Sent to user ${args.userId}`);
      return { success: true };
    }

    // Handle Expo-level errors
    const expoError = result?.data;
    console.error(`[push] ❌ Expo error for user ${args.userId}:`, expoError);

    // If the token is invalid/expired, clean it from the DB
    if (
      expoError?.details?.error === "DeviceNotRegistered" ||
      expoError?.details?.error === "InvalidCredentials"
    ) {
      await ctx.runMutation(api.users.clearPushToken, { userId: args.userId });
      console.log(`[push] 🧹 Cleared stale token for user ${args.userId}`);
    }

    return { success: false, reason: expoError?.details?.error ?? "EXPO_ERROR", error: expoError };
  },
});