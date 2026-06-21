import { ConvexError, v } from "convex/values";
import { api } from "./_generated/api";
import { mutation, query } from "./_generated/server";

// ─── SEND MESSAGE ─────────────────────────────────────────────────────────────
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

        // ✅ scheduler.runAfter instead of ctx.runMutation
        const sender = await ctx.db.get(args.senderId);
        await ctx.scheduler.runAfter(0, api.notifications.sendPushNotification, {
            userId: args.receiverId,
            title: `💬 Message from ${sender?.name || "Someone"}`,
            body: args.text || "📷 Sent an image",
            data: { messageId: messageId.toString() },
        });

        // Auto-add each other to chat_users
        const senderChats = sender?.chat_users ?? [];
        if (!senderChats.includes(args.receiverId)) {
            await ctx.db.patch(args.senderId, {
                chat_users: [...senderChats, args.receiverId],
            });
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
                   .filter((q) => q.eq(q.field("readByReceiver"), false))
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
const normalizeBroadcastRecipientType = (type: string) => {
    if (type === "all") return "all";
    if (type === "landlords") return "landLord";
    if (type === "clients") return "client";
    if (type === "client" || type === "landLord") return type;
    return "all";
};

const selectBroadcastTargets = async (ctx: any, adminId: any, recipientType: string) => {
    let targets: any[] = await ctx.db.query("users").collect();
    targets = targets.filter((u: any) => u._id !== adminId && u.role !== "admin");
    if (recipientType !== "all") {
        const role = normalizeBroadcastRecipientType(recipientType);
        targets = targets.filter((u: any) => u.role === role);
    }
    return targets;
};

const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
    }
    return chunks;
};

const deliverBroadcastToUsers = async (
    ctx: any,
    adminId: any,
    text: string | undefined,
    image_url: string | undefined,
    recipientType: string,
    notifText: string
) => {
    const targets = await selectBroadcastTargets(ctx, adminId, recipientType);
    const admin = await ctx.db.get(adminId);
    const adminChats = admin?.chat_users ?? [];
    const adminChatIds = new Set(adminChats.map((id: any) => id.toString()));
    const updatedAdminChats = [...adminChats];

    const pushPayloads: any[] = [];

    await Promise.all(
        targets.map(async (user: any) => {
            const msgId = await ctx.db.insert("messages", {
                senderId: adminId,
                receiverId: user._id,
                text,
                image_url,
                readByReceiver: false,
                readBySender: true,
            });
            await ctx.db.insert("notifications", {
                senderId: adminId,
                receiverId: user._id,
                notification_type: "system",
                messageId: msgId,
                isRead: false,
                text: notifText,
            });

            // Only queue a push payload if the user actually has a token
            const token = user.ExpoPushToken;
            if (token && (token.startsWith("ExponentPushToken[") || token.startsWith("ExpoPushToken["))) {
                pushPayloads.push({
                    userId: user._id,
                    token,
                    title: `📢 Message from ${admin?.name || "Admin"}`,
                    body: notifText || "📷 Sent an image",
                    data: { messageId: msgId.toString() },
                });
            }

            const targetChats = user.chat_users ?? [];
            if (!targetChats.some((id: any) => id.toString() === adminId.toString())) {
                await ctx.db.patch(user._id, {
                    chat_users: [...targetChats, adminId],
                });
            }

            if (!adminChatIds.has(user._id.toString())) {
                adminChatIds.add(user._id.toString());
                updatedAdminChats.push(user._id);
            }
        })
    );

    if (admin && updatedAdminChats.length !== adminChats.length) {
        await ctx.db.patch(adminId, {
            chat_users: updatedAdminChats,
        });
    }

    // ✅ Schedule one batch action per 100 users instead of one action per user
    const batches = chunkArray(pushPayloads, 100);
    await Promise.all(
        batches.map((batch) =>
            ctx.scheduler.runAfter(0, api.notifications.sendBatchedPushNotificationBatch, {
                notifications: batch,
            })
        )
    );

    return targets.length;
};
export const adminBroadcast = mutation({
    args: {
        adminId: v.id("users"),
        text: v.optional(v.string()),
        image_url: v.optional(v.string()),
        targetRole: v.optional(
            v.union(
                v.literal("all"),
                v.literal("client"),
                v.literal("landLord"),
                v.literal("landlords"),
                v.literal("clients")
            )
        ),
    },
    handler: async (ctx, args) => {
        if (!args.text && !args.image_url)
            throw new ConvexError("MESSAGE_CONTENT_REQUIRED");

        const recipientType = args.targetRole || "all";
        const notifText = args.text
            ? `System message: ${args.text.substring(0, 100)}${args.text.length > 100 ? "…" : ""}`
            : "System message: New image notification";

        const sentCount = await deliverBroadcastToUsers(
            ctx,
            args.adminId,
            args.text,
            args.image_url,
            recipientType,
            notifText
        );

        return { sent: sentCount };
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
        const broadcastId = await ctx.db.insert("broadcastMessages", {
            ...args,
            sentAt: Date.now(),
        });

        const text = `${args.title}\n\n${args.content}`;
        const notifText = `System message: ${args.title.substring(0, 100)}${args.title.length > 100 ? "…" : ""}`;
        await deliverBroadcastToUsers(ctx, args.senderId, text, undefined, args.recipientType, notifText);

        return broadcastId;
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

/** List all received messages for a recipient (including system/admin messages) */
export const listReceivedMessages = query({
    args: { receiverId: v.id("users") },
    handler: async (ctx, { receiverId }) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_receiverId", (q) => q.eq("receiverId", receiverId))
            .order("desc")
            .collect();

        return await Promise.all(
            messages.map(async (m) => {
                const sender = await ctx.db.get(m.senderId);
                return {
                    ...m,
                    sender: sender ? { _id: sender._id, name: sender.name, email: sender.email, image_url: sender.image_url } : null,
                };
            })
        );
    },
});

/** All messages sent by a user (includes admin broadcasts delivered as messages) */
export const listSentMessages = query({
  args: { senderId: v.id("users") },
  handler: async (ctx, { senderId }) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_senderId", (q) => q.eq("senderId", senderId))
      .order("desc")
      .collect();

    return await Promise.all(
      messages.map(async (m) => {
        const receiver = await ctx.db.get(m.receiverId);
        return {
          ...m,
          receiver: receiver
            ? { _id: receiver._id, name: receiver.name, email: receiver.email, image_url: receiver.image_url }
            : null,
        };
      })
    );
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
