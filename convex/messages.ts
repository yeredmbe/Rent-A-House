import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
export const sendMessage = mutation({
    args: {
        senderId: v.id("users"),
        receiverId: v.id("users"),
        text: v.optional(v.string()),
        image_url: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.senderId === args.receiverId)
            throw new ConvexError("CANNOT_MESSAGE_SELF");
        if (!args.text && !args.image_url)
            throw new ConvexError("MESSAGE_CONTENT_REQUIRED");

        const receiver = await ctx.db.get(args.receiverId);
        if (!receiver) throw new ConvexError("RECEIVER_NOT_FOUND");

        const messageId = await ctx.db.insert("messages", {
            senderId: args.senderId,
            receiverId: args.receiverId,
            text: args.text,
            image_url: args.image_url,
            readByReceiver: false,
            readBySender: true,
        });

        // Create message notification
        await ctx.db.insert("notifications", {
            senderId: args.senderId,
            receiverId: args.receiverId,
            notification_type: "message",
            messageId,
            isRead: false,
        });

        // Auto-add each other to chat_users (chat list) if not already there
        const sender = await ctx.db.get(args.senderId);
        if (sender) {
            const senderChats = sender.chat_users ?? [];
            if (!senderChats.includes(args.receiverId)) {
                await ctx.db.patch(args.senderId, {
                    chat_users: [...senderChats, args.receiverId],
                });
            }
        }

        const receiverChats = receiver.chat_users ?? [];
        if (!receiverChats.includes(args.senderId)) {
            await ctx.db.patch(args.receiverId, {
                chat_users: [...receiverChats, args.senderId],
            });
        }

        return messageId;
    },
});

// ─── GET CONVERSATION MESSAGES ────────────────────────────────────────────────
// Real-time: the query is reactive — the chat screen auto-updates when new
// messages arrive without any polling or socket setup.
export const getMessages = query({
    args: {
        userA: v.id("users"),
        userB: v.id("users"),
    },
    handler: async (ctx, args) => {
        const sent = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
                q.eq("senderId", args.userA).eq("receiverId", args.userB)
            )
            .collect();

        const received = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
                q.eq("senderId", args.userB).eq("receiverId", args.userA)
            )
            .collect();

        const all = [...sent, ...received].sort(
            (a, b) => a._creationTime - b._creationTime
        );

        return Promise.all(
            all.map(async (msg) => {
                const sender = await ctx.db.get(msg.senderId);
                return {
                    ...msg,
                    // FIX: replace raw senderId with populated object including _id
                    senderId: sender
                        ? { _id: sender._id, name: sender.name, email: sender.email, image_url: sender.image_url }
                        : null,
                };
            })
        );
    },
});

export const getChatUsers = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return [];

        const chatUsers = user.chat_users ?? [];
        const result = await Promise.all(
            chatUsers.map(async (favId) => {
                const favUser = await ctx.db.get(favId);
                if (!favUser) return null;
                const { password: _pw, ...safe } = favUser;

                const sent = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation", (q) =>
                        q.eq("senderId", args.userId).eq("receiverId", favId)
                    )
                    .order("desc")
                    .first();

                const received = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation", (q) =>
                        q.eq("senderId", favId).eq("receiverId", args.userId)
                    )
                    .order("desc")
                    .first();

                const lastMessage = !sent ? received
                    : !received ? sent
                        : sent._creationTime > received._creationTime ? sent : received;

                const unreadCount = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation", (q) =>
                        q.eq("senderId", favId).eq("receiverId", args.userId)
                    )
                    .filter((q) => q.eq(q.field("isRead"), false))
                    .collect()
                    .then((msgs) => msgs.length);

                return {
                    ...safe,
                    unreadCount,
                    lastMessage: lastMessage
                        ? { text: lastMessage.text, image_url: lastMessage.image_url, _creationTime: lastMessage._creationTime }
                        : null,
                };
            })
        ).then((list) => list.filter(Boolean));

        // FIX: correct sort syntax with two separate parameters
        return result.sort((a: any, b: any) => {
            const aTime = a.lastMessage?._creationTime ?? 0;
            const bTime = b.lastMessage?._creationTime ?? 0;
            return bTime - aTime;
        });
    },
});

// ─── MARK MESSAGES AS READ ────────────────────────────────────────────────────
export const markMessagesAsRead = mutation({
    args: {
        senderId: v.id("users"),  // the person whose messages we're marking read
        receiverId: v.id("users"), // current user (the reader)
    },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
                q.eq("senderId", args.senderId).eq("receiverId", args.receiverId)
            )
            .filter((q) => q.eq(q.field("readByReceiver"), false))
            .collect();

        await Promise.all(
            unread.map((msg) => ctx.db.patch(msg._id, { readByReceiver: true }))
        );

        return { count: unread.length };
    },
});

