import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

// Configure how notifications are handled when app is foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

const NotificationProvider = ({ children }) => {
  useEffect(() => {
    const setupNotifications = async () => {
      // Request permission
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission for notifications was not granted.');
        return;
      }

      // Foreground notification received
      const notificationReceivedListener = Notifications.addNotificationReceivedListener(notification => {
        console.log('📩 Notification received in foreground:', notification.notification.request.content.data);
      });

      // Notification tapped (background or quit)
      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data || {};
        const { homeId, messageId } = data;

        console.log('🔔 Notification tapped:', data);

        // Navigate based on the type of notification
        if (homeId) {
          router.push(`/House/${homeId}`);
        } else if (messageId) {
          router.push(`/Message/${messageId}`);
        }
      });

      return () => {
        notificationReceivedListener.remove();
        responseListener.remove();
      };
    };

    setupNotifications();
  }, []);

  return <>{children}</>;
};

export default NotificationProvider;
