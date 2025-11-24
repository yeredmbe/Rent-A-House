import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Card from '../../components/Card'
import Cardd from '../../components/Cardd'
import icon from '../../constant/icons'
import { useStore } from '../../Stores/authStore'
import { homeStore } from '../../Stores/homeStore'

const Home = () => {
  const { user, getUser } = useStore()
  const { Homes, isLoading, getAllHomes, recentlyPosted, recentPosted,getByCategory,categoryHome } = homeStore()
  const [refreshing, setRefreshing] = useState(false)
  const [category, setCategory] = useState("All")

  useEffect(() => {
    getUser()
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([getAllHomes(), recentlyPosted()])
    } catch (error) {
      console.error('Failed to load data:', error)
    }
  }

  // Filter homes based on selected category
  const filteredHomes = category === "All" 
    ? (Homes || []) 
    : (categoryHome || []).filter(home => 
        home?.category === category
      )

  // Generate a unique key for each item
  // const keyExtractor = (item, index) => {
  //   return item && item._id ? item._id.toString() : `item-${index}`
  // }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className='flex flex-row items-center justify-between p-4 mx-3'>
        <TouchableOpacity activeOpacity={0.7} onPress={()=>router.push("/Profile")} className={`size-10 rounded-full ${user?.image_url?"":"bg-gray-200 "}items-center justify-center`}>
          <Image source={user?.image_url?{uri:user?.image_url}:icon.userr} className={`${user?.image_url?"size-10 rounded-full":"size-6"}`} tintColor={user?.image_url?"":'#124BCC'} resizeMode='cover' />
        </TouchableOpacity>
        <Text className='text-xl font-bold text-[#124BCC]'>Home</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/Search")} >
          <Image source={icon.search} className='size-6' tintColor={"#124BCC"} />
        </TouchableOpacity>
      </View>
      
      <View className='w-ful'>
        <Text className="text-xl font-bold text-[#124BCC] mx-5 ">Recently Added</Text>
        <FlatList
          data={recentPosted || []}
          renderItem={({item}) => <Cardd {...item} />}
          className="mx-3 mb-1"
          keyExtractor={(item, index) => item?._id ? item._id.toString() : `recent-${index}`} // ✅ fixed
          horizontal
          showsHorizontalScrollIndicator={false}
        />
      </View>
      
      <View className='w-full py-2'>
        <Text className="text-xl font-bold text-[#124BCC] mx-5 mb-2">Available Houses</Text>
        <FlatList
          className="m-3"
          data={["All","House", "Apartment", "Villa", "Office","Studio","Penthouse","Townhouse","Duplex","Bungalow","Cottage","Mansion","Room","Store"]}
          renderItem={({item, index}) => (
            <TouchableOpacity 
              onPress={()=>{setCategory(item); 
                getByCategory(item)
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft) }} 
              activeOpacity={0.7} 
              className={`${category===item ? "bg-[#124BCC]" : "bg-gray-200"} h-10 items-center justify-center px-4 mx-3 rounded-full`}
            >
              <Text className={`${category===item ? "text-white" : "text-black"} font-bold`}>{item}</Text>
            </TouchableOpacity>
          )}
          bounces={false}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item, index) => `${item}-${index}`} // ✅ fixed
        /> 
      </View>

      {isLoading? <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#124BCC" />
      </SafeAreaView>:
      <View className='w-full h-full'>
        {filteredHomes && filteredHomes.length > 0 ? (
          <FlatList 
            className="android:mx-3"
            contentContainerStyle={{alignItems:"center",justifyContent:"center"}}
            data={filteredHomes} 
            renderItem={({item}) => <Card {...item} />}
            keyExtractor={(item, index) => item?._id ? item._id.toString() : `home-${index}`} // ✅ fixed
            showsVerticalScrollIndicator={false}
            numColumns={2}
          />
        ) : (
          <View className="h-64 justify-center items-center">
            <Text className="text-gray-500">No homes available</Text>
            <TouchableOpacity 
              activeOpacity={0.7}
              onPress={loadData}
              className="mt-4 bg-[#124BCC] px-4 py-2 rounded-lg"
            >
              <Text className="text-white">Try Again</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>}
    </SafeAreaView>
  )
}

export default Home
