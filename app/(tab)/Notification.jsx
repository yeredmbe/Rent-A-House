import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, Alert, FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import icons from '../../constant/icons'
import { useStore } from '../../Stores/authStore'
import { messageStore } from '../../Stores/messageStore'
import { notificationStore } from '../../Stores/notificationStore'

function formatRelativeTime(dateString) {
  if (!dateString) return 'Unknown time';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    if (diffInSeconds < 60) return 'just now';
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks}w`;
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths}m`;
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y`;
  } catch (error) {
    return 'Unknown time';
  }
}

const Notification = () => {
  const { user, getUser } = useStore()
  const { getNotification, notifications, markAsRead, isLoading } = notificationStore()
  const { setSelectedUser } = messageStore()
  const [refreshing, setRefreshing] = useState(false)
  const { t } = useTranslation()

  useEffect(() => {
    const fetchData = async () => {
      try {
        await getUser()
        if (user?._id) {
          await getNotification(user._id)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        Alert.alert('Error', 'Failed to load notifications')
      }
    }
    fetchData()
  }, [])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      if (user?._id) await getNotification(user._id)
    } catch (error) {
      console.error('Error refreshing notifications:', error)
      Alert.alert('Error', 'Failed to refresh notifications')
    } finally {
      setRefreshing(false)
    }
  }

  const handleNotificationPress = (item) => {
    if (!item?._id) return;
    try {
      setSelectedUser(item.senderId);
      let path = '';
      if (['message', 'welcome', 'system'].includes(item.notification_type)) {
        path = item.senderId?._id ? `/Message/${item.senderId._id}` : '';
      } else if (['review', 'new_house', 'favorites'].includes(item.notification_type)) {
        path = item.homeId?._id ? `/House/${item.homeId._id}` : '';
      }
      if (path) router.push(path);
      markAsRead(item._id)
        .then(() => { if (user?._id) getNotification(user._id); })
        .catch((err) => console.error('Error marking notification as read', err));
    } catch (err) {
      console.error('Error handling notification', err);
    }
  };

  const getNotificationTitle = (item) => {
    if (!item?.notification_type) return 'Notification';
    switch (item.notification_type) {
      case "message": return `${t("New message from")} ${item.senderId?.name || 'Unknown'}`;
      case "favorites": return t("Your house has been favorited");
      case "system": return t("New message from admin");
      case "welcome": return t("Welcome, nice to have you aboard");
      case "review": return t("A review has been added to your property");
      case "new_house": return t("A house has been added in your area");
      default: return "New notification";
    }
  }

  const getNotificationImage = (item) => {
    if (!item?.notification_type) return icons.bell;
    switch (item.notification_type) {
      case "message": return icons.messageNotification;
      case "favorites": return icons.heartNotification;
      case "welcome": return icons.etiquette;
      case "review": return icons.neutral;
      case "system": return icons.admin;
      case "new_house": return item.homeId?.home_cover ? { uri: item.homeId.home_cover } : icons.bell;
      default: return icons.bell;
    }
  }

  const getNotificationAccent = (type) => {
    switch (type) {
      case "message": return { bg: "bg-blue-50", tint: "#124BCC" };
      case "favorites": return { bg: "bg-red-50", tint: "#ef4444" };
      case "welcome": return { bg: "bg-green-50", tint: "#22c55e" };
      case "review": return { bg: "bg-yellow-50", tint: "#eab308" };
      case "system": return { bg: "bg-purple-50", tint: "#a855f7" };
      case "new_house": return { bg: "bg-orange-50", tint: "#f97316" };
      default: return { bg: "bg-gray-50", tint: "#6b7280" };
    }
  }

  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#124BCC" />
        <Text className="text-gray-500 mt-2">{t("LoadingNotification")}</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">

      {/* Header */}
      <View className="px-5 pt-3 pb-4 flex-row items-center justify-between border-b border-gray-100">
        <Text className="text-2xl font-bold text-[#124BCC]">{t("Notifications")}</Text>
        {safeNotifications.some(n => !n.isRead) && (
          <View className="bg-[#124BCC] rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">
              {safeNotifications.filter(n => !n.isRead).length} new
            </Text>
          </View>
        )}
      </View>

      <FlatList
        data={safeNotifications}
        keyExtractor={(item) => item?._id || Math.random().toString()}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30, flexGrow: 1 }}
        renderItem={({ item }) => {
          const accent = getNotificationAccent(item?.notification_type);
          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => handleNotificationPress(item)}
              className={`flex-row items-center px-4 py-3 mx-3 my-1 rounded-2xl ${item?.isRead ? "bg-white" : "bg-indigo-50"}`}
              style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}
            >
              {/* Unread dot */}
              {!item?.isRead && (
                <View className="size-2 rounded-full bg-[#124BCC] absolute top-3 left-2" />
              )}

              {/* Icon */}
              <View className={`size-11 rounded-full ${accent.bg} items-center justify-center mr-3 shrink-0`}>
                <Image
                  source={getNotificationImage(item)}
                  className="size-6"
                  resizeMode="contain"
                />
              </View>

              {/* Content */}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                  {getNotificationTitle(item)}
                </Text>
                {item?.notification_type === "message" && item?.message && (
                  <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                    {item.message}
                  </Text>
                )}
                <Text className="text-xs text-gray-400 mt-1">
                  {formatRelativeTime(item?.createdAt)}
                </Text>
              </View>

              {/* Right image thumbnail */}
              {item?.notification_type === "new_house" && item?.homeId?.home_cover && (
                <Image
                  source={{ uri: item.homeId.home_cover }}
                  className="size-12 rounded-xl ml-3 shrink-0"
                  resizeMode="cover"
                />
              )}
            </TouchableOpacity>
          )
        }}

        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-24">
            <Image source={icons.design} className="w-64 h-48" resizeMode="contain" />
            <Text className="text-xl font-semibold text-[#124BCC] mt-6">{t("noNotification")}</Text>
            <Text className="text-gray-400 mt-2 text-sm">{t("youAreCaughtUp")}</Text>
          </View>
        }
      />

    </SafeAreaView>
  )
}

export default Notification