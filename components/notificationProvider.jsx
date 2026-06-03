import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { api } from "../convex/_generated/api";
import { convex, useStore } from "../Stores/authStore";

// ✅ CHANGED: replaced shouldShowBanner/shouldShowList with shouldShowAlert
// shouldShowAlert is the field that actually triggers the iOS permission popup
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationProvider = ({ children }) => {
  const user = useStore((state) => state.user);
  const userId = user?._id;
  const savedTokenRef = useRef(null);

  // ✅ CHANGED: extracted registration logic outside the useEffect (like the working version)
  // This ensures Android channel + permissions + token fetching all happen in one clean async flow
  // before any listeners are attached, reducing race conditions
  const registerForPushNotificationsAsync = async () => {
    if (!Device.isDevice) {
      console.warn("[push] Push notifications require a physical device.");
      return;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        enableVibrate: true,
        showBadge: true,
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.warn("🚫 Notification permission was not granted.");
      return;
    }

    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;

      if (!projectId) {
        console.warn("❌ EAS projectId not found in app configuration.");
        return;
      }

      const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
      const token = tokenResponse?.data;

      if (!token) {
        console.warn("❌ Failed to retrieve Expo push token.");
        return;
      }

      return token;
    } catch (error) {
      console.warn("❌ Error getting push token:", error);
    }
  };

  useEffect(() => {
    if (!userId) return;

    let notificationReceivedListener;
    let responseListener;

    const handleNotificationNavigation = (data) => {
      try {
        const { homeId, messageId } = data || {};
        if (homeId) { router.push(`/House/${homeId}`); return; }
        if (messageId) { router.push(`/Message/${messageId}`); return; }
      } catch (error) {
        console.warn("⚠️ Navigation error:", error);
      }
    };

    const initializeNotifications = async () => {
      try {
        // ✅ CHANGED: call the extracted function and receive the token back cleanly
        const token = await registerForPushNotificationsAsync();

        if (token) {
          // Skip DB update if token unchanged
          if (savedTokenRef.current !== token && user?.ExpoPushToken !== token) {
            await convex.mutation(api.users.updatePushToken, { userId, token });
            savedTokenRef.current = token;
            console.log("✅ Push token saved:", token);
          } else {
            console.log("✅ Push token unchanged, skipping update.");
          }
        }

        // Handle app opened from a killed state via notification tap
        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastResponse) {
          const data = lastResponse.notification.request.content.data || {};
          console.log("📲 App opened from notification:", data);
          handleNotificationNavigation(data);
        }

        // Foreground notification listener
        notificationReceivedListener = Notifications.addNotificationReceivedListener(
          (notification) => {
            try {
              const data = notification?.request?.content?.data || {};
              console.log("📩 Foreground notification:", data);
            } catch (error) {
              console.warn("⚠️ Foreground notification error:", error);
            }
          }
        );

        // Notification tap listener
        responseListener = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            try {
              const data = response?.notification?.request?.content?.data || {};
              console.log("🔔 Notification tapped:", data);
              handleNotificationNavigation(data);
            } catch (error) {
              console.warn("⚠️ Notification tap error:", error);
            }
          }
        );

        console.log("✅ Notifications initialized successfully");
      } catch (error) {
        console.warn("❌ Notification initialization error:", error);
      }
    };

    initializeNotifications();

    return () => {
      if (notificationReceivedListener) {
        Notifications.removeNotificationSubscription(notificationReceivedListener);
      }
      if (responseListener) {
        Notifications.removeNotificationSubscription(responseListener);
      }
    };
  }, [userId, user?.ExpoPushToken]);

  return <>{children}</>;
};

export default NotificationProvider;