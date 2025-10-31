import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Switch, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showToast } from 'rn-snappy-toast'
import { default as icon, default as icons } from '../constant/icons'
import image from '../constant/image'
import { useStore } from '../Stores/authStore'
import { homeStore } from '../Stores/homeStore'

function formatNumber(number) {
    // Convert to string and split into integer and decimal parts
    const numStr = Number(number).toString();
    let integerPart = numStr;
    // Format integer part with dots as thousands separators
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
  const { user, getUser } = useStore()
  const { userHouseLoading, getUsersListings, userHouseListing } = homeStore()
  const [refreshing, setRefreshing] = useState(false)
 const [isLoading, setLoading]=useState(true)
const [availability, setAvailability] = useState({}); 

const toggleHouseAvailability = async (id) => {
  try {
    const storedToken = await AsyncStorage.getItem('token');
    const token = storedToken.startsWith('"') ? JSON.parse(storedToken) : storedToken;

    const response = await fetch(
      `https://rent-a-house-r0jt.onrender.com/api/v1/home/edit-availability/${id}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      }
    );
    const data = await response.json();
    // console.log(data);

    if (response.ok) {
      // Update local state
      setAvailability((prev) => ({
        ...prev,
        [id]: !prev[id]
      }));

      showToast({
        message: "Home status changed successfully",
        duration: 5000,
        type: 'success',
        position: 'top',
        title: 'Success',
        animationType: 'slide',
        progressBar: true,
        richColors: true,
      });
    }

  } catch (err) {
    console.log(err.message);
  }
};

  useEffect(() => {
    const fetchUser = async () => {
      await getUser()
    }
    fetchUser()
  }, [])

  useEffect(() => {
    getUsersListings()
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    await getUsersListings()
    setRefreshing(false)
  }

  const DebugInfo = (listings ) => {
//   console.log('Listings data:', listings)
//   console.log('Listings count:', listings?.length)
  
//   if (listings.length > 0) {
//     console.log('First listing:', listings[0])
//     console.log('First listing image URL:', listings[0]?.home_cover)
//   }
  
  return null
}


  // Safe access to userHouseListing
  const listings = Array.isArray(userHouseListing) ? userHouseListing : []
DebugInfo(listings)
  const renderListingItem = ({ item }) => (
    <TouchableOpacity
      className="mb-4 rounded-lg border border-gray-200 overflow-hidden "
      onPress={() => router.push(`/House/${item._id}`)}
    >
      <Image
        source={isLoading?image.load : { uri: item.home_cover }}
        className="w-full h-36"
        resizeMode="cover"
        onLoadEnd={() => setLoading(false)}
        onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
      />
      <View className="flex flex-row items-center justify-between p-4 bg-white">
       <View className="mt-2 p-2">
         <Text className="text-lg font-semibold">{item?.address || 'No Title'}</Text>
        <Text className="text-gray-600 mb-1">{item?.region || 'No Location'}</Text>
        <Text className="text-[#124BCC] font-bold">{item?.price ? `${formatNumber(item.price)} XAF` : 'Price not set'}</Text>
       </View>
       <View className="flex flex-col justify-end items-end">
         <View className="flex flex-row items-center">
            <Image source={icons.review} className="size-6" />
            <Text className="text-gray-600 ml-1 font-Churchill"> {item?.reviews?.length === 0
                    ? "No review"
                    : `${item?.reviews?.length} ${item?.reviews?.length === 1 ? "review" : "reviews"}`
                  }</Text>
         </View>
         <TouchableOpacity activeOpacity={0.7} onPress={()=>router.push(`/House/${item._id}`)}>
        <Switch
            trackColor={{ false: '#767577', true: '#123BCC' }}
            thumbColor={"#fff"}
            ios_backgroundColor="#3e3e3e"
            onValueChange={() => toggleHouseAvailability(item._id)}
            value={availability[item._id] ?? item.isAvailable} // ✅ fallback to backend value
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }], marginTop: 10 }}
          />
        </TouchableOpacity>
       </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex flex-row items-center justify-between p-4 mx-3">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.back()}
          className={`size-10 rounded-full ${
            user?.image_url ? '' : 'bg-gray-200'
          } items-center justify-between`}
        >
           <TouchableOpacity activeOpacity={0.7} onPress={()=>router.back()} className={`size-10 rounded-full ${user?.image_url?"":"bg-gray-200 "}items-center justify-center`}>
           <Image source={user?.image_url?{uri:user?.image_url}:icon.userr} className={`${user?.image_url?"size-10 rounded-full":"size-6"}`} tintColor={user?.image_url?"":'#124BCC'} resizeMode='cover' />
          </TouchableOpacity>
        </TouchableOpacity>
        <Text className="text-xl font-bold text-[#124BCC]">
          {user?.name}'s Listings
        </Text>
        <View className="size-10" />
      </View>

      {/* Loading state */}
      {userHouseLoading && !refreshing ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#124BCC" />
          <Text className="mt-2 text-gray-600">Loading your listings...</Text>
        </View>
      ) : (
        <View className="flex-1 p-4">
          <Text className="text-gray-600 mb-4">
            {listings.length} {listings.length === 1 ? 'listing' : 'listings'} found
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