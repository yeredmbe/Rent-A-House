import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native'

const CustomButton = ({ title, handlePress, containerStyles, isLoading }) => {
  return (
    <View className="w-full mx-2">
    <TouchableOpacity activeOpacity={0.7} onPress={handlePress} className={`w-full ${containerStyles} bg-[#124BCC] items-center justify-center`}>
      {isLoading ? <ActivityIndicator animating={isLoading} size="small" color="white" /> : <Text className="text-white font-bold text-lg">{title}</Text>}
    </TouchableOpacity>
    </View>
  )
}

export default CustomButton