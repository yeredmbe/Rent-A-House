import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { showToast } from 'rn-snappy-toast';
import icons from '../constant/icons';
import image from '../constant/image';
import { useStore } from '../Stores/authStore';




const Card = ({home_cover,category,address,price,_id}) => {
   const [loading,setLoading]=useState(true)
    const [isLoading,setIsLoading]=useState(false)
      const {user,getUser}=useStore()
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
  return (
     
        <View className="flex android:w-[160px] w-[185px] mx-2 my-1">
          <TouchableOpacity activeOpacity={0.7} onPress={()=>router.push(`/House/${_id}`)} >
     <Image source={loading?image.load:{uri:home_cover}} className='w-full h-64 rounded-lg relative' resizeMethod='contain'
     onLoadEnd={()=>setLoading(false)} />
     </TouchableOpacity>
     <View className="flex flex-row justify-between items-center px-3">
     <View>
       <Text className="text-white font-bold text-xl absolute bottom-10 ">{!loading && category}</Text>
       <Text className="text-white text-xs absolute bottom-7 ">{!loading && address}</Text>
       </View>
       <View className="flex flex-row items-center justify-between w-full">
         <TouchableOpacity activeOpacity={0.7} 
         onPress={()=>{addToFavorite(_id)
           Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
            ) 
         }}>
        <Image source={!loading && user?.favorites?.includes(_id) ? icons.heart :  icons.love} className=" size-5" tintColor={"#124BCC"} />
        </TouchableOpacity>
       <Text className="text-black my-1 font-bold text-xl ">{!loading && formatNumber(price)} {!loading && "XAF"}</Text>
     </View>
     </View>
     </View>
  )
}

export default Card