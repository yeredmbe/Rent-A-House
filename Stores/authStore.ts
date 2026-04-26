/**
 * stores/authStore.ts
 *
 * Replaces Express HTTP calls with:
 *  - Direct Convex mutations/queries for data operations
 *  - HTTP actions only for register/login (need bcrypt + JWT)
 *
 * Real-time auth state: useQuery(api.users.getById, { userId })
 * automatically re-renders when the user document changes in Convex.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ConvexReactClient } from "convex/react";
import { router } from "expo-router";
import { showToast } from "rn-snappy-toast";
import { create } from "zustand";
import i18next from "../Services/i18next";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

// ─── Convex client (singleton) ───────────────────────────────────────────────
export const convex = new ConvexReactClient(
  process.env.EXPO_PUBLIC_CONVEX_URL ?? ""
);

const SITE_URL = process.env.EXPO_PUBLIC_CONVEX_SITE_URL ?? "";

// ─── Types ────────────────────────────────────────────────────────────────────
type AllowedLocation =
  | "Bafoussam"
  | "Douala"
  | "Yaounde"
  | "Buea"
  | "Bamenda"
  | "Garoua"
  | "Maroua"
  | "Ngaoundere"
  | "Adamawa"
  | "Bertoua";

interface AuthState {
  user: Record<string, unknown> | null;
  userId: Id<"users"> | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isProfilePicUploaded: boolean;
  isProfileLoading: boolean;
  userProfile: Record<string, unknown> | null;

  register: (fields: {
    name: string;
    email: string;
    password: string;
    role?: "client" | "landLord";
  }) => Promise<unknown>;

  login: (credentials: { email: string; password: string }) => Promise<unknown>;
  logout: () => Promise<void>;

  restoreSession: () => Promise<void>;

  updateFavorites: (homeId: Id<"homes">) => void;

  editProfile: (data: {
    name?: string;
    email?: string;
    age?: number;
    location?: AllowedLocation | null;
  }) => Promise<void>;

  updateProfileImage: (imageUrl: string, publicId?: string) => Promise<void>;
  getUserProfile: (id: Id<"users">) => Promise<void>;
}

// ─── Store ────────────────────────────────────────────────────────────────────
export const useStore = create<AuthState>((set, get) => ({
  user: null,
  userId: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  isProfilePicUploaded: false,
  isProfileLoading: false,
  userProfile: null,

  // ── REGISTER ────────────────────────────────────────────────────────────────
  register: async (fields) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${SITE_URL}/api/v1/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast({ message: data.message, type: "error", duration: 4000, position: "top", title: "Error" });
        set({ isLoading: false });
        return;
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("userId", data.user._id);
      await AsyncStorage.setItem("user_cache", JSON.stringify(data.user));
      set({
        user: data.user,
        userId: data.user._id,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });

      showToast({ message: i18next.t("Registered successfully"), type: "success", duration: 4000, position: "top", title: "Success" });
      return data;
    } catch {
      showToast({ message: i18next.t("Network issues, try again later."), type: "error", duration: 4000, position: "top", title: "Error" });
      set({ isLoading: false });
    }
  },

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  login: async (credentials) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${SITE_URL}/api/v1/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });
      const data = await res.json();

      if (!res.ok) {
        showToast({ message: data.message, type: "error", duration: 4000, position: "top", title: "Error" });
        set({ isLoading: false });
        return data;
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("userId", data.user._id);
      await AsyncStorage.setItem("user_cache", JSON.stringify(data.user));
      set({
        user: data.user,
        userId: data.user._id,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });

      showToast({ message: i18next.t("Login successful"), type: "success", duration: 4000, position: "top", title: "Success" });
      return data;
    } catch {
      showToast({ message: i18next.t("Network issues, try again later."), type: "error", duration: 4000, position: "top", title: "Error" });
      set({ isLoading: false });
    }
  },

  // ── RESTORE SESSION ──────────────────────────────────────────────────────────
  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = await AsyncStorage.getItem("userId") as Id<"users"> | null;
      const userCache = await AsyncStorage.getItem("user_cache");

      if (!token || !userId) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      if (userCache) {
        set({ user: JSON.parse(userCache), userId, token, isAuthenticated: true, isLoading: false });
      }

      try {
        const user = await convex.query(api.users.getById, { userId });
        if (!user) {
          await AsyncStorage.multiRemove(["token", "userId", "user_cache"]);
          set({ isLoading: false, isAuthenticated: false });
          return;
        }

        await AsyncStorage.setItem("user_cache", JSON.stringify(user));
        set({ user, userId, token, isAuthenticated: true, isLoading: false });
      } catch {
        if (!userCache) {
          set({ isLoading: false, isAuthenticated: false });
        }
      }
    } catch {
      set({ isLoading: false, isAuthenticated: false });
    }
  },

  // ── LOGOUT ───────────────────────────────────────────────────────────────────
  logout: async () => {
    await AsyncStorage.multiRemove(["token", "userId", "user_cache"]);
    set({ user: null, userId: null, token: null, isAuthenticated: false });
    router.replace("/SignIn");
  },

  // ── TOGGLE FAVORITE LOCALLY ──────────────────────────────────────────────────
  updateFavorites: (homeId) => {
    const user = get().user;
    if (!user) return;
    const favorites = user.favorites as Id<"homes">[] | undefined;
    const updated = favorites?.includes(homeId)
      ? favorites.filter((id) => id !== homeId)
      : [...(favorites ?? []), homeId];
    set({ user: { ...user, favorites: updated } });
  },

  // ── EDIT PROFILE INFO ────────────────────────────────────────────────────────
  editProfile: async (data) => {
    const userId = get().userId;
    if (!userId) return;
    set({ isLoading: true });
    try {
      // FIX: build the payload without location if it is null/undefined/empty.
      // Convex validates location as a strict union — sending null causes
      // an ArgumentValidationError even if the field is marked optional.
      const payload: Record<string, unknown> = { userId };

      if (data.name?.trim()) payload.name = data.name.trim();
      if (data.email?.trim()) payload.email = data.email.trim();
      if (data.age != null) payload.age = data.age;

      // Only include location when it is a non-empty string
      if (data.location && typeof data.location === "string" && data.location.trim()) {
        payload.location = data.location as AllowedLocation;
      }

      const updated = await convex.mutation(api.users.editUser, payload as any);

      set({ user: updated ?? get().user, isLoading: false });
      if (updated) {
        await AsyncStorage.setItem("user_cache", JSON.stringify(updated));
      }
      await AsyncStorage.setItem("userId", userId);
      showToast({ message: i18next.t("Profile updated"), type: "success", duration: 3000, position: "top", title: "Success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Update failed";
      showToast({ message: msg, type: "error", duration: 3000, position: "top", title: "Error" });
      set({ isLoading: false });
    }
  },

  // ── UPDATE PROFILE IMAGE ─────────────────────────────────────────────────────
  updateProfileImage: async (imageUrl, publicId) => {
    const userId = get().userId;
    if (!userId) return;
    set({ isProfilePicUploaded: true });
    try {
      const updated = await convex.mutation(api.users.editProfileImage, {
        userId,
        image_url: imageUrl,
        image_public_id: publicId,
      });
      set({ user: updated ?? get().user });
      if (updated) {
        await AsyncStorage.setItem("user_cache", JSON.stringify(updated));
      }
      showToast({ message: i18next.t("Profile image updated successfully"), type: "success", duration: 3000, position: "top", title: "Success" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      showToast({ message: msg, type: "error", duration: 3000, position: "top", title: "Error" });
    } finally {
      set({ isProfilePicUploaded: false });
    }
  },

  // ── GET ANOTHER USER'S PROFILE ───────────────────────────────────────────────
  getUserProfile: async (id) => {
    set({ isProfileLoading: true });
    try {
      const profile = await convex.query(api.users.getUserProfile, { userId: id });
      set({ userProfile: profile, isProfileLoading: false });
    } catch {
      set({ userProfile: null, isProfileLoading: false });
    }
  },
}));