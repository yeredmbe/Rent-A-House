import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";
import { convex, useStore } from "../Stores/authStore";

// Configure notification behavior while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationProvider = ({ children }) => {
  const { user } = useStore();

  useEffect(() => {
    let notificationReceivedListener;
    let responseListener;

    const setupNotifications = async () => {
      try {
        // Request permission
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== "granted") {
          console.warn("🚫 Permission for notifications was not granted.");
          return;
        }

        // Save token to database if permission is granted and user is authenticated
        if (user?._id) {
          await savePushToken(user._id);
        }

        // Foreground notification listener
        notificationReceivedListener =
          Notifications.addNotificationReceivedListener((notification) => {
            try {
              const data = notification?.request?.content?.data || {};
              console.log("📩 Foreground notification:", data);
            } catch (err) {
              console.warn("⚠️ Error handling foreground notification:", err);
            }
          });

        // When user taps a notification (background or quit)
        responseListener =
          Notifications.addNotificationResponseReceivedListener((response) => {
            try {
              const data =
                response?.notification?.request?.content?.data || {};
              console.log("🔔 Notification tapped:", data);

              const { homeId, messageId } = data;

              if (homeId) {
                router.push(`/House/${homeId}`);
              } else if (messageId) {
                router.push(`/Message/${messageId}`);
              }
            } catch (err) {
              console.warn("⚠️ Error handling tapped notification:", err);
            }
          });
      } catch (error) {
        console.error("❌ Notification setup error:", error);
      }
    };

    setupNotifications();

    // ✅ Safe cleanup (works in latest Expo)
    return () => {
      if (notificationReceivedListener?.remove)
        notificationReceivedListener.remove();
      if (responseListener?.remove) responseListener.remove();
    };
  }, [user]);

  /**
   * Retrieve and save push token to database
   */
  async function savePushToken(userId) {
    try {
      if (!Device.isDevice) {
        console.warn("[push] Notifications require a physical device.");
        return;
      }

      const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
      if (!projectId) {
        console.error("[push] Project ID not found");
        return;
      }

      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
      if (token) {
        await convex.mutation(api.users.updatePushToken, { userId, token });
        console.log("[push] Token saved successfully:", token);
      }
    } catch (error) {
      console.error("[push] Failed to save token:", error);
    }
  }

  return <>{children}</>;
};

export default NotificationProvider;
