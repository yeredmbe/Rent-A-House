import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { showToast } from 'rn-snappy-toast';
import icons from '../constant/icons';
import image from '../constant/image';
import { useStore } from '../Stores/authStore';


const Cardd = ({home_cover,address,category,_id}) => {

   const {user,getUser}=useStore()
    const [loading,setLoading]=useState(true)
    const [isLoading,setIsLoading]=useState(false)
  
    useEffect(()=>{
      getUser()
    },[])

   const addToFavorite=async(id)=>{
                  const storedToken = await AsyncStorage.getItem('token');
                const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
                    setIsLoading(true)
                    try{
               const response=await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/favorite/${id}`,{
                  method:"POST",
                  headers:{
                     "Content-Type":"application/json",
                "Authorization":`Bearer ${token}`
                  }
               })
               const data=await response.json()
        setIsLoading(false)
                showToast({
                    message: data.message,
                    duration: 5000,
                    type: 'success',
                    position: 'top',
                    title: 'Success',
                    animationType: 'slide',
                    progressBar: true,
                    richColors: true,
                  })
            }
            catch(err){
                  console.log(err.message)
            // Alert.alert("Error","Failed to upload")
            }  
                  }
  
  return (
        <View className="w-[135px] relative mx-1 my-1">
          <TouchableOpacity activeOpacity={0.7} className='flex w-[135px] relative mx-1 my-1' onPress={()=>router.push(`/House/${_id}`)}>
     <Image source={loading?image.load:{uri:home_cover}} className='w-[135px] h-44 rounded-lg ' resizeMethod='contain'
      onLoadEnd={()=>setLoading(false)} />
     </TouchableOpacity>
     <View className="w-full flex-row justify-between absolute bottom-0 left-0 right-0 p-2 rounded-b-lg">
     <View>
       <Text className="text-white font-bold text-xl absolute bottom-10 ">{!loading && category}</Text>
       <Text className="text-white text-xs absolute bottom-7 ">{!loading && address}</Text>
       </View>
     
       <TouchableOpacity activeOpacity={0.7} className="size-5"
       onPress={()=>{addToFavorite(_id)
         Haptics.notificationAsync(
                    Haptics.NotificationFeedbackType.Success
                    ) 
       }}>
        <Image source={!loading && user?.favorites?.includes(_id) ? icons.heart : icons.love} className="size-4 " tintColor={"#fff"}  />
        </TouchableOpacity>
</View>
     </View>
  )
}

export default Cardd