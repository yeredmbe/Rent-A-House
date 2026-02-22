import { Entypo } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { user, getUser, logout, editProfile, isLoading, updateProfileImage, isProfilePicUploaded, userProfile } = useStore()
  const [image_url, setImage] = useState(userProfile || user?.image_url || null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const { t } = useTranslation();

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
        const base64Image = `data:${selectedImage.mimeType};base64,${selectedImage.base64}`;
        setImage(base64Image);
        await updateProfileImage(base64Image);
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
  }, []);

  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    location: user?.location || "",
    age: user?.age?.toString() || "",
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
    Alert.alert(t("Logout"), t("Are you sure you want to logout?"), [
      { text: t("Cancel"), style: "cancel" },
      {
        text: t("Logout"),
        style: "destructive",
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const onShare = async () => {
    try {
      const result = await Share.share({ message: 'https://faurzanext.com' });
      if (result.action === Share.sharedAction) {
        // shared
      } else if (result.action === Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert(error.message);
    }
  };

  const handleEdit = async () => {
    const ageNumber = parseInt(formData.age);
    const agePattern = /^(?:[1-9][0-9]?|1[01][0-9]|120)$/

    if (!agePattern.test(formData.age) || isNaN(ageNumber) || ageNumber <= 18 || ageNumber > 90) {
      showToast({
        message: t("Please enter a valid age"),
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
      setISOpen(!isOpen);
    } catch (error) {
      console.error("Update failed:", error);
    }
  }

  const menuItems = [
    { id: 1, src: icons.love, title: t("Favorite"), link: "/Favorites" },
    { id: 2, src: icons.security, title: t("Settings"), link: "/Setting" },
    { id: 6, src: icons.policy, title: t("Policies"), link: "/Policy" },
  ];

  if (isUserLoading) {
    return (
      <SafeAreaView className="flex-1 bg-white justify-center items-center">
        <ActivityIndicator size="large" color="#124BCC" />
        <Text className="text-sm text-gray-500 mt-2">{t("Loading")}</Text>
      </SafeAreaView>
    );
  }

  const MenuItem = ({ src, title, link, onPress, danger }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress ?? (() => router.push(link))}
      className="flex-row items-center justify-between px-5 py-3 mx-2 rounded-2xl mb-1"
    >
      <View className="flex-row items-center gap-4">
        <View className="size-10 rounded-full bg-blue-50 items-center justify-center">
          <Image source={src} className="size-5" tintColor={danger ? "#dc2626" : "#124BCC"} />
        </View>
        <Text className={`font-semibold text-base ${danger ? "text-red-600" : "text-gray-800"}`}>{title}</Text>
      </View>
      <View className="size-8 rounded-full bg-gray-100 items-center justify-center">
        <Entypo name="chevron-right" size={18} color={danger ? "#dc2626" : "gray"} />
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 30 }}
        refreshControl={
          <RefreshControl tintColor="#124BCC" refreshing={isLoading} onRefresh={getUser} />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-5 py-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            className="size-10 rounded-full bg-gray-100 items-center justify-center"
          >
            <Entypo name="chevron-left" size={26} color="#124BCC" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#124BCC]">{t("Profile")}</Text>
          <View className="size-10" />
        </View>

        {/* Avatar */}
        <View className="items-center mt-2 mb-6">
          <View className="relative">
            <View className={`size-32 rounded-full border-4 border-blue-100 overflow-hidden items-center justify-center ${user?.image_url ? "" : "bg-gray-100"}`}>
              <Image
                source={user?.image_url ? { uri: user.image_url } : icons.userr}
                tintColor={user?.image_url ? undefined : '#124BCC'}
                className={user?.image_url ? "size-32" : "size-16"}
                resizeMode="cover"
              />
            </View>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setISOpen(!isOpen)}
              className="absolute bottom-0 right-0 size-9 rounded-full bg-[#124BCC] items-center justify-center border-2 border-white"
            >
              <Image source={icons.edit} className="size-4" tintColor="white" />
            </TouchableOpacity>
          </View>
          <Text className="text-2xl font-bold text-gray-800 mt-4">{user?.name || "User"}</Text>
          <Text className="text-sm text-gray-400 mt-1">{user?.email || ""}</Text>
          {user?.location && (
            <View className="flex-row items-center gap-1 mt-1">
              <Entypo name="location-pin" size={14} color="gray" />
              <Text className="text-sm text-gray-400">{user.location}</Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-100 mx-5 mb-4" />

        {/* Menu Items */}
        <View className="px-2">
          {menuItems.map((item) => (
            <MenuItem key={item.id} {...item} />
          ))}

          {user?.role === "landLord" && (
            <>
              <MenuItem src={icons.blog} title={t("myListings")} link="/Listing" />
              <MenuItem src={icons.add} title={t("createPost")} link="/Post" />
            </>
          )}

          <MenuItem src={icons.invite} title={t("Invite-Friend")} onPress={onShare} />

          {/* Divider before logout */}
          <View className="h-px bg-gray-100 mx-3 my-3" />

          <MenuItem src={icons.exit} title={t("Logout")} onPress={handleLogout} danger />
        </View>
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={isOpen}
        onRequestClose={() => setISOpen(!isOpen)}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <KeyboardAvoidingView behavior="padding" className="flex-1 bg-white">
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Modal Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-lg font-bold text-[#124BCC]">{t("updateProfile")}</Text>
              <TouchableOpacity activeOpacity={0.6} onPress={() => setISOpen(!isOpen)}>
                <Image source={icons.cancel} tintColor="#123BCC" className="size-6" />
              </TouchableOpacity>
            </View>

            {/* Avatar Picker */}
            <View className="items-center mt-6 mb-4">
              <View className="relative">
                <View className={`size-32 rounded-full border-4 border-blue-100 overflow-hidden items-center justify-center ${image_url || user?.image_url ? "" : "bg-gray-100"}`}>
                  <Image
                    source={image_url ? { uri: image_url } : user?.image_url ? { uri: user.image_url } : icons.userr}
                    tintColor={image_url || user?.image_url ? undefined : '#124BCC'}
                    className={image_url || user?.image_url ? "size-32" : "size-16"}
                    resizeMode="cover"
                  />
                </View>
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={pickImage}
                  className="absolute bottom-0 right-0 size-9 rounded-full bg-[#124BCC] items-center justify-center border-2 border-white"
                >
                  {isProfilePicUploaded
                    ? <ActivityIndicator size="small" color="white" />
                    : <Image source={icons.camera} className="size-4" tintColor="white" />
                  }
                </TouchableOpacity>
              </View>
              <Text className="text-sm text-gray-400 mt-3">{t("Tap to change photo")}</Text>
            </View>

            {/* Form */}
            <View className="px-5 gap-1">
              <InputField
                label={t("name")}
                placeholder="JohnDoe"
                value={formData.name}
                onTextChange={(text) => setFormData({ ...formData, name: text })}
                styles="mx-2"
              />
              <InputField
                label="Email"
                placeholder="example@gmail.com"
                value={formData.email}
                onTextChange={(text) => setFormData({ ...formData, email: text })}
                styles="mx-2"
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
                styles="mx-2 mb-2"
                keyboardType="numeric"
              />

              <CustomButton
                title={t("updateProfile")}
                containerStyles="rounded-xl mt-4 py-4"
                handlePress={handleEdit}
                isLoading={isLoading}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

export default Profile

const styles = StyleSheet.create({
  dropdown: {
    height: 50,
    width: '100%',
    borderColor: '#124BCC',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 8,
    marginTop: 3
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