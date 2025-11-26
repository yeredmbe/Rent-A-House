import * as Haptics from 'expo-haptics'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation()

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

     const categories = [
    { label: 'House', value: 'House' },
    { label: 'Apartment', value: 'Apartment' },
    { label: 'Villa', value: 'Villa' },
    { label: 'Office', value: 'Office' },
    { label: "Studio", value: "Studio" },
    { label: "Townhouse", value: "Townhouse" },
    { label: "Penthouse", value: "Penthouse" },
    { label: "Duplex", value: "Duplex" },
    { label: "Bungalow", value: "Bungalow" },
    { label: "Cottage", value: "Cottage" },
    { label: "Mansion", value: "Mansion" },
    { label: "Room", value: "Room" },
    {label:"Store", Value:"Store"}
  ];

  return (
    <SafeAreaView className="h-screen bg-white">
      <View className='flex flex-row items-center justify-between p-4 mx-3'>
        <TouchableOpacity activeOpacity={0.7} onPress={()=>router.push("/Profile")} className={`size-10 rounded-full ${user?.image_url?"":"bg-gray-200 "}items-center justify-center`}>
          <Image source={user?.image_url?{uri:user?.image_url}:icon.userr} className={`${user?.image_url?"size-10 rounded-full":"size-6"}`} tintColor={user?.image_url?"":'#124BCC'} resizeMode='cover' />
        </TouchableOpacity>
        <Text className='text-xl font-bold text-[#124BCC]'>{t("Home")}</Text>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.push("/Search")} >
          <Image source={icon.search} className='size-6' tintColor={"#124BCC"} />
        </TouchableOpacity>
      </View>
      
      <View className='w-ful'>
        <Text className="text-xl font-bold text-[#124BCC] mx-5 ">{t("RencentlyAdded")}</Text>
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
        <Text className="text-xl font-bold text-[#124BCC] mx-5 mb-2">{t("AvailableHouses")}</Text>
        <FlatList
          className="m-3"
          data={categories}
          renderItem={({item, index}) => (
            <TouchableOpacity 
              onPress={()=>{setCategory(item.value); 
                getByCategory(item.value)
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft) }} 
              activeOpacity={0.7} 
              className={`${category===item.value ? "bg-[#124BCC]" : "bg-gray-200"} h-10 items-center justify-center px-4 mx-3 rounded-full`}
            >
              <Text className={`${category===item.value ? "text-white" : "text-black"} font-bold`}>{t(`${item.label}`)}</Text>
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
      <View className='flex-1'>
  {filteredHomes && filteredHomes.length > 0 ? (
    <FlatList 
      className="mx-3 flex-1"
      contentContainerStyle={{
        alignItems:"center",
        flexGrow: 1, // Allow content to grow
      }}
      data={filteredHomes} 
      renderItem={({item}) => <Card {...item} />}
      keyExtractor={(item, index) => item?._id ? item._id.toString() : `home-${index}`}
      showsVerticalScrollIndicator={false}
      numColumns={2}
      // Add these props for better scrolling
      alwaysBounceVertical={true}
      bounces={true}
    />
  ) : (
    <View className="flex-1 justify-center items-center">
      <Text className="text-gray-500">{t("noHomeAvailable")}</Text>
      <TouchableOpacity 
        activeOpacity={0.7}
        onPress={loadData}
        className="mt-4 bg-[#124BCC] px-4 py-2 rounded-lg"
      >
        <Text className="text-white">{t("tryAgain")}</Text>
      </TouchableOpacity>
    </View>
  )}
</View>}
    </SafeAreaView>
  )
}

export default Home
