
import { Entypo } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import icons from '../constant/icons'
import { messageStore } from '../Stores/messageStore'


const Message = () => {
  const {getChatUsers,chatUsers,setSelectedUser,toggleReadMessages}=messageStore()
  const { t } = useTranslation()

  useEffect(() => {
    getChatUsers()
  },[])

  return (
  <SafeAreaView className="flex-1 bg-white">
    <View className="flex flex-row items-center justify-between px-4 mx-3 my-1">
       <TouchableOpacity activeOpacity={0.7} onPress={()=>router.back()} className="size-10 rounded-full bg-gray-200 items-center justify-center">
               <Entypo name="chevron-left" size={30} color="#124BCC" onPress={()=>router.back()} />
               </TouchableOpacity>
  <Text className="text-2xl font-bold text-[#124BCC]  mx-5 my-5">Messages</Text>
      </View>
      {/* this has to be checked why it's not showing the messages */}
    <ScrollView className="bg-gray-100 " >
    { chatUsers?.length === 0 ? <View className="w-full items-center justify-center my-5 p-4">
      <View className="w-24 h-40 items-center my-5 justify-center"/>
      <Text className="text-2xl font-bold text-gray-900">{t("noMessages")}</Text>
      <Text className="text-gray-400 mt-2">{t("startConversation")}</Text>
      <View className="w-full items-center justify-center">
        <Image source={icons.message} className="size-[100px] my-5 opacity-65" tintColor={"#124BCC"} />
      </View>
    </View>:
    (
      chatUsers?.map((item, index) => (
             <TouchableOpacity activeOpacity={0.6} onPress={()=>{
              setSelectedUser(item)
              toggleReadMessages(item._id)
              router.push(`/Message/${item._id}`)}}
      key={item._id} className={`p-4 ${chatUsers.length - 1 === index ?"": "border-b"} ${item.isRead? "":"bg-indigo-400/10"} flex flex-row items-center justify-between border-gray-200 mx-2 rounded `}>
              <View className="flex flex-row items-center">
    <View className="">
      <Text className="text-base font-semibold text-[#124BCC]">{item.name}</Text>
      <Text className="text-sm text-gray-500">{t("newMessage")} {item.role === "landLord"? t("LandLord") : "Client"}.</Text>
        <Text className="text-xs text-gray-400 ">{new Date(item.createdAt).toDateString()}</Text>
    </View>
    </View>
    <View className={`flex size-12 items-center ${item.image_url?"":"p-4 "}justify-center bg-slate-200 rounded-full `}>
      <Image source={item?.image_url?{uri:item.image_url}:require('../assets/icons/userr.png')} tintColor={`${item.image_url?"":"#124BCC"}`} className={`${item.image_url?"size-full rounded-full":"size-8  rounded-xl opacity-60"}`} resizeMode={`${item.image_url?"cover":"contain"}`} alt="More Icon" />
    
    </View>
              </TouchableOpacity>
            ))
          ) }
    </ScrollView>
  </SafeAreaView>
  )
}

export default Message