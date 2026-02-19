import { Entypo } from '@expo/vector-icons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, FlatList, Image, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import icons from '../../constant/icons'



const Favorite = () => {
      const [isLoading,setLoading]=useState(true)
      const [homes,setHomes]=useState([])
      const { t } = useTranslation()
    
     const getFavorites=async()=>{
      try{
      const storedToken = await AsyncStorage.getItem('token');
  const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
        
        const response=await fetch("https://rent-a-house-r0jt.onrender.com/api/v1/home/favorite",{
            method:"GET",
            headers:{
                 "Content-Type":"application/json",
            "Authorization":`Bearer ${token}`
            }
        })
        const res=await response.json()
        setHomes(res.homes || [])
        setLoading(false)
      }catch(err){
          console.log(err.message)
          setLoading(false)
          setHomes([])
        
        // Alert.alert("Error","Failed to upload")
      }
     }
      useEffect(() => {
          getFavorites()
    
      },[]) 

     return (
    <SafeAreaView className="bg-white">
      <View className='flex flex-row items-center justify-between p-4 mx-3'>
                <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} className="size-10 rounded-full bg-gray-200 items-center justify-center">
                        <Entypo name="chevron-left" size={30} color="#124BCC" />
                    </TouchableOpacity>
      <Text className='text-2xl font-bold text-[#124BCC]'>{t("Favorite")}</Text>
      </View>
       {isLoading ? (
        <View className="h-full justify-center items-center">
          <ActivityIndicator size="large" color="#124BCC" />
        </View>
      ) : (
        <FlatList
        data={homes}
        className="mx-2 bg-gray-100 h-full"
        renderItem={({item,index})=>{
          return(
             <TouchableOpacity activeOpacity={0.6}
       className={`p-4 ${homes?.length - 1 === index ?"": "border-b"} flex flex-row items-center justify-between border-gray-200 mx-2 rounded `}
       onPress={() => router.push(`/House/${item._id}`)}
     >
              <View className="flex flex-row items-center">
    <View className="">
      <Text className="text-base font-semibold text-[#124BCC]">{item.address}</Text>
      <Text className="text-sm text-gray-500">{item.description.slice(0,40)}{item.description.length >40 ? "...": ""}</Text>
        <Text className="text-xs text-gray-400 ">{item.category}</Text>
    </View>
    </View>
    <View className={`flex size-12 items-center p-4 justify-center bg-slate-200 rounded-full `}>
      <Image source={icons.heartFavorite} className={"size-8  rounded-xl opacity-80"} resizeMode={`contain`} alt="More Icon" />
    
    </View>
              </TouchableOpacity>
          )
        }}
        refreshing={isLoading}
        onRefresh={getFavorites}
        keyExtractor={(item)=>item._id.toString()}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={()=><View className="w-full items-center justify-center my-5 p-4">
      <View className="w-24 h-40 items-center my-5 justify-center"/>
      <Text className="text-2xl font-bold text-gray-900">{t("noFavorite")}</Text>
      <Text className="text-gray-400 mt-2">{t("AddToFavoriteMessage")}</Text>
      <View className="w-full items-center justify-center">
        <Image source={icons.touch} className="size-[100px] my-5 opacity-65" />
      </View>
    </View>}
       />)}
    </SafeAreaView>
  )
}

export default Favorite