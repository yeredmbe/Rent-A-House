import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useState } from 'react';
import { Dimensions, Image, Text, TouchableOpacity, View } from 'react-native';
import { showToast } from 'rn-snappy-toast';
// FIX: removed AsyncStorage import — no longer needed
// FIX: added useMutation from convex/react to call toggleFavorite directly
import { useMutation } from 'convex/react';
import icons from '../constant/icons';
import image from '../constant/image';
import { api } from '../convex/_generated/api';
import { useStore } from '../Stores/authStore';


const Card = ({ home_cover, category, address, price, _id }) => {
  const [loading, setLoading] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const { user, updateFavorites } = useStore()

  const { width } = Dimensions.get('window');
  const cardWidth = (width - 48) / 2;

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

  function formatNumber(number) {
    const numStr = Number(number).toString();
    let integerPart = numStr;
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

  return (
    <View style={{ width: cardWidth, marginHorizontal: 8, marginVertical: 4 }}>
      <TouchableOpacity activeOpacity={0.7} onPress={() => router.push(`/House/${_id}`)}>
        <Image source={loading ? image.load : { uri: home_cover }} className='w-full h-64 rounded-lg relative' resizeMethod='contain'
          onLoadEnd={() => setLoading(false)} />
      </TouchableOpacity>
      <View className="flex flex-row justify-between items-center px-3">
        <View>
          <Text className="text-white font-bold text-xl absolute bottom-10 ">{!loading && category}</Text>
          <Text className="text-white text-xs absolute bottom-7 ">{!loading && address.slice(0, 27)} {address.length > 27 ? "..." : ""}</Text>
        </View>
        <View className="flex flex-row items-center justify-between w-full">
          <TouchableOpacity activeOpacity={0.7}
            onPress={() => {
              addToFavorite(_id)
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              )
            }}>
            <Image source={!loading && user?.favorites?.includes(_id) ? icons.heart : icons.love} className=" size-5" tintColor={"#124BCC"} />
          </TouchableOpacity>
          <Text className="text-black my-1 font-bold text-xl ">{!loading && formatNumber(price)} {!loading && "XAF"}</Text>
        </View>
      </View>
    </View>
  )
}

export default Card