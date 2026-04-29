import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── SHARED REGION/CATEGORY VALIDATORS ──────────────────────────────────────
const regionValidator = v.union(
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
);

const categoryValidator = v.union(
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
);

// ─── CREATE HOME ─────────────────────────────────────────────────────────────
export const createHome = mutation({
    args: {
        userId: v.id("users"),
        address: v.string(),
        description: v.string(),
        city: v.string(),
        telephone: v.string(),
        category: categoryValidator,
        price: v.number(),
        home_cover: v.string(),
        whatsapp_url: v.string(),
        facebook_url: v.optional(v.string()),
        region: regionValidator,
        details: v.array(v.string()),
        lat: v.optional(v.string()),
        long: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.price <= 5000) throw new Error("PRICE_TOO_LOW");
        if (args.details.length < 3 || args.details.length > 10) return
        // throw new Error("INVALID_DETAILS_COUNT");

        const phoneRegex = /^[0-9]{9,15}$/;
        if (!phoneRegex.test(args.telephone.replace(/\D/g, ""))) return
        // throw new Error("INVALID_PHONE");

        const whatsappRegex = /^(https?:\/\/)?(wa\.me|api\.whatsapp\.com|chat\.whatsapp\.com)\/.+/i;
        if (!whatsappRegex.test(args.whatsapp_url.trim())) return
        //  {
        //     throw new Error("INVALID_WHATSAPP_LINK");
        // }

        const homeId = await ctx.db.insert("homes", {
            userId: args.userId,
            address: args.address,
            description: args.description,
            city: args.city,
            telephone: args.telephone,
            category: args.category,
            price: args.price,
            home_cover: args.home_cover,
            whatsapp_url: args.whatsapp_url,
            facebook_url: args.facebook_url ?? "",
            region: args.region,
            details: args.details,
            isAvailable: true,
            isApproved: true,
            lat: args.lat ?? "",
            long: args.long ?? "",
        });

        // Notify users in the same region
        // We do this in the same mutation for atomicity
        const usersInRegion = await ctx.db
            .query("users")
            .withIndex("by_location", (q) => q.eq("location", args.region))
            .collect();

        for (const user of usersInRegion) {
            if (user._id === args.userId) continue; // skip the poster
            await ctx.db.insert("notifications", {
                senderId: args.userId,
                receiverId: user._id,
                notification_type: "new_house",
                homeId,
                isRead: false,
            });
        }

        return homeId;
    },
});

// ─── GET ALL AVAILABLE HOMES ─────────────────────────────────────────────────
// Real-time: any subscriber will receive updates automatically via Convex's
// reactive query system — no extra setup needed on the client.
export const getAvailableHomes = query({
    args: {},
    handler: async (ctx) => {
        const homes = await ctx.db
            .query("homes")
            .withIndex("by_available", (q) => q.eq("isAvailable", true))
            .order("desc")
            .collect();

        return Promise.all(
            homes.map(async (home) => {
                const user = await ctx.db.get(home.userId);
                return {
                    ...home,
                    owner: user
                        ? { name: user.name, email: user.email, image_url: user.image_url }
                        : null,
                };
            })
        );
    },
});

// ─── RECENTLY POSTED (last 15) ───────────────────────────────────────────────
export const recentlyPosted = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("homes").order("desc").take(15);
    },
});

// ─── GET ONE HOME ─────────────────────────────────────────────────────────────
export const getHome = query({
    args: { homeId: v.id("homes") },
    handler: async (ctx, args) => {
        const home = await ctx.db.get(args.homeId);
        if (!home) return null;

        const owner = await ctx.db.get(home.userId);
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_homeId", (q) => q.eq("homeId", args.homeId))
            .order("desc")
            .collect();

        const reviewsWithUsers = await Promise.all(
            reviews.map(async (r) => {
                const user = await ctx.db.get(r.userId);
                return {
                    ...r,
                    user: user
                        ? { _id: user._id, name: user.name, email: user.email, image_url: user.image_url }
                        : null,
                };
            })
        );

        return {
            ...home,
            owner: owner
                ? { name: owner.name, email: owner.email, image_url: owner.image_url }
                : null,
            reviews: reviewsWithUsers,
        };
    },
});

// ─── GET HOMES BY CATEGORY ───────────────────────────────────────────────────
export const getByCategory = query({
    args: { category: categoryValidator },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("homes")
            .withIndex("by_category", (q) => q.eq("category", args.category))
            .order("desc")
            .collect();
    },
});

// ─── GET HOMES BY REGION ─────────────────────────────────────────────────────
export const getByRegion = query({
    args: { region: regionValidator },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("homes")
            .withIndex("by_region", (q) => q.eq("region", args.region))
            .order("desc")
            .collect();
    },
});

// ─── FILTER HOMES ────────────────────────────────────────────────────────────
// Convex doesn't support complex range + equality in one index query,
// so we fetch by available, then filter in JS (still fast for typical dataset sizes).
export const filterHomes = query({
    args: {
        minPrice: v.optional(v.number()),
        maxPrice: v.optional(v.number()),
        category: v.optional(categoryValidator),
        region: v.optional(regionValidator),
    },
    handler: async (ctx, args) => {
        let homes = await ctx.db
            .query("homes")
            .withIndex("by_available", (q) => q.eq("isAvailable", true))
            .order("desc")
            .collect();

        if (args.category) homes = homes.filter((h) => h.category === args.category);
        if (args.region) homes = homes.filter((h) => h.region === args.region);
        if (args.minPrice !== undefined)
            homes = homes.filter((h) => h.price >= args.minPrice!);
        if (args.maxPrice !== undefined)
            homes = homes.filter((h) => h.price <= args.maxPrice!);

        return { homes, count: homes.length };
    },
});

