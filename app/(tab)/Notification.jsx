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
    
    if (diffInSeconds < 60) {
      return 'just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
      return `${diffInWeeks}w`;
    }
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) {
      return `${diffInMonths}m`;
    }
    
    const diffInYears = Math.floor(diffInDays / 365);
    return `${diffInYears}y`;
  } catch (error) {
    return 'Unknown time', error;
  }
}

const Notification = () => {
  const { user, getUser } = useStore()
  const { getNotification, notifications, markAsRead, isLoading } = notificationStore()
  const {setSelectedUser} = messageStore()
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
  }, [user?._id, getUser, getNotification])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      if (user?._id) {
        await getNotification(user._id)
      }
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
    console.log("Notification pressed", item.senderId?._id, item.notification_type);
    setSelectedUser(item.senderId);
    // Determine path first
    let path = '';
    if (['message', 'welcome', 'system'].includes(item.notification_type)) {
      path = item.senderId?._id ? `/Message/${item.senderId._id}` : '';
    } else if (['review', 'new_house', 'favorites'].includes(item.notification_type)) {
      path = item.homeId?._id ? `/House/${item.homeId._id}` : '';
    }

    if (path) {
      // Navigate immediately
      router.push(path);
    }

    // Mark as read in background
    markAsRead(item._id)
      .then(() => {
        if (user?._id) getNotification(user._id);
      })
      .catch((err) => console.error('Error marking notification as read', err));
    
  } catch (err) {
    console.error('Error handling notification', err);
  }
};


  const getNotificationTitle = (item) => {
    if (!item?.notification_type) return 'Notification';
    
    switch (item.notification_type) {
      case "message":
        return `${t("New message from")} ${item.senderId?.name || 'Unknown'}`;
      case "favorites":
        return t("Your house has been favorited");
      case "system":
        return t("New message from admin");
      case "welcome":
        return t("Welcome, nice to have you aboard");
      case "review":
        return t("A review has been added to your property");
      case "new_house":
        return t("A house has been added in your area");
      default:
        return "New notification";
    }
  }

  const getNotificationImage = (item) => {
    if (!item?.notification_type) return icons.bell;
    
    switch (item.notification_type) {
      case "message":
        return icons.messageNotification;
      case "favorites":
        return icons.heartNotification;
      case "welcome":
        return icons.etiquette;
      case "review":
        return icons.neutral;
      case "system":
        return icons.admin;
      case "new_house":
        return item.homeId?.home_cover ? { uri: item.homeId.home_cover } : icons.bell;
      default:
        return icons.bell;
    }
  }

  // Safe notifications array
  const safeNotifications = Array.isArray(notifications) ? notifications : [];

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView className="bg-white flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#124BCC" />
        <Text className="text-gray-500 mt-2">{t("LoadingNotification")}</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="bg-white h-screen">
      <Text className='text-2xl font-bold text-[#124BCC] text-center py-4'>Notifications</Text>
      <View className="flex-1">
        {safeNotifications.length === 0 ? (
          <View className="flex flex-col items-center justify-center h-full bg-stone-100">
            <Image source={icons.design} className="w-68 h-52" resizeMode='contain' alt="Notification Icon" />
            <Text className="text-2xl font-semibold text-[#124BCC] mt-4">{t("noNotification")}</Text>
            <Text className="text-gray-500 mt-2">{t("youAreCaughtUp")}</Text>
          </View>
        ) : (
          <FlatList 
            data={safeNotifications}
            keyExtractor={(item) => item?._id || Math.random().toString()}
            renderItem={({ item, index }) => (
              <TouchableOpacity 
                activeOpacity={0.6}
                onPress={() => handleNotificationPress(item)}
                className={`p-4 ${safeNotifications.length - 1 === index ? "" : "border-b"} flex flex-row items-center justify-between ${item?.isRead ? "" : "bg-indigo-400/10"} border-gray-200 mx-2 rounded`}
              >
                <View className="flex flex-row items-center flex-1">
                  <View className="flex flex-row items-center size-12 bg-slate-100 rounded-full justify-center mx-1">
                    <Image 
                      source={icons.bell} 
                      className="size-9 p-1 rounded-full" 
                      resizeMode="contain" 
                      alt="Notification Icon" 
                    />
                  </View>
                  <View className="flex-1 ml-2">
                    <Text className="text-base font-semibold text-[#124BCC]">
                      {getNotificationTitle(item)}
                    </Text>
                    {item?.notification_type === "message" && (
                      <Text className="text-sm text-gray-500 mt-1">
                        {item.message || "You have a new message"}
                      </Text>
                    )}
                    <Text className="text-xs text-gray-400 mt-1">
                      {formatRelativeTime(item?.createdAt)}
                    </Text>
                  </View>
                </View>
                <View className="flex rounded-full items-center size-16 ml-2">
                  <Image 
                    source={getNotificationImage(item)}
                    className={`size-full rounded-full ${item?.notification_type === "message" && "p-1"}`}
                    resizeMode="cover" 
                    alt="Notification Image" 
                    onError={() => console.log('Failed to load notification image')}
                  />
                </View>
              </TouchableOpacity>
            )}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  )
}

export default Notification