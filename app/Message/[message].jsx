import { Entypo } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showToast } from 'rn-snappy-toast';
import { useStore } from '../../Stores/authStore';
import { messageStore } from '../../Stores/messageStore';
import icon from '../../constant/icons';


const Message = () => {
    const [messagez, setMessage] = useState({
        text: '',
        image_url: ''
    });
    const { getMessages,messages,sendMessage,subscribeToMessages,unsuscribeToMessages,selectedUser}=messageStore()
    const {user,getUser}=useStore()
    const {message}=useLocalSearchParams()
    const scrollRef=useRef();
    const { t } = useTranslation()

   useEffect(() => {
    if(message!==selectedUser._id) return;
    getMessages(message)

     subscribeToMessages()

     return () => unsuscribeToMessages()
   
   },[message,subscribeToMessages,unsuscribeToMessages,getMessages,selectedUser,messages])

   useEffect(() => {
    getUser()
   },[])

    useEffect(() => {
    if(messagez.image_url !== "" || messagez.text !== ""){
      scrollRef?.current?.scrollToEnd({
        behavior: "smooth",
        nearest: true,
        block:"end"
       });
    }
  }, [messages,messagez.text,messagez.image_url]);
   

          const pickImage = async () => {
       try {
         let result = await ImagePicker.launchImageLibraryAsync({
           mediaTypes: "images",
           aspect: [4, 3],
           quality: 1,
           base64: true, // Added base64: true to get base64 directly
         });
     
         if (result.canceled) return;
     
         // Check for video
         if (result.assets[0].mimeType === "video/quicktime") {
           showToast({
                         message: 'Only pictures are allowed',
                         duration: 5000,
                         type: 'warning',
                         position: 'top',
                         title: 'Warning',
                         animationType: 'slide',
                         progressBar: true,
                         richColors: true,
                       })
           return;
         }
     
         if (!result.canceled) {
           const selectedImage = result.assets[0];
           
           // Create base64 string with proper format for Cloudinary
           const base64Image = `data:${selectedImage.mimeType};base64,${selectedImage.base64}`;
           
           if (base64Image) { 
             setMessage({ ...messagez, image_url: base64Image });
           }
         }
       } catch (error) {
         console.log("Error picking image:", error);
         Alert.alert('Error', 'Failed to pick image');
       }
     };

   
    const handleSendMessage = () => {
        if (!messagez.text && !messagez.image_url) return;

        // Create a clean message object with only the properties that have values
        const cleanMessage = {
            ...(messagez.text && { text: messagez.text }),
            ...(messagez.image_url && { image_url: messagez.image_url })
        };

        sendMessage(message, cleanMessage);
        setMessage({ text: "", image_url: "" });
    };

 
    const removeImage=()=>{
        setMessage({...messagez,image_url:""})
    }

    const getSenderName = (msg) => {
        if (msg.senderId._id === user._id) {
            return msg.senderId.name || "You";
        } else {
            return msg.senderId.name || "Unknown";
        }
    };


 
    return (

            <SafeAreaView className="flex-1 bg-white">
     <KeyboardAvoidingView behavior={Platform.OS==="ios"?"padding":"height"} className="h-full bg-white">
                <View className='flex flex-row items-center justify-between  mx-3 bg-white'>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} className="size-10 rounded-full bg-gray-200 items-center justify-center">
                        <Entypo name="chevron-left" size={30} color="#124BCC" />
                    </TouchableOpacity>
                    <Text className='text-xl font-bold text-[#124BCC]'>{t("Chats")}</Text>
                </View>
                <ScrollView className="flex-1 mx-3"
                    ref={scrollRef} 
                    showsVerticalScrollIndicator={false}>
                    {messages?.map((msg, index) => (
                        <View key={index} className={`my-2 p-1 rounded-lg max-w-96 ${msg.senderId._id === user._id
                            ? "bg-blue-100 self-end" : "bg-gray-100 self-start"}`}>
                            <Text className={`${msg.senderId._id === user._id ? "text-right" : "text-left"} text-sm font-bold`}>{getSenderName(msg)}</Text>
                            {msg.image_url && <Image source={{uri:msg.image_url}} className="w-36 h-32 mx-auto my-1 " />}
                           {msg.text && <Text className={`${msg.senderId._id === user._id ? "text-right" : "text-left"} text-sm`}>{msg.text}</Text>}
                            <Text className={`${msg.senderId._id === user._id ? "text-right" : "text-left"} text-xs text-gray-500`}>{new Date(msg.createdAt).toLocaleString()}</Text>
                        </View>
                    ))}
                      {messagez.image_url && <View  className="my-2 mr-3 p-1 rounded-lg max-w-96 bg-blue-100 self-end relative">
                     <Image source={{uri:messagez.image_url}} className="w-36 h-32 " />
                    {messagez.image_url && <TouchableOpacity onPress={removeImage} activeOpacity={0.7} className="absolute -top-1 -right-2">
                                    <Image source={icon.cancel} className="size-5" tintColor={"#4b5563"} />
                                  </TouchableOpacity>}
                    </View>}
                </ScrollView>
                <View className="px-4 py-1 w-full flex-row items-center justify-between">
                    <TextInput
                        placeholder={t("Enter your message")}
                        multiline={true}
                        placeholderTextColor={'gray'}
                        className="text-gray-500 text-md border border-gray-200 rounded-full px-5 py-3 flex-1"
                        style={{ maxHeight: 50 }}
                        value={messagez.text}
                        numberOfLines={4}
                        onChangeText={(e) => setMessage({ ...messagez, text: e })}
                    />
                    <TouchableOpacity activeOpacity={0.7} className={`${messagez.image_url?"bg-[#124BCC]":"bg-gray-200"} opacity-80 rounded-full p-2 ml-2`}
                    onPress={pickImage}>
                        <Entypo name="plus" size={24} color={messagez.image_url?"white":"gray"}/> 
                    </TouchableOpacity>
                  <TouchableOpacity activeOpacity={0.7} className={`${messagez.image_url !== "" || messagez.text !== "" ?"bg-[#124BCC]":"bg-gray-200"} opacity-85 rounded-full p-2 ml-2`}
                  onPress={handleSendMessage}>
                        <Entypo name="paper-plane" size={24} color={messagez.image_url !== "" || messagez.text !== "" ?"white":"gray"} />
                    </TouchableOpacity>
                </View>
                   </KeyboardAvoidingView>
            </SafeAreaView>
     
    )
}

export default Message