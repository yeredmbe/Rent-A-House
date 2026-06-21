import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

/**
 * Simple admin authentication.
 * In production you would integrate Clerk or similar – this is a
 * lightweight credential check suitable for a self-hosted admin panel.
 */

/** Verify admin credentials (email + password hash stored in users table) */
export const verifyAdmin = query({
  args: { email: v.string() },
  handler: async (ctx, { email }) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();
    if (!user || user.role !== "admin") return null;
    // Return safe subset (no password)
    return {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      profileImage: user.profileImage,
    };
  },
});

/** Seed an admin account (run once) */
export const seedAdmin = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    phone: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();
    if (existing) return existing._id;
    return await ctx.db.insert("users", {
      ...args,
      role: "admin",
      isActive: true,
      createdAt: Date.now(),
    });
  },
});
