import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Toaster } from 'rn-snappy-toast';
import NotificationProvider from '../components/notificationProvider';
import '../global.css';

SplashScreen.preventAutoHideAsync();


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


  if (!loaded && !error) {
    return null;
  }

  return (
    <>
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
    </>
  )
}
