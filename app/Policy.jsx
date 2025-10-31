import { router } from 'expo-router'
import { useEffect } from 'react'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { default as icon, default as icons } from '../constant/icons'
import image from '../constant/image'
import { useStore } from '../Stores/authStore'

const Policy = () => {
  const { user, getUser } = useStore();

  useEffect(() => {
    getUser();
  }, []);

  const data = [{
    icon: image.house,
    text: "Learn about rental terms,tenant responsibilities,and property management policies.",
    link: "/RentalTerms",
    title: "Rental Terms"
  }, {
    icon: image.compliant,
    text: "How we collect, store, and manage your personal data.",
    link: "/PrivacyPolicy",
    title: "Privacy Policy"
  }, {
    icon: image.creditCard,
    text: "Details on subscriptions, billing cycles and refunds",
    link: "/PaymentPolicy",
    title: "Payment Policy"
  }, {
    icon: icons.deleteCard,
    title: "Cancellation Policy",
    text: "Learn how to cancel your rental subscription and the penalties associated with it.",
    link: "/CancelationPolicy"
  }]
  return (
    <SafeAreaView className="h-screen bg-white">
      <View className='flex relative flex-row items-center justify-between p-4 mx-3'>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} className={`size-10 rounded-full ${user?.image_url ? "" : "bg-gray-200 "}items-center justify-center`}>
          <Image source={user?.image_url ? { uri: user?.image_url } : icon.userr} className={`${user?.image_url ? "size-10 rounded-full" : "size-6"}`} tintColor={user?.image_url ? "" : '#124BCC'} resizeMode='cover' />
        </TouchableOpacity>
        <Text className='text-xl font-bold text-[#124BCC]'>Privacy Policy</Text>
      </View>
      <ScrollView className="p-4">
        <Text className="text-3xl font-Churchillbold text-black text-center" >Terms & Policies</Text>
        <Text className="text-center text-[#124BCC] mb-6">Please read carefully before using our services.</Text>
        {data.map((item, index) => (
          <TouchableOpacity key={index} activeOpacity={0.7} className="flex-row items-center bg-white border border-gray-200 rounded-lg p-4 mb-4 shadow-sm shadow-blue-700">
            <Image source={item.icon} className="size-12 mr-4" resizeMode='contain' />
            <View className="flex-1">
              <Text className="text-lg font-semibold mb-1">{item.title}</Text>
              <Text className="text-gray-600">{item.text}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

export default Policy