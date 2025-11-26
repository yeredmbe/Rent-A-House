import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import PhoneInput from 'react-native-international-phone-number';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showToast } from 'rn-snappy-toast';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import DropdownInput from "../components/SelectInput";
import icon from '../constant/icons';
import { useStore } from '../Stores/authStore';
import { homeStore } from '../Stores/homeStore';


const Post = () => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const { createHome} = homeStore();
  const [loading, setLoading] = useState(false);
  const { user, getUser } = useStore(); // Get token directly from useStore
  const { t } = useTranslation();
  
  useEffect(() => {
    getUser();
  }, [getUser]);
  
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    price: '',
    city: '',
    country: '',
    home_cover: '',
    address: '',
    details: [],
    whatsapp_url: '',
    facebook_url: '',
    region: '',
    telephone: "+237600000000",
  });

  const data = [
    { label: 'Bafoussam', value: 'Bafoussam' },
    { label: 'Douala', value: 'Douala' },
    { label: 'Bamenda', value: 'Bamenda' },
    { label: 'Buea', value: 'Buea' },
    { label: 'Yaounde', value: 'Yaounde' },
    { label: 'Garoua', value: 'Garoua' },
    { label: 'Maroua', value: 'Maroua' },
    { label: 'Ngaoundere', value: 'Ngaoundere' },
    { label: 'Adamawa', value: 'Adamawa' },
    { label: 'Bertoua', value: 'Bertoua' }
  ];

    const category =  [
    { label: t('House'), value: 'House' },
    { label: t('Apartment'), value: 'Apartment' },
    { label: t('Villa'), value: 'Villa' },
    { label: t('Office'), value: 'Office' },
    { label: t("Studio"), value: "Studio" },
    { label: t("Townhouse"), value: "Townhouse" },
    { label: t("Penthouse"), value: "Penthouse" },
    { label: t("Duplex"), value: "Duplex" },
    { label: t("Bungalow"), value: "Bungalow" },
    { label: t("Cottage"), value: "Cottage" },
    { label: t("Mansion"), value: "Mansion" },
    { label: t("Room"), value: "Room" },
    {label:t("Store"), Value:"Store"}
  ];

    const pickImageDetails = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        aspect: [4, 3],
        quality: 1, // Changed from 0 to 1 (highest quality)
        allowsMultipleSelection: true,
        selectionLimit: 10,
        base64: true, // Added base64: true to get base64 directly
      });
  
      if (result.canceled) return;
  
      // Check for videos in any selected assets
      const hasVideos = result.assets.some(asset => asset.mimeType === "video/quicktime");
      if (hasVideos) {
          showToast({
                  message: 'Only pictures are allowed',
                  duration: 5000,
                  type: 'error',
                  position: 'top',
                  title: 'Error',
                  animationType: 'slide',
                  progressBar: true,
                  richColors: true,
                })
        return;
      }
  
      if (!result.canceled) {
        // Process all selected images
        const base64Images = result.assets.map(asset => {
          // Create base64 string with proper format for Cloudinary
          return `data:${asset.mimeType};base64,${asset.base64}`;
        });
  
        setFormData({ ...formData, details: base64Images});
        
        // If you want to upload them immediately, you can do:
        // await uploadMultipleImages(base64Images);
      }
    } catch (error) {
      console.log("Error selecting images:", error);
       showToast({
                  message: 'Failed to select images',
                  duration: 5000,
                  type: 'warning',
                  position: 'top',
                  title: 'Warning',
                  animationType: 'slide',
                  progressBar: true,
                  richColors: true,
                })
    }
  };

  const removeDetailImage = (idx) => {
    setFormData({ ...formData, details: formData.details.filter((item, index) => index !== idx) });
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        aspect: [4, 3],
        quality: 1,
        base64: true, // Added base64: true to get base64 directly
      });
  
      if (result.canceled) return;
  
      // Check for video
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
                    })
        return;
      }
  
      if (!result.canceled) {
        const selectedImage = result.assets[0];
        
        // Create base64 string with proper format for Cloudinary
        const base64Image = `data:${selectedImage.mimeType};base64,${selectedImage.base64}`;
        
        if (base64Image) {
  
          setFormData({ ...formData, home_cover: base64Image });
        }
      }
    } catch (error) {
      console.log("Error picking image:", error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  
 const handlePost = async () => {
  // Validation
  if (!formData.category || !formData.description || !formData.price || 
      !formData.city || !formData.address || !formData.home_cover || 
      !formData.whatsapp_url || !formData.region || !formData.telephone) {
    showToast({
      message: 'Please fill all required fields',
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

  if (!formData.details || formData.details.length < 3) {
    showToast({
      message: 'Please add at least 3 detail images',
      duration: 5000,
      type: 'info',
      position: 'top',
      title: 'Info',
      animationType: 'slide',
      progressBar: true,
      richColors: true,
    });
    return;
  }

  if (parseFloat(formData.price) < 5000) {
    showToast({
      message: 'Price must be at least 5000',
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

  try {
    setLoading(true);
    await createHome(formData);
    
  } catch (error) {
    showToast({
      message: error.message || "Failed to create home",
      duration: 5000,
      type: 'error',
      position: 'top',
      title: 'Error',
      animationType: 'slide',
      progressBar: true,
      richColors: true,
    });
  } finally {
     setFormData({
      category: '',
      description: '',
      price: '',
      city: '',
      home_cover: '',
      address: '',
      details: [],
      whatsapp_url: '',
      facebook_url: '',
      region: '',
      telephone: '600000000'
    });
    setLoading(false);

  }
};



  return (
   <SafeAreaView className={`${loading ? "bg-gray-700/40" : "bg-white"} relative`}>
      <KeyboardAvoidingView behavior="padding" className="h-full bg-white">
       {loading && <View className="bg-gray-700/40 absolute z-10 top-0 left-0 h-full w-full flex items-center justify-center">
                  <ActivityIndicator size="large" color="#124BCC" />
                </View>} 
                <View className='flex relative flex-row items-center justify-between p-4 mx-3'>
                  <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} className={`size-10 rounded-full ${user?.image_url ? "" : "bg-gray-200 "}items-center justify-center`}>
                    <Image source={user?.image_url?{uri:user?.image_url} : icon.userr} className={`${user?.image_url ? "size-10 rounded-full" : "size-6"}`} tintColor={user?.image_url ? "" : '#124BCC'} resizeMode='cover' />
                  </TouchableOpacity>
                  <Text className='text-xl font-bold text-[#124BCC]'>{t("List Property")}</Text>
                </View>
        <ScrollView className=" h-full bg-gray-100">

          <View className='flex items-center justify-center mt-3 mx-5'>
            <InputField label={t("City")} placeholder={t("cityPlaceholder")} styles={"mx-2 "}
             value={formData.city} 
             onTextChange={(text) => setFormData({ ...formData, city: text })} />

            <InputField label={t("title")} placeholder={t("titlePlaceholder")} styles={"mx-2 "} 
             value={formData.address} 
             onTextChange={(text) => setFormData({ ...formData, address: text })} />

             <View className=" w-full mx-2">
                          <Text className="text-black font-semibold text-md my-2">{t("Category")}</Text>
                          <DropdownInput
                          style={"border border-[#124BCC] w-[100%] flex  rounded-lg p-4 mt-2"}
        data={category}
        onChange={(item) => setFormData({ ...formData, category: item.value })}
        placeholder={t("selectCategory")}
      />
                        </View>
                        

            <View>
              <Text className="text-black font-semibold text-md my-2">Telephone</Text>
             
                  <PhoneInput
        value={formData.telephone}
        onChangePhoneNumber={(inputValue)=>setFormData({...formData,telephone:inputValue})}
        selectedCountry={selectedCountry}
        onChangeSelectedCountry={((selectedCountry)=>setSelectedCountry(selectedCountry))}
        placeholder={t("Phone")}
        defaultValue="+23760000000"
        placeholderTextColor="gray"
      />
            </View>


              <View className="flex relative flex-col items-center justify-center mt-7 mb-3 w-full h-40 rounded-xl border border-[#123BCC]">
              {formData.home_cover ?
                <Image source={{ uri: formData.home_cover }} className="w-full h-full rounded-xl" /> :
                <TouchableOpacity onPress={pickImage} activeOpacity={0.7} className="flex flex-col items-center justify-center">
                  <Image source={icon.cloud} className="size-16 opacity-65" tintColor={"#124BCC"} />
                  <Text className="text-[#124BCC] font-semibold text-md mx-2">{t("imageCover")}</Text>
                </TouchableOpacity>}
              {formData.home_cover && <TouchableOpacity onPress={() => setFormData({ ...formData, home_cover: "" })} activeOpacity={0.7} className="absolute -top-1 -right-2">
                <Image source={icon.cancel} className="size-5" tintColor={"#4b5563"} />
              </TouchableOpacity>}
            </View>

            <InputField 
              label="Description" 
              placeholder={t("DiscribeHouse")}
              styles={"mx-2"} 
              value={formData.description} 
              onTextChange={(text) => setFormData({ ...formData, description: text })} 
              multiline={true}
              numberOfLines={4}
            />
  
          <View className=" w-full mx-2">
                       <Text className="text-black font-semibold text-md my-2">Region</Text>
                        <DropdownInput
                         style={"border border-[#124BCC] w-[100%] flex  rounded-lg p-4 mt-2"}
        data={data}
        value={formData.region}
        onChange={(item) => setFormData({ ...formData, region: item.label })}
        placeholder={t("SelectRegion")}
      />
                     </View>
                     
           <InputField label="Whatsapp"
            placeholder="https://wa.me/12334455" styles={"mx-2"} 
           value={formData.whatsapp_url} 
           onTextChange={(text) => setFormData({ ...formData, whatsapp_url: text })} />

            <InputField label="Facebook" 
            placeholder={t("Optional")} styles={"mx-2"} 
            value={formData.facebook_url}
             onTextChange={(text) => setFormData({ ...formData, facebook_url: text })} />

            
              <ScrollView 
  className="w-full h-40 rounded-xl border border-[#123BCC] p-4 mt-7 mb-3"
  contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
  horizontal
  showsHorizontalScrollIndicator={false}
>
  {formData.details && formData.details.length > 0 ? (
    formData.details.map((item, index) => (
      <View key={index} className="w-3/12 relative mx-1 h-full"> 
        <Image source={{ uri: item }} className="size-full rounded-xl" />
        <TouchableOpacity 
          onPress={() => removeDetailImage(index)} 
          activeOpacity={0.7} 
          className="size-5 absolute -top-1 right-1"
        >
          <Image 
            source={icon.cancel} 
            className="size-5 absolute -top-2 -right-2" 
            tintColor={"#4b5563"} 
          />
        </TouchableOpacity>
      </View>
    ))
  ) : (
    <TouchableOpacity 
      onPress={pickImageDetails} 
      activeOpacity={0.7} 
      className="flex flex-col items-center justify-center"
    >
      <Image source={icon.cloud} className="size-16 opacity-65" tintColor={"#124BCC"} />
      <Text className="text-[#124BCC] font-semibold text-md mx-2">{t("uploadDetails")}</Text>
    </TouchableOpacity>
  )}
</ScrollView>
             <InputField 
              label={t("Price")} 
              placeholder={t("enterPrice")} 
              keyBoardType="numeric" 
              styles={"mx-2"} 
              value={formData.price} 
              onTextChange={(text) => setFormData({ ...formData, price: text })} 
            />
            
            <CustomButton 
              title={t("uploadPost")}
              containerStyles="rounded-xl my-5 py-4 w-full"
              textStyles="text-white text-lg font-semibold"
              handlePress={handlePost}
              // isLoading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>

  )
}

export default Post


const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 16,
  },
  dropdown: {
    height: 50,
    width: '100%',
    borderColor: '#124BCC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginTop:3 
    
  },
  icon: {
    marginRight: 5,
  },
  label: {
    position: 'absolute',
    backgroundColor: 'white',
    left: 22,
    top: 8,
    zIndex: 99,
    paddingHorizontal: 8,
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 14,
    color:"gray",
    paddingHorizontal:7
  },
  selectedTextStyle: {
    fontSize: 14,
   
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
    color: '#124BCC',
  },
});