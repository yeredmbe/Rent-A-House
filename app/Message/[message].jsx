import { Entypo } from '@expo/vector-icons';
import { useMutation } from "convex/react";
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
import { api } from "../../convex/_generated/api";
import { useCachedQuery } from '../../hooks/useCachedQuery';
import uploadToCloudinary from '../lib/uploadToCloudinary';


const Message = () => {
    const [messagez, setMessage] = useState({
        text: '',
        image_url: ''
    });
    const { selectedUser, setSelectedUser } = messageStore()
    const { user } = useStore()
    const { message } = useLocalSearchParams()
    const scrollRef = useRef();
    const { t } = useTranslation()

    const messages = useCachedQuery(
        api.messages.getMessages,
        (user?._id && message) ? { userA: user._id, userB: message } : "skip",
        `cache_messages_${user?._id}_${message}`
    ) ?? [];

    const selectedUserFromServer = useCachedQuery(
        api.users.getById,
        message ? { userId: message } : "skip",
        `cache_user_${message}`
    );

    const activeSelectedUser = selectedUser?.role
        ? selectedUser
        : selectedUserFromServer
            ? {
                ...selectedUserFromServer,
                _id: selectedUserFromServer._id,
                name: selectedUserFromServer.name,
                role: selectedUserFromServer.role,
            }
            : selectedUser;

    const sendMessageMutation = useMutation(api.messages.sendMessage);

    // Auto-scroll whenever messages change
    useEffect(() => {
        setTimeout(() => {
            scrollRef?.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);


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
                });
                return;
            }

            const selectedImage = result.assets[0];
            const base64Image = `data:${selectedImage.mimeType};base64,${selectedImage.base64}`;
            if (base64Image) {
                setMessage({ ...messagez, image_url: base64Image });
            }
        } catch (error) {
            console.log("Error picking image:", error);
            Alert.alert('Error', 'Failed to pick image');
        }
    };


    const handleSendMessage = async () => {
        const hasText = messagez.text.trim().length > 0;
        const hasImage = messagez.image_url !== "";

        if (!hasText && !hasImage) return;

        const cleanMessage = {
            ...(messagez.text && { text: messagez.text }),
            ...(messagez.image_url && { image_url: messagez.image_url })
        };

        setMessage({ text: "", image_url: "" });

        let finalImageUrl = cleanMessage.image_url;

        try {
            if (finalImageUrl && finalImageUrl.startsWith("data:image")) {
                const uploadRes = await uploadToCloudinary(finalImageUrl);
                finalImageUrl = uploadRes.secure_url;
            }

            await sendMessageMutation({
                senderId: user._id,
                receiverId: message,
                text: cleanMessage.text,
                image_url: finalImageUrl
            });
        } catch (err) {
            console.error("Send message error:", err);
            showToast({
                message: 'Failed to send message',
                duration: 5000,
                type: 'error',
                position: 'top',
                title: 'Error',
                animationType: 'slide',
                progressBar: true,
                richColors: true,
            });
        }
    };


    const removeImage = () => {
        setMessage({ ...messagez, image_url: "" });
    };

    const getSenderName = (msg) => {
        if (msg.senderId._id === user._id) {
            return msg.senderId.name || "You";
        }
        return msg.senderId.name || "Unknown";
    };

    const formatTime = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDateDivider = (timestamp) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    // Group messages by date to show date dividers
    const groupedMessages = messages.reduce((acc, msg, index) => {
        const msgDate = new Date(msg._creationTime || msg.createdAt).toDateString();
        const prevMsg = messages[index - 1];
        const prevDate = prevMsg
            ? new Date(prevMsg._creationTime || prevMsg.createdAt).toDateString()
            : null;
        if (msgDate !== prevDate) {
            acc.push({ type: 'divider', date: msg._creationTime || msg.createdAt, id: `divider-${index}` });
        }
        acc.push({ ...msg, type: 'message' });
        return acc;
    }, []);

    const isMine = (msg) => msg.senderId?._id === user?._id;

    return (
        // ✅ FIX 1: added 'bottom' edge so input bar clears the home indicator on iPhone
        <SafeAreaView edges={['top', 'bottom']} className="flex-1 bg-white">

            {/* ✅ FIX 2: correct behavior per platform + proper vertical offset */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                className="flex-1 bg-white"
                keyboardVerticalOffset={Platform.OS === "ios" ? 95 : 0}
            >
                {/* Header */}
                <View
                    className="flex-row items-center px-4 py-3 bg-white border-b border-gray-100"
                    style={{
                        elevation: 2,
                        shadowColor: '#000',
                        shadowOpacity: 0.04,
                        shadowRadius: 4,
                        shadowOffset: { width: 0, height: 1 },
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => router.back()}
                        className="size-9 rounded-full bg-gray-100 items-center justify-center mr-3"
                    >
                        <Entypo name="chevron-left" size={24} color="#124BCC" />
                    </TouchableOpacity>

                    {/* Avatar + name */}
                    <View className="size-10 rounded-full bg-blue-100 items-center justify-center mr-3 overflow-hidden">
                        {activeSelectedUser?.image_url ? (
                            <Image
                                source={{ uri: activeSelectedUser.image_url }}
                                className="size-full"
                                resizeMode="cover"
                            />
                        ) : (
                            <Text className="text-[#124BCC] font-bold text-base">
                                {activeSelectedUser?.name?.charAt(0)?.toUpperCase() ?? '?'}
                            </Text>
                        )}
                    </View>

                    <View className="flex-1">
                        <Text className="text-base font-bold text-gray-800" numberOfLines={1}>
                            {activeSelectedUser?.name ?? t("Chats")}
                        </Text>
                        <Text className="text-xs text-[#124BCC]">
                            {activeSelectedUser?.role === "client"
                                ? "Client"
                                : activeSelectedUser?.role === "admin"
                                    ? "Admin"
                                    : activeSelectedUser?.role === "landLord"
                                        ? t("LandLord")
                                        : t("User")}
                        </Text>
                    </View>
                </View>

                {/* Messages */}
                <View className="flex-1" style={{ backgroundColor: '#e8ddd4' }}>
                    {/* background pattern */}
                    <View style={{ position: 'absolute', top: 8, left: 0, right: 0, bottom: 0, opacity: 0.18 }}>
                        {Array.from({ length: 60 }).map((_, i) => (
                            <View
                                key={i}
                                style={{
                                    position: 'absolute',
                                    top: Math.floor(i / 6) * 70 - 10,
                                    left: (i % 6) * 70 - 10,
                                    width: 52,
                                    height: 52,
                                    borderRadius: 26,
                                    borderWidth: 1.5,
                                    borderColor: '#124BCC',
                                    opacity: 0.25,
                                }}
                            />
                        ))}
                    </View>

                    {/* ✅ FIX 3: removed onLayout scrollToEnd — only keep onContentSizeChange */}
                    <ScrollView
                        className="flex-1 px-3"
                        ref={scrollRef}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                        onContentSizeChange={() => scrollRef?.current?.scrollToEnd({ animated: true })}
                        contentContainerStyle={{ paddingVertical: 12 }}
                    >
                        {groupedMessages.map((item) => {
                            if (item.type === 'divider') {
                                return (
                                    <View key={item.id} className="flex-row items-center my-3 px-2">
                                        <View className="flex-1 h-px bg-gray-200" />
                                        <Text className="text-xs text-gray-400 mx-3 font-medium">
                                            {formatDateDivider(item.date)}
                                        </Text>
                                        <View className="flex-1 h-px bg-gray-200" />
                                    </View>
                                );
                            }

                            const mine = isMine(item);

                            return (
                                <View
                                    key={item._id}
                                    className={`mb-2 flex-row items-end ${mine ? 'justify-end' : 'justify-start'}`}
                                >
                                    {/* Avatar for receiver messages */}
                                    {!mine && (
                                        <View className="size-7 rounded-full bg-blue-100 items-center justify-center mr-2 mb-1 overflow-hidden shrink-0">
                                            {selectedUser?.image_url ? (
                                                <Image
                                                    source={{ uri: selectedUser.image_url }}
                                                    className="size-full"
                                                    resizeMode="cover"
                                                />
                                            ) : (
                                                <Text className="text-[#124BCC] font-bold text-xs">
                                                    {getSenderName(item)?.charAt(0)?.toUpperCase() ?? '?'}
                                                </Text>
                                            )}
                                        </View>
                                    )}

                                    <View className={`max-w-[72%] ${mine ? 'items-end' : 'items-start'}`}>
                                        {/* Sender name — only for receiver */}
                                        {!mine && (
                                            <Text className="text-xs text-gray-400 mb-1 ml-1 font-medium">
                                                {getSenderName(item)}
                                            </Text>
                                        )}

                                        {/* Bubble */}
                                        <View
                                            className={`px-4 py-2 ${mine
                                                ? 'bg-[#1e263a] rounded-t-2xl rounded-bl-2xl rounded-br-sm'
                                                : 'bg-white rounded-t-2xl rounded-br-2xl rounded-bl-sm'
                                                }`}
                                            style={{
                                                elevation: 1,
                                                shadowColor: '#000',
                                                shadowOpacity: 0.06,
                                                shadowRadius: 3,
                                                shadowOffset: { width: 0, height: 1 },
                                            }}
                                        >
                                            {item.image_url && (
                                                <Image
                                                    source={{ uri: item.image_url }}
                                                    className="w-48 h-40 rounded-xl my-1"
                                                    resizeMode="cover"
                                                />
                                            )}
                                            {item.text && (
                                                <Text className={`text-sm leading-5 ${mine ? 'text-white' : 'text-gray-800'}`}>
                                                    {item.text}
                                                </Text>
                                            )}
                                        </View>

                                        {/* Timestamp */}
                                        <Text className="text-xs text-gray-400 mt-1 mx-1">
                                            {formatTime(item._creationTime || item.createdAt)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}

                        {/* Image preview before sending */}
                        {messagez.image_url !== "" && (
                            <View className="mb-2 flex-row justify-end">
                                <View className="relative">
                                    <Image
                                        source={{ uri: messagez.image_url }}
                                        className="w-48 h-40 rounded-2xl"
                                        resizeMode="cover"
                                    />
                                    <TouchableOpacity
                                        onPress={removeImage}
                                        activeOpacity={0.7}
                                        className="absolute -top-2 -right-2 bg-white rounded-full p-0.5"
                                        style={{ elevation: 2 }}
                                    >
                                        <Image source={icon.cancel} className="size-5" tintColor="#4b5563" />
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}
                    </ScrollView>
                </View>

                {/* Input bar */}
                <View
                    className="px-3 py-2 mb-3 bg-white border-t border-gray-100 flex-row items-end"
                    style={{
                        elevation: 4,
                        shadowColor: '#000',
                        shadowOpacity: 0.04,
                        shadowRadius: 6,
                        shadowOffset: { width: 0, height: -1 },
                    }}
                >
                    <TouchableOpacity
                        activeOpacity={0.7}
                        className={`${messagez.image_url ? "bg-[#124BCC]" : "bg-gray-100"} rounded-full p-2 mr-2 mb-1`}
                        onPress={pickImage}
                    >
                        <Entypo
                            name="camera"
                            size={20}
                            color={messagez.image_url ? "white" : "#6b7280"}
                        />
                    </TouchableOpacity>

                    <View className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 mr-2 flex-row items-end">
                        <TextInput
                            placeholder={t("Enter your message")}
                            multiline={true}
                            placeholderTextColor="#9ca3af"
                            className="flex-1 text-gray-800 text-sm"
                            style={{ maxHeight: 100, minHeight: 20 }}
                            value={messagez.text}
                            numberOfLines={4}
                            onChangeText={(e) => setMessage({ ...messagez, text: e })}
                        />
                    </View>

                    <TouchableOpacity
                        activeOpacity={0.7}
                        className={`${messagez.image_url !== "" || messagez.text !== "" ? "bg-[#124BCC]" : "bg-gray-200"} rounded-full p-3 mb-1`}
                        onPress={handleSendMessage}
                    >
                        <Entypo
                            name="paper-plane"
                            size={18}
                            color={messagez.image_url !== "" || messagez.text !== "" ? "white" : "#9ca3af"}
                        />
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

export default Message;