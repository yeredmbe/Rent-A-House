import { useMutation } from "convex/react"
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Image, Switch, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showToast } from 'rn-snappy-toast'
import { default as icon, default as icons } from '../constant/icons'
import { api } from "../convex/_generated/api"
import { useCachedQuery } from '../hooks/useCachedQuery'
import { useStore } from '../Stores/authStore'

function formatNumber(number) {
  const numStr = Number(number).toString();
  let integerPart = numStr;
  const formattedInteger = integerPart
    .split('')
    .reverse()
    .join('')
    .match(/.{1,3}/g)
    .join('.')
    .split('')
    .reverse()
    .join('');
  return formattedInteger;
}

const Listing = () => {
  const { user } = useStore()
  const [refreshing, setRefreshing] = useState(false)
  const [availability, setAvailability] = useState({});
  const { t } = useTranslation()

  const listings = useCachedQuery(api.homes.getUserHomes, user?._id ? { userId: user._id } : "skip", `cache_user_listings_${user?._id}`) ?? [];
  const userHouseLoading = listings === undefined && user?._id !== undefined;
  const toggleAvailMutation = useMutation(api.homes.toggleAvailability);

  useEffect(() => {
    if (listings?.length) {
      const initialAvailability = {};
      listings.forEach(item => {
        if (!(item._id in availability)) {
          initialAvailability[item._id] = item.isAvailable;
        }
      });
      if (Object.keys(initialAvailability).length > 0) {
        setAvailability(prev => ({ ...prev, ...initialAvailability }));
      }
    }
  }, [listings]);

  const toggleHouseAvailability = async (id) => {
    const newValue = !availability[id];

    setAvailability(prev => ({ ...prev, [id]: newValue }));

    try {
      await toggleAvailMutation({ homeId: id, userId: user._id });
      showToast({
        message: `Home is now ${newValue ? "available" : "unavailable"}`,
        duration: 3000,
        type: 'success',
        position: 'top',
        title: 'Success',
        animationType: 'slide',
        progressBar: true,
        richColors: true,
      });
    } catch (err) {
      setAvailability(prev => ({ ...prev, [id]: !newValue }));
      console.log(err.message);
      showToast({
        message: "Failed to update home status",
        duration: 3000,
        type: 'error',
        position: 'top',
        title: 'Error',
        animationType: 'slide',
        progressBar: true,
        richColors: true,
      });
    }
  };

  const onRefresh = async () => {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 500)
  }

  const getReviewCount = (item) => {
    if (typeof item?.reviewCount === 'number') return item.reviewCount;
    if (typeof item?.reviews === 'number') return item.reviews;
    if (Array.isArray(item?.reviews)) return item.reviews.length;
    if (typeof item?.totalReviews === 'number') return item.totalReviews;
    return 0;
  }

  const renderListingItem = ({ item }) => {
    const reviewCount = getReviewCount(item);

    return (
      <TouchableOpacity
        className="mb-4 rounded-lg border border-gray-200 overflow-hidden"
        onPress={() => router.push(`/House/${item._id}`)}
      >
        <Image
          source={{ uri: item.home_cover }}
          className="w-full h-36"
          resizeMode="cover"
        />
        <View className="flex flex-row items-center justify-between p-4 bg-white">
          <View className="mt-2 p-2">
            <Text className="text-lg font-semibold">{item?.address || 'No Title'}</Text>
            <Text className="text-gray-600 mb-1">{item?.region || 'No Location'}</Text>
            <Text className="text-[#124BCC] font-bold">
              {item?.price ? `${formatNumber(item.price)} XAF` : 'Price not set'}
            </Text>
          </View>
          <View className="flex flex-col justify-end items-end">
            <View className="flex flex-row items-center">
              <Image source={icons.review} className="size-6" />
              <Text className="text-gray-600 ml-1 font-Churchill">
                {reviewCount === 0
                  ? t("No review")
                  : `${reviewCount} ${reviewCount === 1 ? "review" : "reviews"}`
                }
              </Text>
            </View>
            <Switch
              trackColor={{ false: '#767577', true: '#123BCC' }}
              thumbColor={"#fff"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={() => toggleHouseAvailability(item._id)}
              value={availability[item._id] ?? item.isAvailable}
              style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginTop: 10 }}
            />
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex flex-row items-center justify-between p-4 mx-3">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className={`size-10 rounded-full ${user?.image_url ? "" : "bg-gray-200"} items-center justify-center`}
        >
          <Image
            source={user?.image_url ? { uri: user?.image_url } : icon.userr}
            className={`${user?.image_url ? "size-10 rounded-full" : "size-6"}`}
            tintColor={user?.image_url ? "" : '#124BCC'}
            resizeMode='cover'
          />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#124BCC]">
          {user?.name} {t("Listings")}
        </Text>
        <View className="size-10" />
      </View>

      {userHouseLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#124BCC" />
          <Text className="mt-2 text-gray-600">{t("Loading your listings")}</Text>
        </View>
      ) : (
        <View className="flex-1 p-4">
          <Text className="text-gray-600 mb-4">
            {listings.length} {listings.length === 1 ? t('listing') : t('Listings')} {t("found")}
          </Text>

          {listings.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-center text-gray-500 text-lg mb-4">
                No listings found
              </Text>
              <TouchableOpacity
                onPress={onRefresh}
                className="bg-[#124BCC] px-6 py-3 rounded-lg"
              >
                <Text className="text-white font-semibold">Refresh</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <FlatList
              data={listings}
              keyExtractor={(item) => item._id || Math.random().toString()}
              renderItem={renderListingItem}
              showsVerticalScrollIndicator={true}
              refreshing={refreshing}
              onRefresh={onRefresh}
            />
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

export default Listing