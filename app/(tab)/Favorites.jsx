import { Entypo } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import icons from '../../constant/icons'
import { api } from '../../convex/_generated/api'
import { useCachedQuery } from '../../hooks/useCachedQuery'
import { useStore } from '../../Stores/authStore'

const Favorite = () => {
  const { user } = useStore()
  const { t } = useTranslation()

  const homes = useCachedQuery(
    api.homes.getFavoriteHomes,
    user?._id ? { userId: user._id } : 'skip',
    `cache_fav_${user?._id}`
  ) ?? []

  const isLoading = homes === undefined

  const getCategoryAccent = (category) => {
    switch (category?.toLowerCase()) {
      case 'apartment': return { bg: 'bg-blue-50', tint: '#124BCC' }
      case 'house': return { bg: 'bg-green-50', tint: '#22c55e' }
      case 'villa': return { bg: 'bg-orange-50', tint: '#f97316' }
      case 'studio': return { bg: 'bg-purple-50', tint: '#a855f7' }
      default: return { bg: 'bg-red-50', tint: '#ef4444' }
    }
  }

  const safeHomes = Array.isArray(homes) ? homes : []

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#124BCC" />
        <Text className="text-gray-500 mt-2">{t("LoadingFavorites")}</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">

      {/* Header — mirrors Notification header */}
      <View className="px-5 pt-3 pb-4 flex-row items-center justify-between border-b border-gray-100">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className="size-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Entypo name="chevron-left" size={24} color="#124BCC" />
        </TouchableOpacity>

        <Text className="text-2xl font-bold text-[#124BCC]">{t("Favorite")}</Text>

        {safeHomes.length > 0 ? (
          <View className="bg-[#124BCC] rounded-full px-2 py-0.5">
            <Text className="text-white text-xs font-bold">
              {safeHomes.length} {safeHomes.length === 1 ? 'home' : 'homes'}
            </Text>
          </View>
        ) : (
          /* Invisible spacer keeps title centred */
          <View className="size-10" />
        )}
      </View>

      <FlatList
        data={safeHomes}
        keyExtractor={(item) => item._id.toString()}
        refreshing={false}
        onRefresh={() => { }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30, flexGrow: 1 }}
        renderItem={({ item }) => {
          const accent = getCategoryAccent(item?.category)
          const shortDesc = item?.description
            ? item.description.length > 50
              ? item.description.slice(0, 50) + '…'
              : item.description
            : ''

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => router.push(`/House/${item._id}`)}
              className="flex-row items-center px-4 py-3 mx-3 my-1 rounded-2xl bg-white"
              style={{
                elevation: 1,
                shadowColor: '#000',
                shadowOpacity: 0.04,
                shadowRadius: 4,
                shadowOffset: { width: 0, height: 1 },
              }}
            >
              {/* Accent icon — mirrors notification icon circle */}
              <View className={`size-11 rounded-full ${accent.bg} items-center justify-center mr-3 shrink-0`}>
                <Image
                  source={icons.heartFavorite}
                  className="size-6"
                  resizeMode="contain"
                  style={{ tintColor: accent.tint }}
                />
              </View>

              {/* Text content */}
              <View className="flex-1">
                <Text className="text-sm font-semibold text-gray-800" numberOfLines={1}>
                  {item.address}
                </Text>
                {shortDesc ? (
                  <Text className="text-xs text-gray-500 mt-0.5" numberOfLines={1}>
                    {shortDesc}
                  </Text>
                ) : null}
                <Text className="text-xs text-gray-400 mt-1">
                  {item.category}
                </Text>
              </View>

              {/* Cover thumbnail — mirrors new_house thumbnail */}
              {item?.home_cover ? (
                <Image
                  source={{ uri: item.home_cover }}
                  className="size-12 rounded-xl ml-3 shrink-0"
                  resizeMode="cover"
                />
              ) : null}
            </TouchableOpacity>
          )
        }}

        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-24">
            <Image source={icons.touch} className="w-64 h-48 opacity-65" resizeMode="contain" />
            <Text className="text-xl font-semibold text-[#124BCC] mt-6">{t("noFavorite")}</Text>
            <Text className="text-gray-400 mt-2 text-sm">{t("AddToFavoriteMessage")}</Text>
          </View>
        }
      />

    </SafeAreaView>
  )
}

export default Favorite