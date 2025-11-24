import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { PostHogProvider, usePostHog } from 'posthog-react-native';
import { useEffect } from 'react';
import { Toaster } from 'rn-snappy-toast';
import NotificationProvider from '../components/notificationProvider';
import '../global.css';
import { initLanguage } from '../Services/i18next';

SplashScreen.preventAutoHideAsync();

// Create a separate component that uses the PostHog hook
function AppContent() {
  const posthog = usePostHog();

  useEffect(() => {
    // Test event
    posthog.capture('App Started', { screen: 'Root Layout' });
  }, [posthog]);

  return (
    <NotificationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(tab)" />
        <Stack.Screen name="Message" />
        <Stack.Screen name="Search" />
        <Stack.Screen name="Payment" />
        <Stack.Screen name="Setting" />
        <Stack.Screen name="Help-Center" />
        <Stack.Screen name="House/[detail]" />
        <Stack.Screen name="Message/[message]" />
      </Stack>
      <Toaster />
      <StatusBar style="dark" />
    </NotificationProvider>
  );
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Inter-Black': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Churchill': require("../assets/fonts/Churchill.otf"),
    'ChurchillBold': require("../assets/fonts/ChurchillBold.otf"),
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  useEffect(() => {
    async function setup() {
      await initLanguage();
    }
    setup();
  }, []);

  if (!loaded && !error) {
    return null;
  }

  return (
    <>
      <PostHogProvider 
        apiKey="phc_6GfkVrOJxcOTkW6cN3MMveTUC74pBZCzMQkaBE2pAGS" 
        options={{
          host: 'https://eu.i.posthog.com',
          enableSessionReplayRecording: true,
          sessionReplayConfig: {
            maskAllText: true,
            blockAllMedia: true,
          },
          enableDeviceCapture: true,
          // Optional: Add debugging in development
          captureException: (error) => {
            if (__DEV__) {
              console.error('PostHog error:', error);
            }
          },
        }}
      >
        <AppContent />
      </PostHogProvider>
    </>
  );
}