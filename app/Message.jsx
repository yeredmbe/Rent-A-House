import { Entypo } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import icons from '../constant/icons'
import { messageStore } from '../Stores/messageStore'
import { useStore } from '../Stores/authStore'
import { useMutation } from "convex/react"
import { api } from "../convex/_generated/api"
import { useCachedQuery } from '../hooks/useCachedQuery';

const Message = () => {
  const { setSelectedUser } = messageStore()
  const { user } = useStore()
  
  const chatUsers = useCachedQuery(api.messages.getChatUsers, user?._id ? { userId: user._id } : "skip", `cache_chat_users_${user?._id}`) ?? [];
  const markAsRead = useMutation(api.messages.markMessagesAsRead);
  const { t } = useTranslation()



  const unreadCount = useCachedQuery(api.messages.countUnreadMessages, user?._id ? { userId: user._id } : "skip", `cache_unread_count_${user?._id}`) ?? 0;

  return (
    <SafeAreaView className="flex-1 bg-white">

      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3 border-b border-gray-100">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="size-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Entypo name="chevron-left" size={26} color="#124BCC" />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#124BCC]">{t("Messages")}</Text>
        {unreadCount > 0 ? (
          <View className="bg-[#124BCC] rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">{unreadCount} new</Text>
          </View>
        ) : (
          <View className="size-10" />
        )}
      </View>

      <FlatList
        data={chatUsers ?? []}
        keyExtractor={(item) => item._id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1, paddingVertical: 12, paddingHorizontal: 12 }}
        onRefresh={() => {}}
        refreshing={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              setSelectedUser(item)
              if (user?._id) {
                markAsRead({ senderId: item._id, receiverId: user._id }).catch(console.error);
              }
              router.push(`/Message/${item._id}`)
            }}
            className={`flex-row items-center rounded-2xl mb-3 p-3 bg-white`}
            style={{ elevation: 1, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 1 } }}
          >
            {/* Avatar */}
            <View className="size-14 rounded-full overflow-hidden bg-gray-100 items-center justify-center mr-3 shrink-0">
              <Image
                source={item?.image_url ? { uri: item.image_url } : require('../assets/icons/userr.png')}
                tintColor={item?.image_url ? undefined : "#124BCC"}
                className={item?.image_url ? "size-full" : "size-7"}
                resizeMode={item?.image_url ? "cover" : "contain"}
              />
            </View>

            {/* Content */}
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-gray-800" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text className="text-xs text-gray-400">
                  {new Date(item._creationTime || item.createdAt || Date.now()).toDateString()}
                </Text>
              </View>
              <View className="flex-row items-center justify-between mt-0.5">
                <Text className="text-sm text-gray-500" numberOfLines={1}>
                  {t("newMessage")} {item.role === "landLord" ? t("LandLord") : "Client"}.
                </Text>

              </View>
              <View className="mt-1">
                <View className="self-start bg-blue-50 rounded-full px-2 py-0.5">
                  <Text className="text-xs text-[#124BCC] font-medium">
                    {item.role === "landLord" ? t("LandLord") : "Client"}
                  </Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        )}

        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-24">
            <Image
              source={icons.message}
              className="size-24 opacity-50 mb-6"
              tintColor="#124BCC"
              resizeMode="contain"
            />
            <Text className="text-xl font-bold text-gray-800">{t("noMessages")}</Text>
            <Text className="text-gray-400 mt-2 text-sm text-center px-10">{t("startConversation")}</Text>
          </View>
        }
      />

    </SafeAreaView>
  )
}

export default Message