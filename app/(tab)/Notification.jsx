import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import icons from '../../constant/icons'
import { useStore } from '../../Stores/authStore'
import { notificationStore } from '../../Stores/notificationStore'

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
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
}
 

const Notification = () => {
  const { user, getUser } = useStore()
  const { getNotification, notifications, markAsRead, isLoading } = notificationStore()
  const [refreshing, setRefreshing] = useState(false)

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
  }, [user?._id]) // Add user._id as dependency

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      if (user?._id) {
        await getNotification(user._id)
      }
    } catch (error) {
      console.error('Error refreshing notifications:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const handleNotificationPress = async (item) => {
    try {
      // Mark as read first
      await markAsRead(item._id)
      
      // Then navigate based on notification type
      if (item.notification_type === "message") {
        router.push(`/Message/${item.senderId._id}`)
      } else if (item.notification_type === "new_house" || item.notification_type === "favorites") {
        router.push(`/House/${item.homeId._id}`)
      }
      
      // Refresh notifications after marking as read
      if (user?._id) {
        await getNotification(user._id)
      }
    } catch (error) {
      console.error('Error handling notification:', error)
    }
  }

  if (isLoading) {
    return (
      <SafeAreaView className="bg-white flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#124BCC" />
        <Text className="text-gray-500 mt-2">Loading notifications...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="bg-white h-full">
      <Text className='text-2xl font-bold text-[#124BCC] text-center py-4'>Notification</Text>
      <View className=" border-gray-200">
      {notifications?.length === 0 ? (
       <View className="flex flex-col items-center justify-center h-full bg-stone-100">
        <Image source={icons.design} className="w-68 h-52" resizeMode='contain' alt="Notification Icon" />
        <Text className="text-2xl font-semibold text-[#124BCC]">No Notifications Found.</Text>
       </View>
            ) : (
        <FlatList 
          data={notifications}
          keyExtractor={(item) => item._id}
          renderItem={({ item, index }) => (
            <TouchableOpacity 
              activeOpacity={0.6}
             onPress={()=>{router.push(item.notification_type==="review"?`/House/${item?.homeId?._id}`:item.notification_type==="welcome" || item.notification_type==="system"  ?`/Message/${item?.senderId?._id}`: item.notification_type==="message"?`/Message/${item?.senderId?._id}`:item.notification_type==="new_house"?`/House/${item?.homeId?._id}`:`/House/${item?.homeId?._id}`)
                   markAsRead(item._id)
                 getNotification(user._id)}}
              className={`p-4 ${notifications.length - 1 === index ? "" : "border-b"} flex flex-row items-center justify-between ${item.isRead ? "" : "bg-indigo-400/10"} border-gray-200 mx-2 rounded`}
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
                    {item.notification_type === "message" 
                      ? `New message from ${item.senderId?.name || 'Unknown'}`
                      : item.notification_type === "favorites" 
                        ? "Your house has been favorited" 
                        : item.notification_type === "system"?
                         "New message from admin":
                         item.notification_type === "welcome"?
                         `Welcome, nice to have you aboard`:
                         item.notification_type === "review"?
                         "A tweet has been added to your property":
                         "A house has been added in your area"
                        } 
                  </Text>
                  {item.notification_type === "message" && (
                    <Text className="text-sm text-gray-500">
                      {item.message || "this is the message"}
                    </Text>
                  )}
                  <Text className="text-xs text-gray-400">
                    {item.createdAt ? formatRelativeTime(item?.createdAt) : ''}
                  </Text>
                </View>
              </View>
              <View className="flex rounded-full items-center size-16 ml-2">
                <Image 
                  source={
                   item.notification_type === "message" 
                      ? icons.messageNotification
                      : item.notification_type === "favorites" 
                        ? icons.heartNotification
                        :item.notification_type === "welcome"?
                        icons.etiquette: item.notification_type === "review" ?
                        icons.neutral
                        :item.notification_type === "system"?
                        icons.admin
                        :{uri:item.homeId?.home_cover}
                  } 
                  className={`size-full rounded-full ${item.notification_type === "message" && "p-1 "}` }
                  resizeMode="cover" 
                  alt="Notification Image" 
                />
              </View>
            </TouchableOpacity>
          )}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      )}
      </View>
    </SafeAreaView>
  )
}

export default Notification