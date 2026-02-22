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
    const [pendingMessages, setPendingMessages] = useState([]);
    const { getMessages, messages, sendMessage, subscribeToMessages, unsuscribeToMessages, selectedUser } = messageStore()
    const { user, getUser } = useStore()
    const { message } = useLocalSearchParams()
    const scrollRef = useRef();
    const { t } = useTranslation()

    useEffect(() => {
        if (message !== selectedUser._id) return;
        getMessages(message)
        subscribeToMessages()
        return () => unsuscribeToMessages()
    }, [message, subscribeToMessages, unsuscribeToMessages, getMessages, selectedUser])

    // Remove pending messages only when their content is confirmed in the real messages list
    useEffect(() => {
        if (!messages?.length || !pendingMessages.length) return;

        setPendingMessages(prev =>
            prev.filter(pending => {
                // Keep pending if its text/image is not yet found in real messages
                return !messages.some(msg =>
                    msg.text === pending.text &&
                    msg.image_url === pending.image_url &&
                    msg.senderId._id === user._id
                );
            })
        );
    }, [messages]);

    useEffect(() => {
        getUser()
    }, [])

    // Auto-scroll whenever messages or pendingMessages change
    useEffect(() => {
        setTimeout(() => {
            scrollRef?.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages, pendingMessages]);


    const pickImage = async () => {
        try {
            let result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: "images",
                aspect: [4, 3],
                quality: 1,
                base64: true,
            });

            if (result.canceled) return;

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
        const hasText = messagez.text.trim().length > 0;
        const hasImage = messagez.image_url !== "";

        if (!hasText && !hasImage) return;

        const cleanMessage = {
            ...(messagez.text && { text: messagez.text }),
            ...(messagez.image_url && { image_url: messagez.image_url })
        };

        // Immediately show the message in the chat (optimistic UI)
        const optimisticMsg = {
            _id: `pending-${Date.now()}`,
            senderId: { _id: user._id, name: user.name },
            text: cleanMessage.text || "",
            image_url: cleanMessage.image_url || "",
            createdAt: new Date().toISOString(),
            pending: true,
        };

        setPendingMessages(prev => [...prev, optimisticMsg]);
        setMessage({ text: "", image_url: "" }); // Clear input immediately
        sendMessage(message, cleanMessage);       // Send in background
    };


    const removeImage = () => {
        setMessage({ ...messagez, image_url: "" })
    }

    const getSenderName = (msg) => {
        if (msg.senderId._id === user._id) {
            return msg.senderId.name || "You";
        } else {
            return msg.senderId.name || "Unknown";
        }
    };

    const allMessages = [...(messages ?? []), ...pendingMessages];

    return (
        <SafeAreaView edges={['top']} className="flex-1 bg-white">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 bg-white"
                keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
            >
                <View className='flex flex-row items-center justify-between mx-3 bg-white py-2'>
                    <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} className="size-10 rounded-full bg-gray-200 items-center justify-center">
                        <Entypo name="chevron-left" size={30} color="#124BCC" />
                    </TouchableOpacity>
                    <Text className='text-xl font-bold text-[#124BCC]'>{t("Chats")}</Text>
                    {/* Spacer to keep title centered */}
                    <View className="size-10" />
                </View>

                <ScrollView
                    className="flex-1 mx-3"
                    ref={scrollRef}
                    showsVerticalScrollIndicator={false}
                    onContentSizeChange={() => scrollRef?.current?.scrollToEnd({ animated: true })}
                >
                    {allMessages.map((msg, index) => (
                        <View
                            key={msg._id ?? index}
                            className={`my-2 p-1 rounded-lg max-w-96 ${msg.senderId._id === user._id
                                ? "bg-blue-100 self-end"
                                : "bg-gray-100 self-start"
                            }`}
                        >
                            <Text className={`${msg.senderId._id === user._id ? "text-right" : "text-left"} text-sm font-bold`}>
                                {getSenderName(msg)}
                            </Text>
                            {msg.image_url && (
                                <Image source={{ uri: msg.image_url }} className="w-36 h-32 mx-auto my-1" />
                            )}
                            {msg.text && (
                                <Text className={`${msg.senderId._id === user._id ? "text-right" : "text-left"} text-sm`}>
                                    {msg.text}
                                </Text>
                            )}
                            <Text className={`${msg.senderId._id === user._id ? "text-right" : "text-left"} text-xs text-gray-400`}>
                                {msg.pending ? "⏱ Sending..." : new Date(msg.createdAt).toLocaleString()}
                            </Text>
                        </View>
                    ))}

                    {/* Image preview before sending */}
                    {messagez.image_url && (
                        <View className="my-2 mr-3 p-1 rounded-lg max-w-96 bg-blue-100 self-end relative">
                            <Image source={{ uri: messagez.image_url }} className="w-36 h-32" />
                            <TouchableOpacity onPress={removeImage} activeOpacity={0.7} className="absolute -top-1 -right-2">
                                <Image source={icon.cancel} className="size-5" tintColor={"#4b5563"} />
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>

                <View className="px-4 py-2 w-full flex-row items-center justify-between">
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
                    <TouchableOpacity
                        activeOpacity={0.7}
                        className={`${messagez.image_url ? "bg-[#124BCC]" : "bg-gray-200"} opacity-80 rounded-full p-2 ml-2`}
                        onPress={pickImage}
                    >
                        <Entypo name="plus" size={24} color={messagez.image_url ? "white" : "gray"} />
                    </TouchableOpacity>
                    <TouchableOpacity
                        activeOpacity={0.7}
                        className={`${messagez.image_url !== "" || messagez.text !== "" ? "bg-[#124BCC]" : "bg-gray-200"} opacity-85 rounded-full p-2 ml-2`}
                        onPress={handleSendMessage}
                    >
                        <Entypo name="paper-plane" size={24} color={messagez.image_url !== "" || messagez.text !== "" ? "white" : "gray"} />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default Message