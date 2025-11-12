import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

// Configure notification behavior while app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationProvider = ({ children }) => {
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
  }, []);

  return <>{children}</>;
};

export default NotificationProvider;
