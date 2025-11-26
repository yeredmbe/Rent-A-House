import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, KeyboardAvoidingView, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showToast } from 'rn-snappy-toast';
import CustomButton from '../../components/CustomButton';
import InputField from '../../components/InputField';
import { useStore } from '../../Stores/authStore';



const SignIn = () => {
  const {login,isLoading,isAuthenticated,getUser,user} = useStore();
  const [formData,setFormData] = useState({
    email: '',
    password: ''
  })
  const router = useRouter();
    const { t } = useTranslation()
  
  const onhandlelogin = async () => {
    if(isLoading) return;
     if ( !formData.email || !formData.password) {
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
    await login(formData);

    setFormData({
      email: '',
      password: ''
    })
  } 
   
 useEffect(() => {
  (async () => {
    await getUser();
  })();
}, [getUser]);
 
   useEffect(() => {
  if (user) {
    router.replace("/Home");
  }
}, [user, router]);

   
    if(isAuthenticated){
      return(
  <View className="bg-white w-full h-full items-center justify-center"> 
        <ActivityIndicator size="large" color="#124BCC" animating={isAuthenticated} />
      <Text className="mt-2 ">{t("Loading")}</Text>
  </View>
      )}
  
  return (
     <SafeAreaView className="flex-1 bg-white">
     <KeyboardAvoidingView behavior="padding" className="h-full bg-white">
          <ScrollView className="h-full" showsVerticalScrollIndicator={false} contentContainerStyle={{justifyContent: 'center', alignItems: 'center'}} >
            <View className="h-28 android:h-20 mb-8"/>
             <View className='flex-1 flex items-center justify-center my-3 mx-5'>
            <View className="flex flex-col items-center justify-center">
                    <Text className="font-bold text-2xl">{t("WelcomeBack")}{" "}</Text>
                    <Text className="text-[#124BCC] my-3 font-bold text-5xl font-Churchillbold">Rent A House</Text>
                         <Text className="text-sm font-bold text-center font-Churchill">{t("LoginToContinue")}</Text>
                </View>
                </View>

           <View className='flex w-full items-center justify-center mt-3 px-5'>
          <InputField label={t("Email")} placeholder={t("emailPlaceHolder")}  styles={"mx-2 "} value={formData.email} onTextChange={(text)=>setFormData({...formData,email:text})}  />
          <InputField label={t("Password")} placeholder="********"  styles={"mx-2"} value={formData.password} onTextChange={(text)=>setFormData({...formData,password:text})}   />
  
                <View className="flex justify-center items-center pt-5 flex-row gap-2">
                          <Text className="text-lg text-black font-pregular">
                          {t("DontHaveAccount")}
                          </Text>
                           <TouchableOpacity
                           activeOpacity={0.8}
                           onPress={() => router.replace("/SignUp")}>
                          <Text className="text-lg font-semibold text-[#124BCC] my-1">{t("SignUp")}</Text> 
                         </TouchableOpacity>
                        </View>

                       <CustomButton title={t("Login")}
                         containerStyles="rounded-xl my-1 py-4"
                         handlePress={onhandlelogin}
                         isLoading={isLoading}
                        />  
                        </View>
                        
              </ScrollView>
                </KeyboardAvoidingView>
              </SafeAreaView>
          
  )
}

export default SignIn