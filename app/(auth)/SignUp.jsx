import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import BouncyCheckbox from "react-native-bouncy-checkbox";
import DropShadow from 'react-native-drop-shadow';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showToast } from 'rn-snappy-toast';
import CustomButton from '../../components/CustomButton';
import InputField from '../../components/InputField';
import icons from '../../constant/icons';
import { useStore } from '../../Stores/authStore';



Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

const getNotificationToken = async () => {
    if (!Device.isDevice) {
        alert("Must use physical device for Push Notifications");
        return null;
    }

    // Ask permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }

    if (finalStatus !== "granted") {
        alert("Permission not granted for push notifications!");
        return null;
    }

    // Get Expo push token
    const token = (await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId
    })).data;
    console.log("Expo push token:", token);
    return token;
}

const SignUp = () => {
    const { register, isLoading, isAuthenticated, getUser, user } = useStore();
    const [check, setCheck] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "client",
        ExpoPushToken: ""
    })
    const router = useRouter();


    const handleSubmit = async () => {
        if (isLoading) return;
        if (!check) {
            Alert.alert("Error", "Please agree to our terms and conditions")
            return;
        }
        if (!formData.name || !formData.email || !formData.password || !formData.role) {
            showToast({
                message: "All fields are required.",
                duration: 5000,
                type: 'error',
                position: 'top',
                title: 'Error',
                animationType: 'slideFromLeft',
                progressBar: true,
                richColors: true,
            })
            return;
        }
        const payload = { ...formData, ExpoPushToken: await getNotificationToken() }
        await register(payload);
        setFormData({
            name: "",
            email: "",
            password: "",
            role: "client",
            ExpoPushToken: ""
        })
    }

    useEffect(() => {
        (async () => {
            await getUser();
        })();
    }, []);


    useEffect(() => {
        if (user) {
            router.replace("/Home");
        }
    }, [user]);

    if (isAuthenticated) {
        return (
            <View className="bg-white w-full h-full items-center justify-center">
                <ActivityIndicator size="large" color="#124BCC" animating={isAuthenticated} />
                <Text className="mt-2 ">Loading...</Text>
            </View>
        )
    }
    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView behavior="padding" className="h-full bg-white">
                <ScrollView className="h-full" showsVerticalScrollIndicator={false} >
                    <View className="h-24 android:h-16" />
                    <View className="flex flex-col items-center justify-center">
                        <Text className="font-bold text-2xl">Welcome to{" "}</Text>
                        <Text className="text-[#124BCC] font-bold my-3 text-5xl font-Churchillbold">Rent A House</Text>
                        <Text className="text-sm font-bold text-center font-Churchill ">Create your account to proceed.</Text>
                    </View>
                    <View className="flex flex-row items-center justify-between  mt-5 px-5 mx-3">
                        <TouchableOpacity onPress={() => setFormData({ ...formData, role: "client" })} activeOpacity={0.7} className={`bg-white  rounded-lg shadow-sm ${formData.role === "client" ? "shadow-blue-800" : "shadow-gray-400"}`}>
                            {Platform.OS === "ios" ? <DropShadow
                                className="size-36 border-solid border-2p-5 
             items-center justify-center"
                                style={{
                                    shadowColor: formData.role === "client" ? "#124BCC" : "#000",
                                    shadowOffset: {
                                        width: 0,
                                        height: 0,
                                    },
                                    shadowOpacity: 1 - 0.4,
                                    shadowRadius: 5,
                                }}>
                                <Image source={icons.client} className="size-16 my-1" resizeMode='contain' tintColor={formData.role === "client" ? "#124BCC" : "#000"} />
                                <Text className={` ${formData.role === "client" ? "text-[#124BCC]" : "text-gray-400 my-1"} font-bold text-sm`}>Client</Text>
                            </DropShadow> : <View className="size-36 items-center justify-center">
                                <Image source={icons.client} className="size-16 my-1" resizeMode='contain' tintColor={formData.role === "client" ? "#124BCC" : "#000"} />
                                <Text className={` ${formData === "client" ? "text-[#124BCC]" : "text-gray-400 my-1"} font-bold text-sm`}>Client</Text>
                            </View>}
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setFormData({ ...formData, role: "landLord" })} activeOpacity={0.7} className={`bg-white rounded-lg shadow-sm ${formData.role === "landLord" ? "shadow-blue-800" : "shadow-gray-400"}`}>
                            {Platform.OS === "ios" ? <DropShadow
                                className="size-36 
              items-center justify-center"
                                style={{
                                    shadowColor: formData.role === "landLord" ? "#124BCC" : "#000",
                                    shadowOffset: {
                                        width: 0,
                                        height: 0,
                                    },
                                    shadowOpacity: 0.6,
                                    shadowRadius: 5,
                                }}>
                                <Image source={icons.lender} className="size-16 my-1" resizeMode='contain' tintColor={formData.role === "landLord" ? "#124BCC" : "#000"} />
                                <Text className={` ${formData.role === "landLord" ? "text-[#124BCC]" : "text-gray-400"} font-bold text-sm`}>Land-lord</Text>
                            </DropShadow> : <View className="size-36 items-center justify-center">
                                <Image source={icons.lender} className="size-16 my-1" resizeMode='contain' tintColor={formData.role === "landLord" ? "#124BCC" : "#000"} />
                                <Text className={` ${formData.role === "landLord" ? "text-[#124BCC]" : "text-gray-400"} font-bold text-sm`}>Land-lord</Text>
                            </View>}
                        </TouchableOpacity>
                    </View>
                    <View className='flex items-center justify-center mt-3 mx-5'>
                        <InputField label="Name" placeholder="Enter your name" styles={"mx-2 "} value={formData.name} onTextChange={(text) => setFormData({ ...formData, name: text })} />
                        <InputField label="Email" placeholder="Enter your email" styles={"mx-2 "} value={formData.email} onTextChange={(text) => setFormData({ ...formData, email: text })} />
                        <InputField label="Password" placeholder="********" styles={"mx-2"} value={formData.password} onTextChange={(text) => setFormData({ ...formData, password: text })} />
                        <View className="flex flex-row mt-2">
                            <BouncyCheckbox
                                size={15}
                                fillColor="#123BCC"
                                unfillColor="#FFFFFF"
                                text="Custom Checkbox"
                                iconStyle={{ borderColor: "#9ca3af" }}
                                innerIconStyle={{ borderWidth: 1 }}
                                disableText={true}
                                textStyle={{ fontFamily: "JosefinSans-Regular" }}
                                onPress={(
                                ) => { setCheck(!check) }}
                            />
                            <Text className={`text-sm ml-2 ${check ? "text-[#123BCC]" : "text-gray-400"}`}>agree to our terms and conditions before you proceed.</Text>
                        </View>
                        <View className="flex justify-center items-center pt-2 flex-row gap-2">
                            <Text className="text-lg text-black font-pregular">
                                Already have an account?
                            </Text>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={() => router.push("/SignIn")}

                            >
                                <Text className="text-lg font-semibold my-1 text-[#124BCC]">Login</Text>
                            </TouchableOpacity>
                        </View>
                        <CustomButton title="Sign Up"
                            containerStyles="rounded-xl my-1 py-4"
                            isLoading={isLoading}
                            handlePress={handleSubmit} // Example of navigation to a message screen
                        />
                    </View>


                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>


    )
}




export default SignUp