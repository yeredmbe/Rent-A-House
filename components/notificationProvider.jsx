import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { api } from "../convex/_generated/api";
import { convex, useStore } from "../Stores/authStore";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// ✅ Fully outside the component — no stale closure risk in production builds
async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  if (!Device.isDevice) {
    console.warn("[push] Physical device required.");
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
    console.warn("🚫 Permission not granted.");
    return;
  }

  // ✅ Pull projectId from the correct place for production builds
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn("❌ No EAS projectId found. Check app.json extra.eas.projectId");
    return;
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    console.log("📲 Expo push token:", token);
    return token;
  } catch (error) {
    console.warn("❌ Failed to get push token:", error);
  }
}

const NotificationProvider = ({ children }) => {
  const user = useStore((state) => state.user);
  const userId = user?._id;
  const savedTokenRef = useRef(null);

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
        const token = await registerForPushNotificationsAsync();

        if (token) {
          if (savedTokenRef.current !== token && user?.ExpoPushToken !== token) {
            await convex.mutation(api.users.updatePushToken, { userId, token });
            savedTokenRef.current = token;
            console.log("✅ Push token saved:", token);
          } else {
            console.log("✅ Token unchanged, skipping update.");
          }
        }

        const lastResponse = await Notifications.getLastNotificationResponseAsync();
        if (lastResponse) {
          const data = lastResponse.notification.request.content.data || {};
          handleNotificationNavigation(data);
        }

        notificationReceivedListener = Notifications.addNotificationReceivedListener(
          (notification) => {
            const data = notification?.request?.content?.data || {};
            console.log("📩 Foreground notification:", data);
          }
        );

        responseListener = Notifications.addNotificationResponseReceivedListener(
          (response) => {
            const data = response?.notification?.request?.content?.data || {};
            console.log("🔔 Notification tapped:", data);
            handleNotificationNavigation(data);
          }
        );

        console.log("✅ Notifications initialized.");
      } catch (error) {
        console.warn("❌ Initialization error:", error);
      }
    };

    initializeNotifications();

    return () => {
      notificationReceivedListener?.remove?.();
      responseListener?.remove?.();
    };
  }, [userId, user?.ExpoPushToken]);

  return <>{children}</>;
};

export default NotificationProvider;