import { Entypo } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Modal, RefreshControl, ScrollView, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { SafeAreaView } from 'react-native-safe-area-context'
import { showToast } from 'rn-snappy-toast'
import CustomButton from '../../components/CustomButton'
import InputField from '../../components/InputField'
import icons from '../../constant/icons'
import { useStore } from '../../Stores/authStore'


const Profile = () => {
  const [isOpen, setISOpen] = useState(false)
  const {user, getUser, logout, editProfile, isLoading, updateProfileImage, isProfilePicUploaded} = useStore()
  const [image_url, setImage] = useState(user?.image_url || null);
  const [isUserLoading, setIsUserLoading] = useState(true);

 

const pickImage = async () => {
  try {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
      base64: true,
    });

    if (result.canceled) return;

    if (result.assets[0].mimeType === "video/quicktime") {
      showToast({
              message: 'Only pictures are allowed',
              duration: 5000,
              type: 'warning',
              position: 'top',
              title: 'Warning',
              animationType: 'slideFromLeft',
              progressBar: true,
              richColors: true,
            })
      return;
    }

    if (!result.canceled) {
      const selectedImage = result.assets[0];
      
      // Create base64 string with proper format for Cloudinary
      const base64Image = `data:${selectedImage.mimeType};base64,${selectedImage.base64}`;
      
      setImage(base64Image);
      await updateProfileImage(base64Image);
      getUser();
      setISOpen(false);

    }
  } catch (error) {
    console.log("Error picking image:", error);
     showToast({
              message: 'Failed to pick image',
              duration: 5000,
              type: 'error',
              position: 'top',
              title: 'Error',
              animationType: 'slideFromLeft',
              progressBar: true,
              richColors: true,
            })
  }
};


  useEffect(() => {
    const fetchUser = async () => {
      setIsUserLoading(true);
      await getUser();
      setIsUserLoading(false);
    };
    
    fetchUser();
  }, [getUser]);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    location: user?.location || "",
    age: user?.age?.toString() || "", // Convert age to string if it's a number
  });

  const [isFocus, setIsFocus] = useState(false);
  const Region = [
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

  const handleLogout = async () => {
        Alert.alert("Logout", "Are you sure you want to logout?", [
          { text: "Cancel", style: "cancel" },
          {
            text: "Logout",
            style: "destructive",
            onPress:async () => {
              await logout();
             
            },
          },
        ]);
      };
    
  
  const onShare = async () => {
    try {
      const result = await Share.share({
        message: 'faurzanext.com',
      });
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert(error.message);
    }
  }; 
  
const handleEdit = async () => {
    const ageNumber = parseInt(formData.age);
    
    // Check if age is a valid number
   const  agePattern = /^(?:[1-9][0-9]?|1[01][0-9]|120)$/
    if (!agePattern.test(formData.age) || isNaN(ageNumber) || ageNumber <= 18 || ageNumber > 90 ) {
showToast({
              message: 'Please enter a valid age ',
              duration: 5000,
              type: 'warning',
              position: 'top',
              title: 'Invalid Age',
              animationType: 'slide',
              progressBar: true,
              richColors: true,
            })
            setISOpen(false);
        await getUser();
        return;
    }
    
    if (isLoading) return;
    
    try {
        await editProfile({
            name: formData.name,
            email: formData.email,
            age: ageNumber,
            location: formData.location
        });
        
        await getUser();
        console.log("Updated data:", {...formData, age: ageNumber});
        setISOpen(!isOpen);
        
    } catch (error) {
        console.error("Update failed:", error);
        // Error is already handled in the store function
    }
}
  
  const data = [
    {id:1, src:icons.love, title:"Favorite", link:"/Favorites"},
    {id:2, src:icons.security, title:"Setting", link:"/Setting"},
    // {id:3, src:icons.payment, title:"Payment", link:"/Payment"},
    // {id:4, src:icons.translate, title:"Language", link:"/Language"},
    {id:5, src:icons.help, title:"Help-Center", link:"/Help-Center"},
    {id:6, src:icons.policy, title:"Policies", link:"/Policy"},
  ];

  // Show loading indicator while user data is being fetched
  if (isUserLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#124BCC" />
        <Text className="text-sm text-gray-500 mt-2">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="h-screen bg-white android:mb-10">
    <ScrollView className=""
     refreshControl={
            <RefreshControl tintColor={"#124BCC"} refreshing={isLoading} onRefresh={getUser} />
          }
    >
      <View className="flex flex-row items-center justify-between px-4 mx-3"> 
        <TouchableOpacity activeOpacity={0.7} onPress={() => router.back()} className="size-10 rounded-full bg-gray-200 items-center justify-center">
          <Entypo name="chevron-left" size={30} color="#124BCC" />
        </TouchableOpacity>
        <Text className="text-2xl font-bold text-[#124BCC]  mx-5 my-5">Profile</Text>
      </View>
      
      <View className="w-full flex flex-col items-center justify-center relative">
        <View className={`flex size-48 rounded-full border-4 border-gray-400 items-center justify-center ${user?.image_url ? "" : "bg-gray-200"}`}>
          <Image 
            source={user?.image_url ? {uri: user.image_url} : icons.userr} 
            tintColor={user?.image_url ? "" : '#124BCC'} 
            className={`${user?.image_url ? "size-48 rounded-full" : "size-28"}`} 
            resizeMode="cover" 
          />
        </View>
        <TouchableOpacity activeOpacity={0.7} onPress={() => setISOpen(!isOpen)}>
          <View className="flex size-11 rounded-full items-center justify-center bg-[#124BCC] bottom-9 -right-12">
            <Image source={icons.edit} className="size-6" tintColor={"white"} />
          </View>
        </TouchableOpacity>
        <Text className="text-3xl font-bold">{user?.name || "User"}</Text>
        <Text className="text-sm text-gray-500">{user?.email || ""}</Text>
      </View>
      
      <View className="w-full px-2">
        {data.map((item) => (
          <TouchableOpacity activeOpacity={0.7} key={item.id} onPress={() => router.push(item.link)} className="flex flex-row items-center justify-between ml-3 mr-5 my-2">
            <View className="flex flex-row items-center w-48">
              <Image source={item.src} className="size-6 ml-5" tintColor={"#124BCC"} />
              <Text className="mx-3 font-semibold">{item.title}</Text>
            </View>
            <Entypo name="chevron-right" size={24} color="gray" />
          </TouchableOpacity>
        ))}
      </View>

      <View className="w-full mt-5 px-2">
         {user && user.role === "landLord" && (
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/Listing')} className="flex flex-row items-center justify-between ml-3 mr-5 my-2">
            <View className="flex flex-row items-center w-48">
              <Image source={icons.blog} className="size-6 ml-5" tintColor={"#124BCC"} />
              <Text className="mx-3 font-semibold">My Listings</Text>
            </View>
            <Entypo name="chevron-right" size={24} color="gray" />
          </TouchableOpacity>
        )}
        
        {user && user.role === "landLord" && (
          <TouchableOpacity activeOpacity={0.7} onPress={() => router.push('/Post')} className="flex flex-row items-center justify-between ml-3 mr-5 my-2">
            <View className="flex flex-row items-center w-48">
              <Image source={icons.add} className="size-6 ml-5" tintColor={"#124BCC"} />
              <Text className="mx-3 font-semibold">Create post</Text>
            </View>
            <Entypo name="chevron-right" size={24} color="gray" />
          </TouchableOpacity>
        )}
        
        <TouchableOpacity activeOpacity={0.7} onPress={onShare} className="flex flex-row items-center justify-between ml-3 mr-5 my-2">
          <View className="flex flex-row items-center w-48">
            <Image source={icons.invite} className="size-6 ml-5" tintColor={"#124BCC"} />
            <Text className="mx-3 font-semibold">Invite-Friend</Text>
          </View>
          <Entypo name="chevron-right" size={24} color="gray" />
        </TouchableOpacity>
        
        <TouchableOpacity activeOpacity={0.7} onPress={handleLogout} className="flex flex-row items-center justify-between ml-3 mr-5 mt-2 android:mb-10">
          <View className="flex flex-row items-center w-48">
            <Image source={icons.exit} className="size-6 ml-5" tintColor={"#dc2626"} />
            <Text className="mx-3 font-semibold text-red-600">Logout</Text>
          </View>
          <Entypo name="chevron-right" size={24} color="gray" />
        </TouchableOpacity>
      </View>
      
      <Modal
        visible={isOpen}
        onRequestClose={() => setISOpen(!isOpen)}
        animationType='slide'
        presentationStyle='pageSheet'
      >
        <KeyboardAvoidingView behavior="padding" className="h-full bg-white">
          <ScrollView className="h-full">
            <View className="my-2 p-3 w-full justify-end items-end">
              <TouchableOpacity activeOpacity={0.6} onPress={() => setISOpen(!isOpen)}>
                <Image source={icons.cancel} tintColor={"#123BCC"} className="size-7" />
              </TouchableOpacity>
            </View>

            <View className="w-full flex flex-col items-center justify-center relative">
              <View className={`relative z-0 flex size-48 rounded-full items-center justify-center ${user?.image_url || image_url ? "" : "bg-gray-200"}`}>
                <Image 
                  source={image_url ? {uri: image_url} : user?.image_url ? {uri: user.image_url} : icons.userr} 
                  tintColor={user?.image_url || image_url ? "" : '#124BCC'} 
                  className={`${user?.image_url || image_url ? "size-48 rounded-full" : "size-28"}`} 
                  resizeMode="cover" 
                />
             
              </View>
              <TouchableOpacity activeOpacity={0.7} onPress={pickImage}>
                <View className="flex size-11 rounded-full items-center justify-center bg-[#124BCC] bottom-9 -right-12">
                     {isProfilePicUploaded? <ActivityIndicator size="small" color="white" animating={isProfilePicUploaded} />:
                     <Image source={icons.camera} className="size-6" tintColor={"white"} />}
                </View>
              </TouchableOpacity>
            </View>
            
            
            <View className='flex items-center justify-center mt-3 mx-5'>
              <InputField 
                label="Name" 
                placeholder="JohnDoe" 
                value={formData.name} 
                onTextChange={(text) => setFormData({ ...formData, name: text })}  
                styles={"mx-2"}  
              />
              <InputField 
                label="Email" 
                placeholder="example@gmail.com" 
                value={formData.email} 
                onTextChange={(text) => setFormData({ ...formData, email: text })}  
                styles={"mx-2"}  
              />
              
              <View className="w-full mx-2">
                <Text className="text-black font-semibold text-md my-2">Region</Text>
                <Dropdown
                  style={[styles.dropdown, { borderColor: '#123BCC' }]}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  inputSearchStyle={styles.inputSearchStyle}
                  data={Region}
                  search
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder={!isFocus ? 'Select item' : '...'}
                  searchPlaceholder="Search..."
                  value={formData.location}
                  onFocus={() => setIsFocus(true)}
                  onBlur={() => setIsFocus(false)}
                  onChange={item => {
                    setFormData({ ...formData, location: item.value });
                    setIsFocus(false);
                  }}
                />
              </View>
              
              <InputField 
                label="Age" 
                placeholder="34" 
                value={formData.age} 
                onTextChange={(text) => setFormData({ ...formData, age: text })} 
                styles={"mx-2 mb-2"} 
                keyboardType="numeric"
              />
              
              <CustomButton 
                title="Update Profile"
                containerStyles="rounded-xl my-5 py-4"
                handlePress={handleEdit}
                isLoading={isLoading}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
      </ScrollView>
    </SafeAreaView>
  )
}

export default Profile

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
    marginTop: 3 
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
    color: "gray",
    paddingHorizontal: 7
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