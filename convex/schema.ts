import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        password: v.string(), // bcrypt hashed
        age: v.optional(v.number()),
        location: v.optional(
            v.union(
                v.literal("Bafoussam"),
                v.literal("Douala"),
                v.literal("Yaounde"),
                v.literal("Buea"),
                v.literal("Bamenda"),
                v.literal("Garoua"),
                v.literal("Maroua"),
                v.literal("Ngaoundere"),
                v.literal("Adamawa"),
                v.literal("Bertoua")
            )
        ),
        image_url: v.optional(v.string()),
        image_public_id: v.optional(v.string()),
        role: v.union(v.literal("client"), v.literal("landLord"), v.literal("admin")),
        favorites: v.array(v.id("homes")),
        chat_users: v.optional(v.array(v.id("users"))),
        userIDCard: v.optional(v.string()),
        isVerified: v.boolean(),
        subscriptionPlanType: v.union(
            v.literal("free"),
            v.literal("1month"),
            v.literal("3months"),
            v.literal("6months"),
            v.literal("1year")
        ),
        isSubscribed: v.boolean(),
        subscriptionDueDate: v.optional(v.number()), // Unix ms
        subscriptionExpiryDate: v.optional(v.number()), // Unix ms
        ExpoPushToken: v.optional(v.string()),
    })
        .index("by_email", ["email"])
        .index("by_role", ["role"])
        .index("by_location", ["location"]),

    homes: defineTable({
        userId: v.id("users"),
        city: v.string(),
        address: v.string(),
        price: v.number(),
        category: v.union(
            v.literal("House"),
            v.literal("Apartment"),
            v.literal("Villa"),
            v.literal("Shop"),
            v.literal("Office"),
            v.literal("Studio"),
            v.literal("Penthouse"),
            v.literal("Townhouse"),
            v.literal("Duplex"),
            v.literal("Bungalow"),
            v.literal("Cottage"),
            v.literal("Mansion"),
            v.literal("Room"),
            v.literal("Store")
        ),
        telephone: v.string(),
        home_cover: v.string(),
        description: v.string(),
        region: v.union(
            v.literal("Bafoussam"),
            v.literal("Douala"),
            v.literal("Yaounde"),
            v.literal("Buea"),
            v.literal("Bamenda"),
            v.literal("Garoua"),
            v.literal("Maroua"),
            v.literal("Ngaoundere"),
            v.literal("Adamawa"),
            v.literal("Bertoua")
        ),
        whatsapp_url: v.string(),
        facebook_url: v.optional(v.string()),
        details: v.array(v.string()), // array of image URLs
        isAvailable: v.boolean(),
        isApproved: v.boolean(),
        lat: v.optional(v.string()),
        long: v.optional(v.string()),
    })
        .index("by_userId", ["userId"])
        .index("by_region", ["region"])
        .index("by_category", ["category"])
        .index("by_available", ["isAvailable"])
        .index("by_region_available", ["region", "isAvailable"]),

    reviews: defineTable({
        homeId: v.id("homes"),
        userId: v.id("users"),
        text: v.string(),
    })
        .index("by_homeId", ["homeId"])
        .index("by_userId", ["userId"]),

    messages: defineTable({
        senderId: v.id("users"),
        receiverId: v.id("users"),
        text: v.optional(v.string()),
        image_url: v.optional(v.string()),
        readByReceiver: v.boolean(),
        readBySender: v.boolean(),
    })
        .index("by_senderId", ["senderId"])
        .index("by_receiverId", ["receiverId"])
        // composite index for conversation lookup
        .index("by_conversation", ["senderId", "receiverId"]),

    notifications: defineTable({
        senderId: v.id("users"),
        receiverId: v.id("users"),
        notification_type: v.union(
            v.literal("new_house"),
            v.literal("favorites"),
            v.literal("message"),
            v.literal("alert"),
            v.literal("welcome"),
            v.literal("info"),
            v.literal("review"),
            v.literal("system")
        ),
        homeId: v.optional(v.id("homes")),
        messageId: v.optional(v.id("messages")),
        isRead: v.boolean(),
        text: v.optional(v.string()), // for system/admin notifications
    })
        .index("by_receiverId", ["receiverId"])
        .index("by_receiverId_isRead", ["receiverId", "isRead"]),
});