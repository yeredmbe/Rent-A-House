import { query } from "./_generated/server";

/** Aggregate stats for the admin dashboard */
export const getStats = query({
  args: {},
  handler: async (ctx) => {
    const [users, homes, broadcasts, rentals] = await Promise.all([
      ctx.db.query("users").collect(),
      ctx.db.query("homes").collect(),
      ctx.db.query("broadcastMessages").collect(),
      ctx.db.query("rentals").collect(),
    ]);

    const now = Date.now();
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    return {
      users: {
        total: users.length,
        landlords: users.filter((u) => u.role === "landlord").length,
        clients: users.filter((u) => u.role === "client").length,
        newThisMonth: users.filter((u) => u.createdAt >= thirtyDaysAgo).length,
      },
      homes: {
        total: homes.length,
        available: homes.filter((h) => h.status === "available").length,
        rented: homes.filter((h) => h.status === "rented").length,
        pending: homes.filter((h) => h.status === "pending").length,
      },
      messages: {
        total: broadcasts.length,
        toAll: broadcasts.filter((m) => m.recipientType === "all").length,
        toLandlords: broadcasts.filter((m) => m.recipientType === "landlords").length,
        toClients: broadcasts.filter((m) => m.recipientType === "clients").length,
      },
      rentals: {
        total: rentals.length,
        active: rentals.filter((r) => r.status === "active").length,
        pending: rentals.filter((r) => r.status === "pending").length,
      },
      // Monthly revenue estimate from active rentals
      monthlyRevenue: rentals
        .filter((r) => r.status === "active")
        .reduce((sum, r) => sum + r.monthlyRent, 0),
    };
  },
});
