import { Tabs } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect } from "react";
import { Image, Text, View } from "react-native";
import Icons from "../../constant/icons";
import { useStore } from "../../Stores/authStore";
import { notificationStore } from "../../Stores/notificationStore";

// ✅ Memoized TabBarIcon so it won't re-render unless props change
const TabBarIcon =(({ color, label, icons }) => {
  return (
    <View className="flex flex-col w-full flex-1 min-w-[115px] min-h-14 pt-4 justify-center items-center">
      <Image source={icons} tintColor={color} className="size-5" />
      <Text className="text-sm font-semibold ml-2" style={{ color }}>
        {label}
      </Text>
    </View>
  );
});

const TabLayout = () => {
  const { user, getUser } = useStore();
  const { getNotificationCount, notificationCount } = notificationStore();

  // ✅ Load user
  useEffect(() => {
    const fetchUser = async () => {
      await getUser();
    };
    fetchUser();
  }, [getUser]);

  // ✅ Fetch notification count whenever user changes
  const fetchNotificationCount = useCallback(() => {
    if (user?._id) {
      getNotificationCount(user._id);
    }
  }, [user?._id]);

  useEffect(() => {
    fetchNotificationCount();
  }, [fetchNotificationCount]);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: false,
          tabBarActiveTintColor: "#124BCC",
          tabBarInactiveTintColor: "gray",
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
            marginRight: 24,
          },
          tabBarStyle: {
            backgroundColor: "#fff",
            borderTopColor: "gray",
          },
        }}
      >
        <Tabs.Screen
          name="Home"
          options={{
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon
                color={color}
                label="Home"
                icons={focused ? Icons.home : Icons.homee}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Favorites"
          options={{
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon
                color={color}
                label="Favorite"
                icons={focused ? Icons.heart : Icons.love}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Profile"
          options={{
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon
                color={color}
                label="Profile"
                icons={focused ? Icons.userr : Icons.user}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="Notification"
          options={{
            tabBarIcon: ({ focused, color }) => (
              <TabBarIcon
                color={color}
                label="Notification"
                icons={focused ? Icons.bells : Icons.bell}
              />
            ),
            // ✅ Only show badge when > 0
            tabBarBadge: notificationCount > 0 ? notificationCount : undefined,
            tabBarBadgeStyle: {
              backgroundColor: "red",
              color: "white",
              fontSize: 12,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            },
          }}
        />
      </Tabs>
      <StatusBar style="dark" />
    </>
  );
};

export default TabLayout;
