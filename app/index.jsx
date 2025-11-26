import { Entypo } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ActivityIndicator, Dimensions, FlatList, Image, Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useStore } from '../Stores/authStore';

export default function Index() {
  const { getUser, user,isLoading } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef=React.useRef();
    const { t } = useTranslation()

    
  const Images = [
    { id: 0, src: require("../assets/images/House-searching-amico.png") },
    { id: 1, src: require("../assets/images/House-searching-rafiki.png") },
    { id: 2, src: require("../assets/images/House-searching-bro.png") },
    { id: 3, src: require("../assets/images/House-searching-pana.png") },
  ]
 
   useEffect(()=>{
    const getAUser=async()=>{
  await getUser();
 }
    getAUser();
  },[getUser])



useEffect(() => {
  if (user) {
    router.replace("/Home");
  }
}, [user]);

  if(isLoading){
    return(
    <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#124BCC" />
        <Text className="text-sm font-bold text-gray-500 mt-2">Loading...</Text>
      </SafeAreaView>
    )}
  
  return (
    <SafeAreaView
      className="flex-1 flex flex-col items-center justify-center bg-white"
    >
      <View className="w-full h-5/6">
        <FlatList
          ref={scrollRef}
          data={Images}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(event) => { setCurrentIndex((event.nativeEvent.contentOffset.x / Dimensions.get("window").width).toFixed(0)) }}

          renderItem={({ item, index }) => (
            <View className="h-5/6 android:h-[80%] items-center justify-center"
              width={Dimensions.get("window").width}>
              <Image source={item.src} className="w-full h-full" resizeMode="contain" />
            </View>
          )}
          keyExtractor={(item) => item.id}
        />
      </View>

     {/*  {currentIndex > 0 && (
        <TouchableOpacity onPress={() => {scrollRef.current.scrollToOffset({ offset: (parseInt(currentIndex )- 1) * Dimensions.get("window").width, animated: true })}} activeOpacity={0.7} className=" flex flex-row items-center justify-start bg-[#124BCC]  rounded-lg px-5 py-2 absolute bottom-12 left-9">
          <Entypo name="chevron-left" size={30} color="white" />
          <Text className="text-white">Previous</Text>
        </TouchableOpacity> 
      )}
*/}
      {currentIndex === (Images.length - 1).toString() && (
        <TouchableOpacity onPress={() => router.push("/(auth)/SignUp")} activeOpacity={0.7} className=" flex flex-row items-center justify-start bg-[#124BCC] rounded-lg px-5 py-2 absolute bottom-12 right-9">
          <Text className="text-white">{t("Continue")}</Text>
          <Entypo name="chevron-right" size={30} color="white" />
        </TouchableOpacity>
      )}
      {/* this is the bullet section */}

     <View className={`flex-row ${Platform.OS === 'android' ? 'mb-6' : 'mb-4'}`}>
  {Images.map((item, index) => (
    <View 
      key={item.id} 
      className={`${currentIndex == item.id ? "w-8 h-4" : "size-4"} ${currentIndex == item.id ? "bg-[#124BCC]" : "bg-gray-400"} mx-1 mb-12 rounded-full`} 
    />
  ))}
</View>
    </SafeAreaView>
  );
}
