import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── HELPERS ────────────────────────────────────────────────────────────────
// Convex runs in V8 isolates — use the Web Crypto API (available globally).
// We store bcrypt hashes coming IN from the client (React Native calls bcryptjs
// before hitting Convex), or we handle hashing here via a helper action.
// For simplicity we keep password hashing in a Convex action (see auth.actions.ts).

// ─── REGISTER ───────────────────────────────────────────────────────────────
/**
 * Called AFTER the client has hashed the password (or call the action version).
 * Returns the new user's _id so the client can generate a JWT.
 *
 * FIX from original code:
 *  - Welcome notification was created with a wrong senderId reference.
 *    Now we look up the admin first and fail gracefully if none exists,
 *    creating the user anyway (non-admin users still get the welcome msg once
 *    an admin is seeded).
 */
export const register = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        hashedPassword: v.string(),
        role: v.optional(
            v.union(v.literal("client"), v.literal("landLord"), v.literal("admin"))
        ),
    },
    handler: async (ctx, args) => {
        // 1. Check duplicate email
        const existing = await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();

        if (existing) {
            throw new Error("USER_EXISTS");
        }

        const role = args.role ?? "client";

        // 2. Create user
        const userId = await ctx.db.insert("users", {
            name: args.name,
            email: args.email,
            password: args.hashedPassword,
            role,
            favorites: [],
            chat_users: [],
            isVerified: false,
            isSubscribed: false,
            subscriptionPlanType: "free",
            ExpoPushToken: "",
            location: "Yaounde",
        });

        if (role === "admin") {
            return { userId };
        }

        // 3. Find admin for welcome message
        const admin = await ctx.db
            .query("users")
            .withIndex("by_role", (q) => q.eq("role", "admin"))
            .first();

        if (!admin) {
            // No admin seeded yet — user is created, skip welcome message
            return { userId };
        }

        // 4. Add admin to new user's chat_users so they appear in chat list
        await ctx.db.patch(userId, { chat_users: [admin._id] });

        // 5. Welcome message
        const welcomeText =
            role === "client"
                ? `You're In! Let's Get Your Profile Ready 🏠\n\nHello ${args.name},\n\nA massive welcome to Rent-A-House! ✨\n\nPlease take a moment to finish setting up your profile. By adding your location, you'll be the first to know when a perfect house pops up in your area! 🚀\n\nHappy house hunting!\nThe Rent-A-House Team`
                : `Welcome to Rent-A-House, dear Landlord! 🏠✨\n\nHello ${args.name},\n\nWelcome as a landlord on our platform. 🤝\n\nFinalize your profile to start publishing listings and reach potential tenants. 📍\n\nThe Rent-A-House Team`;

        const messageId = await ctx.db.insert("messages", {
            senderId: admin._id,
            receiverId: userId,
            text: welcomeText,
            readByReceiver: false,
            readBySender: true,
        });

        // 6. Welcome notification — FIX: was previously missing the messageId link
        await ctx.db.insert("notifications", {
            senderId: admin._id,
            receiverId: userId,
            notification_type: "welcome",
            messageId,
            isRead: false,
        });

        return { userId, messageId };
    },
});

// ─── LOGIN ───────────────────────────────────────────────────────────────────
/**
 * Returns the user document (including hashed password) so the caller
 * (a Convex HTTP action) can verify with bcrypt and issue a JWT.
 */
export const getUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .unique();
    },
});

// ─── GET CURRENT USER ────────────────────────────────────────────────────────
export const getById = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;
        // Strip password before returning
        const { password: _pw, ...safe } = user;
        return safe;
    },
});

// ─── EDIT USER INFO ──────────────────────────────────────────────────────────
export const editUser = mutation({
    args: {
        userId: v.id("users"),
        name: v.optional(v.string()),
        email: v.optional(v.string()),
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
    },
    handler: async (ctx, args) => {
        const { userId, ...fields } = args;
        const user = await ctx.db.get(userId);
        if (!user) throw new Error("USER_NOT_FOUND");

        // Validate age
        if (fields.age !== undefined && (fields.age <= 18 || fields.age > 80)) {
            throw new Error("INVALID_AGE");
        }

        const patch: Record<string, unknown> = {};
        if (fields.name !== undefined) patch.name = fields.name;
        if (fields.email !== undefined) patch.email = fields.email;
        if (fields.age !== undefined) patch.age = fields.age;
        if (fields.location !== undefined) patch.location = fields.location;

        await ctx.db.patch(userId, patch);
        const updated = await ctx.db.get(userId);
        if (!updated) throw new Error("USER_NOT_FOUND");
        const { password: _pw, ...safe } = updated;
        return safe;
    },
});

// ─── EDIT PROFILE IMAGE ──────────────────────────────────────────────────────
export const editProfileImage = mutation({
    args: {
        userId: v.id("users"),
        image_url: v.string(),
        image_public_id: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("USER_NOT_FOUND");
        await ctx.db.patch(args.userId, {
            image_url: args.image_url,
            image_public_id: args.image_public_id,
        });
        const updated = await ctx.db.get(args.userId);
        if (!updated) throw new Error("USER_NOT_FOUND");
        const { password: _pw, ...safe } = updated;
        return safe;
    },
});

// ─── GET USER PROFILE (public) ───────────────────────────────────────────────
export const getUserProfile = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return null;
        const { password: _pw, ...safe } = user;
        return safe;
    },
});

// ─── UPDATE EXPO PUSH TOKEN ──────────────────────────────────────────────────
export const updatePushToken = mutation({
    args: { userId: v.id("users"), token: v.string() },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, { ExpoPushToken: args.token });
    },
});

// ─── SUBSCRIPTION ────────────────────────────────────────────────────────────
export const setSubscription = mutation({
    args: {
        userId: v.id("users"),
        planType: v.union(
            v.literal("1month"),
            v.literal("3months"),
            v.literal("6months"),
            v.literal("1year")
        ),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const expiry = new Date(now);
        switch (args.planType) {
            case "1month":
                expiry.setMonth(expiry.getMonth() + 1);
                break;
            case "3months":
                expiry.setMonth(expiry.getMonth() + 3);
                break;
            case "6months":
                expiry.setMonth(expiry.getMonth() + 6);
                break;
            case "1year":
                expiry.setFullYear(expiry.getFullYear() + 1);
                break;
        }
        await ctx.db.patch(args.userId, {
            subscriptionPlanType: args.planType,
            isSubscribed: true,
            subscriptionDueDate: now,
            subscriptionExpiryDate: expiry.getTime(),
        });
        return { expiryDate: expiry.getTime() };
    },
});

export const checkSubscription = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("USER_NOT_FOUND");

        if (!user.isSubscribed) {
            return { isSubscribed: false, planType: "free" };
        }

        const now = Date.now();
        const expiry = user.subscriptionExpiryDate ?? 0;

        if (expiry <= now) {
            // Expired — caller should call resetSubscription mutation
            return { isSubscribed: false, planType: "free", expired: true };
        }

        return {
            isSubscribed: true,
            planType: user.subscriptionPlanType,
            expiryDate: expiry,
        };
    },
});

export const resetSubscription = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.userId, {
            isSubscribed: false,
            subscriptionPlanType: "free",
        });
    },
});