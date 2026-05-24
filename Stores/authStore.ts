/**
 * stores/authStore.ts
 *
 * HTTP actions for register/login (need bcrypt + JWT via "use node" in http.ts).
 * All other data operations use Convex mutations/queries directly.
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

// ─── Safe JSON parse ──────────────────────────────────────────────────────────
// Convex can return plain-text or HTML error pages (404, 500).
// res.json() on those throws "JSON Parse error: Unexpected character".
// This helper returns null instead so we can handle it gracefully.
async function safeJson(res: Response): Promise<Record<string, string> | null> {
  const ct = res.headers.get("content-type") ?? "";
  if (!ct.includes("application/json")) {
    const text = await res.text();
    console.error("[authStore] Non-JSON response:", res.status, text.slice(0, 300));
    return null;
  }
  try {
    return await res.json();
  } catch (err) {
    console.error("[authStore] JSON parse failed:", err);
    return null;
  }
}

// ─── Resolve error code ───────────────────────────────────────────────────────
// The server sends { message, code }. We prefer the explicit code field.
// AuthErrors.ts supports both raw message strings and code keys, so either works,
// but a code is cleaner and more reliable.
function resolveErrorCode(data: Record<string, string> | null): string {
  if (!data) return "UNKNOWN";
  if (data.code) return data.code;
  if (data.message) return data.message; // AuthErrors.ts does substring match
  return "UNKNOWN";
}

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
  }) => Promise<{ error: string } | Record<string, unknown>>;

  login: (credentials: {
    email: string;
    password: string;
  }) => Promise<{ error: string } | Record<string, unknown>>;

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
    if (!SITE_URL) {
      console.error("[authStore] EXPO_PUBLIC_CONVEX_SITE_URL is not set.");
      return { error: "UNKNOWN" };
    }

    set({ isLoading: true });
    try {
      const res = await fetch(`${SITE_URL}/api/v1/user/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });

      const data = await safeJson(res);

      if (!res.ok || !data) {
        set({ isLoading: false });
        return { error: resolveErrorCode(data) };
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("userId", (data.user as any)._id);
      await AsyncStorage.setItem("user_cache", JSON.stringify(data.user));

      set({
        user: data.user as any,
        userId: (data.user as any)._id,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });

      showToast({
        message: i18next.t("Registered successfully"),
        type: "success",
        duration: 4000,
        position: "top",
        title: "Success",
      });

      return data;
    } catch (err) {
      console.error("[authStore] register error:", err);
      set({ isLoading: false });
      return { error: "UNKNOWN" };
    }
  },

  // ── LOGIN ────────────────────────────────────────────────────────────────────
  login: async (credentials) => {
    if (!SITE_URL) {
      console.error("[authStore] EXPO_PUBLIC_CONVEX_SITE_URL is not set.");
      return { error: "UNKNOWN" };
    }

    set({ isLoading: true });
    try {
      const res = await fetch(`${SITE_URL}/api/v1/user/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      const data = await safeJson(res);

      if (!res.ok || !data) {
        set({ isLoading: false });
        return { error: resolveErrorCode(data) };
      }

      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("userId", (data.user as any)._id);
      await AsyncStorage.setItem("user_cache", JSON.stringify(data.user));

      set({
        user: data.user as any,
        userId: (data.user as any)._id,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
      });

      showToast({
        message: i18next.t("Login successful"),
        type: "success",
        duration: 4000,
        position: "top",
        title: "Success",
      });

      return data;
    } catch (err) {
      console.error("[authStore] login error:", err);
      set({ isLoading: false });
      return { error: "UNKNOWN" };
    }
  },

  // ── RESTORE SESSION ──────────────────────────────────────────────────────────
  restoreSession: async () => {
    set({ isLoading: true });
    try {
      const token = await AsyncStorage.getItem("token");
      const userId = (await AsyncStorage.getItem("userId")) as Id<"users"> | null;
      const userCache = await AsyncStorage.getItem("user_cache");

      if (!token || !userId) {
        set({ isLoading: false, isAuthenticated: false });
        return;
      }

      // Restore from cache immediately so UI doesn't flash
      if (userCache) {
        set({
          user: JSON.parse(userCache),
          userId,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      }

      // Validate against Convex in the background
      try {
        const user = await convex.query(api.users.getById, { userId });
        if (!user) {
          await AsyncStorage.multiRemove(["token", "userId", "user_cache"]);
          set({ user: null, userId: null, token: null, isLoading: false, isAuthenticated: false });
          return;
        }
        await AsyncStorage.setItem("user_cache", JSON.stringify(user));
        set({ user, userId, token, isAuthenticated: true, isLoading: false });
      } catch {
        // Keep cached session alive if Convex is temporarily unreachable
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
      const payload: Record<string, unknown> = { userId };
      if (data.name?.trim()) payload.name = data.name.trim();
      if (data.email?.trim()) payload.email = data.email.trim();
      if (data.age != null) payload.age = data.age;
      if (data.location && typeof data.location === "string" && data.location.trim()) {
        payload.location = data.location as AllowedLocation;
      }

      const updated = await convex.mutation(api.users.editUser, payload as any);
      set({ user: updated ?? get().user, isLoading: false });
      if (updated) {
        await AsyncStorage.setItem("user_cache", JSON.stringify(updated));
      }
      await AsyncStorage.setItem("userId", userId);
      showToast({
        message: i18next.t("Profile updated"),
        type: "success",
        duration: 3000,
        position: "top",
        title: "Success",
      });
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
      showToast({
        message: i18next.t("Profile image updated successfully"),
        type: "success",
        duration: 3000,
        position: "top",
        title: "Success",
      });
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