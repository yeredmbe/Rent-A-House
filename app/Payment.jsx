import { router } from 'expo-router';
import { useEffect } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '../Stores/authStore';
import icon from '../constant/icons';

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
const Payment = () => {
  const { user, getUser } = useStore();

  useEffect(() => {
    getUser();
  }, []);

  const data = [{
    plan: user.role === "client" ? "8000" : "10000",
    time: "1month",
    features: [
      { name: "Feature 1", available: "this is 1 month" },
      { name: "Feature 2", available: "this is 1 month" },
      { name: "Feature 3", available: "this is 1 month" },
    ]
  }
    , {
    plan: user.role === "client" ? "12000" : "15000",
    time: "3months",
    features: [
      { name: "Feature 1", available: "this is 3 months" },
      { name: "Feature 2", available: "this is 3 months" },
      { name: "Feature 3", available: "this is 3 months" },
    ]
  },
  {
    plan: user.role === "client" ? "20000" : "25000",
    time: "6months",
    features: [
      { name: "Feature 1", available: "this is 6 months" },
      { name: "Feature 2", available: "this is 6 months" },
      { name: "Feature 3", available: "this is 6 months" },
    ]
  },
  {
    plan: user.role === "client" ? "35000" : "45000",
    time: "year",
    features: [
      { name: "Feature 1", available: "this is 1 year" },
      { name: "Feature 2", available: "this is 1 year" },
      { name: "Feature 3", available: "this is 1 year" },
    ]
  }]


    {/*show all of this balloons when isSubScribed of a user is true */}
  return (
    <SafeAreaView className="h-screen bg-white">
      <View className='flex relative flex-row items-center justify-between p-4 mx-3'>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} className={`size-10 rounded-full ${user?.image_url ? "" : "bg-gray-200 "} items-center justify-center`}>
          <Image source={user?.image_url ? { uri: user?.image_url } : icon.userr} className={`${user?.image_url ? "size-10 rounded-full" : "size-6"}`} tintColor={user?.image_url ? "" : '#124BCC'} resizeMode='cover' />
        </TouchableOpacity>
        <Text className='text-xl font-bold text-[#124BCC]'>My Plans</Text>
      </View>

      <View className="h-full relative">
        <ScrollView className="p-4 ">

          {data.map((plan, index) => (
            <View key={index} className="mb-6 p-4 border bg-white border-[#124BCC] rounded-lg shadow-sm shadow-blue-700">
              <View className="flex-row items-center justify-center">
                <View>
                  <Image source={require("../assets/images/house-preview.png")} className="size-48 " />
                </View>
                <View>
                  <Text className="text-3xl font-Churchillbold text-[#124BCC] ">RENT A HOUSE</Text>
                  <View className="flex-row items-baseline">
                    <Text className="text-3xl font-Churchillbold mb-2">{formatNumber(plan.plan)}XAF/</Text>
                    <Text className="text-lg font-Churchill mb-2">{plan.time}</Text>
                  </View>
                </View>

              </View>
              <View className="mr-5">
                <Text className="text-lg font-semibold mb-2">Features:</Text>
                {plan.features.map((feature, fIndex) => (
                  <View className="flex-row items-center my-1 px-4" key={fIndex}>
                    <Text className="font-Churchillbold mr-2">✓</Text>
                    <Text className="text-gray-700 text-md font-bold mr-2">{feature.name}:</Text>
                    <Text>{feature.available}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity className="bg-[#124BCC] rounded-lg p-4 mt-4 items-center"
                activeOpacity={0.8}>
                <Text className="text-white font-bold">Subscribe {plan.time === "year" ? "1 year" : plan.time === "3months" ? "3 months" : plan.time === "6 months" ? "6 months" : "1 month"}</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
        <Image source={require("../assets/icons/balloons2.png")} className="size-48 absolute top-1/3 left-1/2 -z-10 " resizeMode='contain' />
        <Image source={require("../assets/icons/baloon4.png")} className="size-32 absolute top-0 -left-2 " resizeMode='contain' />
        <Image source={require("../assets/icons/balloon.png")} className="size-16 absolute top-0 -right-2 " resizeMode='contain' />
        <Image source={require("../assets/icons/balloon1.png")} className="size-20 absolute top-2/3 -right-2 -z-10" resizeMode='contain' />
        <Image source={require("../assets/icons/balloons.png")} className="size-32 top-1/2 -left-5 absolute" resizeMode='contain' />
        <Image source={require("../assets/icons/balloon-hearts.png")} className="size-28 absolute bottom-0 left-0" resizeMode='contain' />
      </View>
    </SafeAreaView>
  )
}

export default Payment