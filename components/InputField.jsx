import { Entypo } from '@expo/vector-icons';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

const InputField = ({label,value,onTextChange,styles,placeholder,name}) => {
    const [showPassword, setShowPassword] = useState(false);
  return (
    <View className={`w-full ${styles}`}>
      <Text className="my-2 font font-semibold">{label}</Text>
      <View className=" w-full border border-[#124BCC] rounded-xl h-16 px-4 flex flex-row items-center justify-between
      focus:border-[#124BCC]">
        <TextInput 
        value={value}
        keyboardType={label === "Email"?"email-address":(label==="Whatsapp" || label==="Facebook")?"url":"default"}
        onChangeText={onTextChange}
        placeholder={placeholder}
        placeholderTextColor={"gray"}
        multiline={label==="Description"?true:false}
        className="flex-1 text-black"
        secureTextEntry ={(label === "Password" || label ==="Mot de passe" ) && !showPassword ? true : false}
        />
        {label === "Password" || label ==="Mot de passe" && (
         <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
         {showPassword ? <Entypo name="eye" size={24} color="#124BCC" /> : <Entypo name="eye-with-line" size={24} color="#124BCC" />}
         </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

export default InputField