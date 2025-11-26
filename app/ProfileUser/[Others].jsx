import { Entypo } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useStore } from '../../Stores/authStore'
import icons from '../../constant/icons'


const Others = () => {
  const { isLoadProfile, userProfile, getUserProfile } = useStore()
  const { Others } = useLocalSearchParams()
  const { t } = useTranslation()

  const fetchUserProfile = async () => {
    try {
      await getUserProfile(Others)
    } catch (error) {
      console.log(error)
    }
  }
  useEffect(() => {
    fetchUserProfile()
  }, [])


  return (
    <SafeAreaView className="h-screen bg-white">
      <View className='flex flex-row items-center justify-between p-4 mx-3'>
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} className="size-10 rounded-full bg-gray-200 items-center justify-center">
          <Entypo name="chevron-left" size={30} color="#124BCC" />
        </TouchableOpacity>
        <Text className='text-2xl font-bold text-[#124BCC]'>{t("ProfileOverview")}</Text>
      </View>
      <ScrollView>
        <View className="w-full flex flex-col items-center justify-center relative">
          <View className={`flex size-48 rounded-full items-center justify-center my-5 ${userProfile?.image_url ? "" : "bg-gray-200"} border-4 border-gray-400`}>
            <Image
              source={userProfile?.image_url ? { uri: userProfile.image_url } : icons.userr}
              tintColor={userProfile?.image_url ? "" : '#124BCC'}
              className={`${userProfile?.image_url ? "size-48 rounded-full" : "size-28"} `}
              resizeMode="cover"
            />
          </View>
          <Text className="text-3xl font-bold">{userProfile?.name}</Text>
          <Text className="text-sm text-gray-500">{userProfile?.email || ""}</Text>
        </View>
        <View className="w-full py-6 px-8">
          <View className="flex flex-row mt-1 items-center justify-start">
            <Text className=" font-bold text-[#124BCC]">Region:</Text>
            <Text className="ml-2">{userProfile?.location}</Text>
          </View>
          <View className="flex flex-row mt-1  items-center justify-start">
            <Text className="font-bold text-[#124BCC]">Age:</Text>
            <Text className="ml-2">{userProfile?.age}</Text>
          </View>
          <View className="flex flex-row mt-1  items-center justify-start">
            <Text className=" font-bold text-[#124BCC]">{t("User type")}:</Text>
            <Text className="ml-2">{userProfile?.role === "landLord" ? t("LandLord") : "Client"}</Text>
          </View>

          <View className=" mt-3  items-center justify-start w-full">
            <Image source={icons.biometric} className="size-72 opacity-45 self-center" resizeMode='contain' />
          </View>
          <Text className="mt-4 text-center font-Churchill text-md text-black">{t("Sorry we intern to keep our user's data private!")}</Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

export default Others