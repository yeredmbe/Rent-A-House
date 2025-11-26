import { Entypo } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Dimensions, FlatList, Image, ImageBackground, KeyboardAvoidingView, Linking, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showToast } from 'rn-snappy-toast';
import icons from '../../constant/icons';
import image from '../../constant/image';
import { useStore } from '../../Stores/authStore';
import { homeStore } from '../../Stores/homeStore';
import { messageStore } from '../../Stores/messageStore';




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

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) {
    return 'just now';
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hr${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  }
  
  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w`;
  }
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths}m`;
  }
  
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears}y`;
}

const DetailPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true)
  const [isLoaded, setIsLoading] = useState(false)
  const { Home, getHomeById, isLoading, addReview } = homeStore();
  const {setSelectedUser}=messageStore()
  const { detail } = useLocalSearchParams();
  const { user, getUser } = useStore();
  const [isOpen, setIsOpen] = useState(false)
  const [text, setText]=useState("")
  const [isClicked,setIsClicked]=useState(false)
  const { t } = useTranslation()


  useEffect(() => {
    getHomeById(detail);
  }, [detail]);

  // whatsapp url 
  useEffect(() => {
    getUser();
  }, []);
  
  const handleSendMessage = async () => {
    setIsClicked(true)
    if(isClicked) return
   await addReview(Home?._id,{text});
   setText("")
   setIsOpen(!isOpen)
   setIsClicked(false)
  
  }

  const checkUser = () => {
    if (user?._id === Home?.userId._id) return
    else router.push(`/Message/${Home?.userId?._id}`)
    setSelectedUser(Home?.userId)
  }

  const addToFavorite = async (id) => {
    const storedToken = await AsyncStorage.getItem('token');
    const token = storedToken?.startsWith('"') ? JSON.parse(storedToken) : storedToken;
    setIsLoading(true)
    try {
      const response = await fetch(`https://rent-a-house-r0jt.onrender.com/api/v1/home/favorite/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      })
      const data = await response.json()
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
    catch (err) {
      console.log(err.message)
      // Alert.alert("Error","Failed to upload")
    }
  }


  return (
    <View className="flex-1 bg-white">
      <View className="flex-1 relative">
        <FlatList
          data={Home?.details}
          keyExtractor={(item, index) => index.toString()}
          onScroll={(event) => {
            setCurrentIndex((event.nativeEvent.contentOffset.x / Dimensions.get('window').width).toFixed(0));
          }}
          renderItem={({ item }) => (
            <ImageBackground
              source={loading || isLoading ? image.loader : { uri: item }}
              className="w-full h-[450px] bg-cover bg-center "
              style={{ width: Dimensions.get('window').width, height: 450 }}
              resizeMode='cover'
              onLoadEnd={() => setLoading(false)}
            >

            </ImageBackground>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          pagingEnabled
        />

        <View className="flex-row absolute bottom-0 left-0 right-0 justify-center">
          {!loading && Home?.details?.map((item, index) => (
            <View key={index} className={`size-4 bg-transparent border ${currentIndex == index ? "border-[#124BCC] " : " border-white bg-slate-600"} mx-1 mb-12 rounded-full`} >
            </View>
          ))}
        </View>
        <View className="absolute top-9 left-0 right-0 h-16 flex flex-row items-center justify-between mx-2 px-4">
          <TouchableOpacity activeOpacity={0.7} className="bg-gray-100 rounded-full p-2" onPress={() => router.back()}><Entypo
            name="chevron-left"
            size={23}
            color="#334155"
          />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7} className="bg-[#124BCC] rounded-full p-2"
            onPress={() =>{ addToFavorite(Home?._id)
               Haptics.notificationAsync(
                              Haptics.NotificationFeedbackType.Success
                            ) 
            }}>
            <Image source={user?.favorites?.includes(Home?._id) ? icons.heart : icons.love} className="w-6 h-6" tintColor={"white"} />
          </TouchableOpacity>
        </View>
      </View>

      <View className=" flex-1 px-4 my-2">
        <ScrollView className="flex-1"
          nestedScrollEnabled={true}
          showsVerticalScrollIndicator={false}>
          {isLoading ? <View className="w-full h-full bg-white items-center justify-center my-5 p-4">
            <View className="w-24 h-20 items-center my-5 justify-center" />
            <ActivityIndicator size="large" color="#124BCC" animating={isLoading} />
            <Text className="text-gray-400 mt-2">{t("Please wait")}</Text>
          </View> :
            <View>
              <View className="px-2 flex-row items-center justify-between">
                <View>
                  {user?._id !== Home?.userId?._id && <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`ProfileUser/${Home.userId?._id}`)} className="flex flex-row items-center mt-3">
                    <Image source={loading || isLoading ? image.load : { uri: Home?.userId?.image_url }} className="w-7 h-7 rounded-full" />
                    <Text className="text-gray-500 text-sm ml-2 ">{Home?.userId?.name}</Text>
                  </TouchableOpacity>}
                  <View className="flex flex-row items-center my-3">
                    <Image source={icons.location} className="w-7 h-7" tintColor={"#124BCC"} />
                    <Text className="text-gray-500 ml-2">Location: {Home?.city}</Text>
                  </View>

                </View>
                <View >
                  <View className="flex flex-row items-center mt-3">
                    <Image source={icons.labell} className="w-7 h-7" tintColor="red" />
                    <Text className="text-black text-xl ml-1 font-Churchillbold">{Home?.price && formatNumber(Home?.price)} XAF</Text>
                  </View>
                  {user?._id !== Home?.userId?._id && <TouchableOpacity activeOpacity={0.7} className={`${Home?.isAvailable ? "bg-[#12cc21a2]" : "bg-[#dc2626]"}  border-green-900 rounded-full p-2 my-3`}>
                    <Text className="text-white text-center font-bold">{Home?.isAvailable ? t("Available") : t("Taken")}</Text>
                  </TouchableOpacity>}
                </View>
              </View>
              <View className="my-2 w-full px-2">
                <Text className="text-lg font-bold">{t("title")}</Text>
                <Text className="text-gray-500 mt-1">{Home?.address}</Text>
              </View>
              <View className="my-5 w-full px-2">
                <Text className="text-lg font-bold">Description</Text>
                <Text className="text-gray-500 mt-1">{Home?.description}</Text>
              </View>
              <TouchableOpacity activeOpacity={0.7} className="flex flex-row items-center" onPress={() => setIsOpen(!isOpen)}>
                <Image source={icons.review} className="size-6" />
                <Text className="text-gray-600 ml-1 font-Churchill">
                  {Home?.reviews?.length === 0
                    ? t("No review")
                    : `${Home?.reviews?.length} ${Home?.reviews?.length === 1 ? t("review") : t("reviews")}`
                  }
                </Text>
              </TouchableOpacity>
              <View className="my-8 w-full px-2 flex flex-row items-center justify-start">
                <Text className="text-lg font-bold">{t("Category")}:</Text>
                <Text className="text-gray-500 mt-1 ml-2">{Home?.category}</Text>
              </View>
              <View className="my-2 w-full flex-row items-center justify-start px-2">
                <Text className="text-md font-bold">Contact:</Text>
                <Text className="text-gray-500 text-md mx-1">{Home?.userId?.name}</Text>

              </View>
              <View className="my-4 flex flex-row items-center justify-start w-full px-2">
                <TouchableOpacity activeOpacity={0.7} className=" p-3 rounded-lg items-center justify-center"
                  onPress={() => Linking.openURL(`${Home?.whatsapp_url}`)}>
                  <Image source={icons.whatsapp} className="size-12" tintColor={"green"} />
                </TouchableOpacity>
                <TouchableOpacity activeOpacity={0.7} className=" p-3 rounded-lg items-center justify-center"
                  onPress={() =>{ 
                    if(!Home?.facebook_url){
                      return;
                    }
                    Linking.openURL(`${Home?.facebook_url}`)}}>
                  <Image source={icons.facebook} className="size-12" tintColor={"blue"} />
                </TouchableOpacity>
                {/* <TouchableOpacity activeOpacity={0.7} className=" p-3 rounded-lg items-center justify-center">
              <Image source={icons.telephone} className="size-12" tintColor={"orange"} /> 
            </TouchableOpacity>
             <TouchableOpacity activeOpacity={0.7} className=" p-3 rounded-lg items-center justify-center">
              <Image source={icons.gmail} className="size-12" /> 
            </TouchableOpacity> */}
              </View>
              {user?._id !== Home?.userId?._id && <View className="mt-4 mb-8 w-full px-2">
                <TouchableOpacity activeOpacity={0.7} className="bg-[#124BCC] p-3 rounded-full items-center justify-center"
                  onPress={checkUser}>
                  <Text className="text-white text-lg font-semibold">{t("Message")} {Home?.userId?.name}</Text>
                </TouchableOpacity>
              </View>}
            </View>}
        </ScrollView>
        <Modal
          visible={isOpen}
          onRequestClose={() => setIsOpen(!isOpen)}
          animationType='slide'
          presentationStyle='pageSheet'
        >
          <View className="my-2 p-3 w-full justify-end items-end">
            <TouchableOpacity activeOpacity={0.6} onPress={() => setIsOpen(!isOpen)}>
              <Image source={icons.cancel} tintColor={"#123BCC"} className="size-7" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={Home?.reviews}
            keyExtractor={(item, index) => item?._id.toString()}
            nestedScrollEnabled={true}
            className="p-4"
            renderItem={({ item }) => {
              return (
                <TouchableOpacity onPress={() => {
                  router.push(`ProfileUser/${item?.userId?._id}`)
                  setIsOpen(!isOpen)
                }} activeOpacity={0.7} className="w-full flex flex-row mt-3">
                  <Image source={!item?.userId?.image_url? image.load : { uri: item?.userId?.image_url }} className="size-10 rounded-full border" />
                  <View className="ml-2">
                    <Text className="text-md text-gray-500">{item?.text}</Text>
                    <View className="flex flex-row items-center justify-start ">
                      <Text className="text-gray-500 font-bold text-sm mr-3">{item?.userId?.name}</Text>
                      <Text className="text-gray-500 text-sm">{formatRelativeTime(item?.createdAt)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )
            }}

            ListEmptyComponent={() => {
              return (
                <View className="w-full h-full bg-white items-center justify-center my-5 p-4">
                  <Image source={icons.evaluate} tintColor={"gray"} className="size-96 opacity-40" resizeMode='contain' />
                  <Text className="text-gray-400 mt-2">No review yet.</Text>
                  <Text className="text-gray-400 mt-2">Be the first to review this property!</Text>
                </View>)
            }}
          />
           <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} className=" bg-white"
           contentContainerStyle={{flex:1,}}
           keyboardVerticalOffset={40}
          >
          <View className="flex flex-row items-end p-4 my-2">
             <View className="flex flex-row justify-start items-center flex-1 ">
             <Image source={!user?.image_url ? image.load : { uri: user?.image_url }} className="size-10 rounded-full border" />
            <TextInput
            placeholder='Add a review'
            placeholderTextColor={'gray'}
            onChangeText={(text) => setText(text)}
            value={text}
            className='border border-gray-200 rounded-full p-2 w-72 android:w-64 ml-3' />
             </View>
             <TouchableOpacity activeOpacity={0.7} className={`${ text !== "" ?"bg-[#124BCC]":"bg-gray-200"} opacity-85 rounded-full p-2 ml-2`}
                  onPress={handleSendMessage}>
                        <Entypo name="paper-plane" size={24} color={text !== "" ?"white":"gray"} />
                    </TouchableOpacity>
         
          </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </View>
  )
}

export default DetailPage