// ─── GET ALL HOMES FOR A USER ─────────────────────────────────────────────────
export const getUserHomes = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("homes")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
    },
});

// ─── UPDATE HOME ─────────────────────────────────────────────────────────────
export const updateHome = mutation({
    args: {
        homeId: v.id("homes"),
        userId: v.id("users"), // for ownership check
        address: v.string(),
        description: v.string(),
        city: v.string(),
        telephone: v.string(),
        category: categoryValidator,
        price: v.number(),
        home_cover: v.string(),
        whatsapp_url: v.string(),
        facebook_url: v.optional(v.string()),
        region: regionValidator,
        details: v.array(v.string()),
        lat: v.optional(v.string()),
        long: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const home = await ctx.db.get(args.homeId);
        if (!home) throw new Error("HOME_NOT_FOUND");
        if (home.userId !== args.userId) throw new Error("UNAUTHORIZED");
        if (args.price <= 5000) throw new Error("PRICE_TOO_LOW");
        if (args.details.length < 3 || args.details.length > 10)
            throw new Error("INVALID_DETAILS_COUNT");

        const { homeId, userId: _uid, ...fields } = args;
        await ctx.db.patch(homeId, fields);
        return await ctx.db.get(homeId);
    },
});

// ─── DELETE HOME ──────────────────────────────────────────────────────────────
export const deleteHome = mutation({
    args: { homeId: v.id("homes"), userId: v.id("users") },
    handler: async (ctx, args) => {
        const home = await ctx.db.get(args.homeId);
        if (!home) throw new Error("HOME_NOT_FOUND");
        if (home.userId !== args.userId) throw new Error("UNAUTHORIZED");

        // Clean up related reviews
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_homeId", (q) => q.eq("homeId", args.homeId))
            .collect();
        for (const r of reviews) await ctx.db.delete(r._id);

        await ctx.db.delete(args.homeId);
        return { success: true };
    },
});

// ─── TOGGLE AVAILABILITY ──────────────────────────────────────────────────────
export const toggleAvailability = mutation({
    args: { homeId: v.id("homes"), userId: v.id("users") },
    handler: async (ctx, args) => {
        const home = await ctx.db.get(args.homeId);
        if (!home) throw new Error("HOME_NOT_FOUND");
        if (home.userId !== args.userId) throw new Error("UNAUTHORIZED");
        await ctx.db.patch(args.homeId, { isAvailable: !home.isAvailable });
        return await ctx.db.get(args.homeId);
    },
});

// ─── FAVORITE A HOME ──────────────────────────────────────────────────────────
export const toggleFavorite = mutation({
    args: { homeId: v.id("homes"), userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) throw new Error("USER_NOT_FOUND");

        const home = await ctx.db.get(args.homeId);
        if (!home) throw new Error("HOME_NOT_FOUND");

        if (home.userId === args.userId)
            throw new Error("CANNOT_FAVORITE_OWN_HOME");

        const isFav = user.favorites.includes(args.homeId);

        if (isFav) {
            await ctx.db.patch(args.userId, {
                favorites: user.favorites.filter((id) => id !== args.homeId),
            });
            return { action: "removed" };
        } else {
            await ctx.db.patch(args.userId, {
                favorites: [...user.favorites, args.homeId],
            });

            // Create notification for home owner
            await ctx.db.insert("notifications", {
                senderId: args.userId,
                receiverId: home.userId,
                notification_type: "favorites",
                homeId: args.homeId,
                isRead: false,
            });

            return { action: "added" };
        }
    },
});

// ─── GET FAVORITE HOMES ───────────────────────────────────────────────────────
// Real-time: reacts to user.favorites changes automatically
export const getFavoriteHomes = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) return [];
        return Promise.all(
            user.favorites.map((id) => ctx.db.get(id))
        ).then((homes) => homes.filter(Boolean));
    },
});

// ─── ADD REVIEW ───────────────────────────────────────────────────────────────
export const addReview = mutation({
    args: {
        homeId: v.id("homes"),
        userId: v.id("users"),
        text: v.string(),
    },
    handler: async (ctx, args) => {
        const home = await ctx.db.get(args.homeId);
        if (!home) return
        // throw new Error("HOME_NOT_FOUND");

        const reviewId = await ctx.db.insert("reviews", {
            homeId: args.homeId,
            userId: args.userId,
            text: args.text,
        });

        // Notify home owner (skip if reviewing own home)
        if (home.userId !== args.userId) {
            await ctx.db.insert("notifications", {
                senderId: args.userId,
                receiverId: home.userId,
                notification_type: "review",
                homeId: args.homeId,
                isRead: false,
            });
        }

        return reviewId;
    },
});

// ─── GET REVIEWS FOR A HOME ───────────────────────────────────────────────────
export const getReviews = query({
    args: { homeId: v.id("homes") },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_homeId", (q) => q.eq("homeId", args.homeId))
            .order("desc")
            .collect();

        return Promise.all(
            reviews.map(async (r) => {
                const user = await ctx.db.get(r.userId);
                return {
                    ...r,
                    user: user
                        ? { _id: user._id, name: user.name, email: user.email, image_url: user.image_url }
                        : null,
                };
            })
        );
    },
});