// ─── COUNT UNREAD MESSAGES ────────────────────────────────────────────────────
export const countUnreadMessages = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("messages")
            .withIndex("by_receiverId", (q) => q.eq("receiverId", args.userId))
            .filter((q) => q.eq(q.field("readByReceiver"), false))
            .collect();
        return unread.length;
    },
});

// ─── ADMIN BROADCAST MESSAGE ──────────────────────────────────────────────────
export const adminBroadcast = mutation({
    args: {
        adminId: v.id("users"),
        text: v.optional(v.string()),
        image_url: v.optional(v.string()),
        // optional: filter by role. If omitted, sends to all non-admin users
        targetRole: v.optional(
            v.union(v.literal("client"), v.literal("landLord"))
        ),
    },
    handler: async (ctx, args) => {
        if (!args.text && !args.image_url)
            throw new ConvexError("MESSAGE_CONTENT_REQUIRED");

        let targets = await ctx.db.query("users").collect();
        targets = targets.filter((u) => u._id !== args.adminId && u.role !== "admin");
        if (args.targetRole) {
            targets = targets.filter((u) => u.role === args.targetRole);
        }

        const notifText = args.text
            ? `System message: ${args.text.substring(0, 100)}${args.text.length > 100 ? "…" : ""}`
            : "System message: New image notification";

        await Promise.all(
            targets.map(async (user) => {
                const msgId = await ctx.db.insert("messages", {
                    senderId: args.adminId,
                    receiverId: user._id,
                    text: args.text,
                    image_url: args.image_url,
                    readByReceiver: false,
                    readBySender: true,
                });
                await ctx.db.insert("notifications", {
                    senderId: args.adminId,
                    receiverId: user._id,
                    notification_type: "system",
                    messageId: msgId,
                    isRead: false,
                    text: notifText,
                });
            })
        );

        return { sent: targets.length };
    },
});

// ═══════════════════════════════════════════════════════════════════════════════
// ─── DASHBOARD-ONLY FUNCTIONS ─────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════

// ── Broadcast Messages ────────────────────────────────────────────────────────

/** List all broadcast messages */
export const listBroadcasts = query({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db
      .query("broadcastMessages")
      .withIndex("by_sentAt")
      .order("desc")
      .collect();
    return await Promise.all(
      messages.map(async (msg) => {
        const sender = await ctx.db.get(msg.senderId);
        return { ...msg, sender };
      })
    );
  },
});

/** Send a broadcast message to all / landlords / clients */
export const sendBroadcast = mutation({
  args: {
    title: v.string(),
    content: v.string(),
    senderId: v.id("users"),
    recipientType: v.union(
      v.literal("all"),
      v.literal("landlords"),
      v.literal("clients")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("broadcastMessages", {
      ...args,
      sentAt: Date.now(),
    });
  },
});

/** Delete a broadcast message */
export const deleteBroadcast = mutation({
  args: { messageId: v.id("broadcastMessages") },
  handler: async (ctx, { messageId }) => {
    await ctx.db.delete(messageId);
  },
});

// ── Direct Messages ───────────────────────────────────────────────────────────

/** List direct messages for a recipient */
export const listDirectMessages = query({
  args: { recipientId: v.id("users") },
  handler: async (ctx, { recipientId }) => {
    return await ctx.db
      .query("directMessages")
      .withIndex("by_recipient", (q) => q.eq("recipientId", recipientId))
      .order("desc")
      .collect();
  },
});

/** All direct messages sent by a user */
export const listSentMessages = query({
  args: { senderId: v.id("users") },
  handler: async (ctx, { senderId }) => {
    return await ctx.db
      .query("directMessages")
      .withIndex("by_sender", (q) => q.eq("senderId", senderId))
      .order("desc")
      .collect();
  },
});

/** Send a direct message */
export const sendDirectMessage = mutation({
  args: {
    content: v.string(),
    senderId: v.id("users"),
    recipientId: v.id("users"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("directMessages", {
      ...args,
      isRead: false,
      sentAt: Date.now(),
    });
  },
});

/** Mark message as read */
export const markAsRead = mutation({
  args: { messageId: v.id("directMessages") },
  handler: async (ctx, { messageId }) => {
    await ctx.db.patch(messageId, { isRead: true });
  },
});

/** Count unread messages for a user */
export const countUnread = query({
  args: { recipientId: v.id("users") },
  handler: async (ctx, { recipientId }) => {
    const msgs = await ctx.db
      .query("directMessages")
      .withIndex("by_recipient", (q) => q.eq("recipientId", recipientId))
      .collect();
    return msgs.filter((m) => !m.isRead).length;
  },
});
