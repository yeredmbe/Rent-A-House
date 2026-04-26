import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { showToast } from 'rn-snappy-toast';
// FIX: removed AsyncStorage import — no longer needed
// FIX: added useMutation from convex/react to call toggleFavorite directly
import { useMutation } from 'convex/react';
import icons from '../constant/icons';
import image from '../constant/image';
import { api } from '../convex/_generated/api';
import { useStore } from '../Stores/authStore';


const Cardd = ({ home_cover, address, category, _id }) => {
  const { user, updateFavorites } = useStore()
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  // FIX: use Convex mutation directly instead of the old REST fetch.
  // Convex will reactively update user.favorites everywhere in the app,
  // so the heart icon switches immediately without any extra state.
  const toggleFav = useMutation(api.homes.toggleFavorite);

  const addToFavorite = async (id) => {
    if (!user?._id) return;
    setIsLoading(true)
    try {
      const data = await toggleFav({ homeId: id, userId: user._id });
      setIsLoading(false)
      updateFavorites(id)
      showToast({
        message: data.action === 'added' ? 'Added to favorites' : 'Removed from favorites',
        duration: 5000,
        type: 'success',
        position: 'top',
        title: 'Success',
        animationType: 'slide',
        progressBar: true,
        richColors: true,
      })
    } catch (err) {
      setIsLoading(false)
      console.log(err.message)
    }
  }

  return (
    <View className="w-[135px] relative mx-1 my-1">
      <TouchableOpacity activeOpacity={0.7} className='flex w-[135px] relative mx-1 my-1' onPress={() => router.push(`/House/${_id}`)}>
        <Image source={loading ? image.load : { uri: home_cover }} className='w-[135px] h-44 rounded-lg ' resizeMethod='contain'
          onLoadEnd={() => setLoading(false)} />
      </TouchableOpacity>
      <View className="w-full flex-row justify-between absolute bottom-0 left-0 right-0 p-2 rounded-b-lg">
        <View>
          <Text className="text-white font-bold text-xl absolute bottom-10 ">{!loading && category}</Text>
          <Text className="text-white text-xs absolute bottom-7 ">{!loading && address.slice(0, 20)} {address.length > 20 ? "..." : ""}</Text>
        </View>

        <TouchableOpacity activeOpacity={0.7} className="size-5"
          onPress={() => {
            addToFavorite(_id)
            Haptics.notificationAsync(
              Haptics.NotificationFeedbackType.Success
            )
          }}>
          <Image source={!loading && user?.favorites?.includes(_id) ? icons.heart : icons.love} className="size-4 " tintColor={"#fff"} />
        </TouchableOpacity>
      </View>
    </View>
  )
}

export default Cardd