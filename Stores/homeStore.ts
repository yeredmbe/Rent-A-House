/**
 * stores/homeStore.ts
 *
 * All Express fetch calls replaced with direct Convex mutations/queries.
 *
 * KEY CHANGE — real-time listings:
 * Instead of calling getAllHomes() imperatively, use this in your screens:
 *
 *   const homes = useQuery(api.homes.getAvailableHomes);
 *
 * This gives you a live-updating list with zero extra code.
 * The store methods below are kept for imperative use cases (create, delete, etc.)
 */

import { router } from "expo-router";
import { showToast } from "rn-snappy-toast";
import { create } from "zustand";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";
import i18next from "../Services/i18next";
import { convex } from "./authStore";

interface HomeState {
  isLoading: boolean;
  error: string | null;

  createHome: (userId: Id<"users">, formData: Record<string, unknown>) => Promise<Id<"homes"> | void>;
  deleteHome: (homeId: Id<"homes">, userId: Id<"users">) => Promise<void>;
  updateHome: (homeId: Id<"homes">, userId: Id<"users">, formData: Record<string, unknown>) => Promise<void>;
  toggleAvailability: (homeId: Id<"homes">, userId: Id<"users">) => Promise<void>;
  toggleFavorite: (homeId: Id<"homes">, userId: Id<"users">) => Promise<void>;
  addReview: (homeId: Id<"homes">, userId: Id<"users">, text: string) => Promise<void>;
}

export const homeStore = create<HomeState>((set) => ({
  isLoading: false,
  error: null,

  // ── CREATE HOME ────────────────────────────────────────────────────────────
  // Images should be uploaded to Cloudinary on the client before calling this.
  // Pass the secure_url strings in formData.home_cover and formData.details.
  createHome: async (userId, formData) => {
    set({ isLoading: true });
    try {
      const homeId = await convex.mutation(api.homes.createHome, {
        userId,
        ...(formData as any),
      });

      showToast({
        message: i18next.t("Property listed successfully!"),
        type: "success",
        duration: 5000,
        position: "top",
        title: "Success",
      });

      router.replace(`/House/${homeId}`);
      return homeId;
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      const msg =
        raw === "PRICE_TOO_LOW"
          ? "Price must be greater than 5000"
          : raw === "INVALID_DETAILS_COUNT"
          ? "Provide between 3 and 10 detail images"
          : raw === "INVALID_PHONE"
          ? "Invalid telephone number"
          : raw;
      showToast({ message: msg, type: "error", duration: 5000, position: "top", title: "Error" });
      set({ error: msg });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── DELETE HOME ────────────────────────────────────────────────────────────
  deleteHome: async (homeId, userId) => {
    set({ isLoading: true });
    try {
      await convex.mutation(api.homes.deleteHome, { homeId, userId });
      showToast({ message: i18next.t("Home deleted"), type: "success", duration: 3000, position: "top", title: "Success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Delete failed";
      showToast({ message: msg, type: "error", duration: 3000, position: "top", title: "Error" });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── UPDATE HOME ────────────────────────────────────────────────────────────
  updateHome: async (homeId, userId, formData) => {
    set({ isLoading: true });
    try {
      await convex.mutation(api.homes.updateHome, {
        homeId,
        userId,
        ...(formData as any),
      });
      showToast({ message: i18next.t("Home updated"), type: "success", duration: 3000, position: "top", title: "Success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      showToast({ message: msg, type: "error", duration: 3000, position: "top", title: "Error" });
    } finally {
      set({ isLoading: false });
    }
  },

  // ── TOGGLE AVAILABILITY ────────────────────────────────────────────────────
  toggleAvailability: async (homeId, userId) => {
    try {
      await convex.mutation(api.homes.toggleAvailability, { homeId, userId });
      showToast({ message: i18next.t("Home status changed"), type: "success", duration: 3000, position: "top", title: "Success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      showToast({ message: msg, type: "error", duration: 3000, position: "top", title: "Error" });
    }
  },

  // ── TOGGLE FAVORITE ────────────────────────────────────────────────────────
  toggleFavorite: async (homeId, userId) => {
    try {
      const result = await convex.mutation(api.homes.toggleFavorite, { homeId, userId });
      showToast({
        message: result.action === "added"
          ? i18next.t("Added to favorites")
          : i18next.t("Removed from favorites"),
        type: "success",
        duration: 3000,
        position: "top",
        title: "Success",
      });
    } catch (err: unknown) {
      const raw = err instanceof Error ? err.message : String(err);
      const msg = raw === "CANNOT_FAVORITE_OWN_HOME"
        ? i18next.t("You cannot favorite your own home")
        : raw;
      showToast({ message: msg, type: "error", duration: 3000, position: "top", title: "Error" });
    }
  },

  // ── ADD REVIEW ─────────────────────────────────────────────────────────────
  addReview: async (homeId, userId, text) => {
    try {
      await convex.mutation(api.homes.addReview, { homeId, userId, text });
      showToast({ message: i18next.t("Review added"), type: "success", duration: 3000, position: "top", title: "Success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed";
      showToast({ message: msg, type: "error", duration: 3000, position: "top", title: "Error" });
    }
  },
}));

// ─── REAL-TIME HOOKS (use these in your screens instead of store methods) ─────
//
// Available homes list (auto-updates when any home changes):
//   const homes = useQuery(api.homes.getAvailableHomes);
//
// Single home with owner + reviews (live):
//   const home = useQuery(api.homes.getHome, { homeId });
//
// Recently posted (live):
//   const recent = useQuery(api.homes.recentlyPosted);
//
// Favorites (live, reacts when user.favorites changes):
//   const favorites = useQuery(api.homes.getFavoriteHomes, { userId });
//
// Filtered (live):
//   const filtered = useQuery(api.homes.filterHomes, { minPrice, maxPrice, category, region });
//
// User's listings (live):
//   const listings = useQuery(api.homes.getUserHomes, { userId });
//
// Reviews for a home (live):
//   const reviews = useQuery(api.homes.getReviews, { homeId });