import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import PhoneInput from 'react-native-international-phone-number';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showToast } from 'rn-snappy-toast';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import DropdownInput from '../components/SelectInput';
import icon from '../constant/icons';
import { useStore } from '../Stores/authStore';
import { homeStore } from '../Stores/homeStore';
import uploadToCloudinary from './lib/uploadToCloudinary';

const Post = () => {
  const [selectedCountry, setSelectedCountry] = useState(null);
  const { createHome, isLoading } = homeStore();
  const [loading, setLoading] = useState(false);
  const { user } = useStore();
  const { t } = useTranslation();

  const [formData, setFormData] = useState({
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
    telephone: '+237600000000',
  });

  const regionData = [
    { label: 'Bafoussam', value: 'Bafoussam' },
    { label: 'Douala', value: 'Douala' },
    { label: 'Bamenda', value: 'Bamenda' },
    { label: 'Buea', value: 'Buea' },
    { label: 'Yaounde', value: 'Yaounde' },
    { label: 'Garoua', value: 'Garoua' },
    { label: 'Maroua', value: 'Maroua' },
    { label: 'Ngaoundere', value: 'Ngaoundere' },
    { label: 'Adamawa', value: 'Adamawa' },
    { label: 'Bertoua', value: 'Bertoua' },
  ];

  const categoryData = [
    { label: t('House'), value: 'House' },
    { label: t('Apartment'), value: 'Apartment' },
    { label: t('Villa'), value: 'Villa' },
    { label: t('Office'), value: 'Office' },
    { label: t('Studio'), value: 'Studio' },
    { label: t('Townhouse'), value: 'Townhouse' },
    { label: t('Penthouse'), value: 'Penthouse' },
    { label: t('Duplex'), value: 'Duplex' },
    { label: t('Bungalow'), value: 'Bungalow' },
    { label: t('Cottage'), value: 'Cottage' },
    { label: t('Mansion'), value: 'Mansion' },
    { label: t('Room'), value: 'Room' },
    { label: t('Store'), value: 'Store' },
  ];

  // ── Image pickers ────────────────────────────────────────────────────────────
  const pickImageDetails = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        aspect: [4, 3],
        quality: 1,
        allowsMultipleSelection: true,
        selectionLimit: 10,
        base64: true,
      });
      if (result.canceled) return;

      const hasVideos = result.assets.some((a) => a.mimeType === 'video/quicktime');
      if (hasVideos) {
        showToast({ message: 'Only pictures are allowed', type: 'error', duration: 5000, position: 'top', title: 'Error' });
        return;
      }

      const base64Images = result.assets.map(
        (asset) => `data:${asset.mimeType};base64,${asset.base64}`
      );
      setFormData((prev) => ({ ...prev, details: base64Images }));
    } catch {
      showToast({ message: 'Failed to select images', type: 'warning', duration: 5000, position: 'top', title: 'Warning' });
    }
  };

  const removeDetailImage = (idx) => {
    setFormData((prev) => ({
      ...prev,
      details: prev.details.filter((_, i) => i !== idx),
    }));
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        aspect: [4, 3],
        quality: 1,
        base64: true,
      });
      if (result.canceled) return;
      if (result.assets[0].mimeType === 'video/quicktime') {
        showToast({ message: 'Only pictures are allowed', type: 'warning', duration: 5000, position: 'top', title: 'Warning' });
        return;
      }
      const base64Image = `data:${result.assets[0].mimeType};base64,${result.assets[0].base64}`;
      setFormData((prev) => ({ ...prev, home_cover: base64Image }));
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  // ── Submit ───────────────────────────────────────────────────────────────────
  const handlePost = async () => {
    if (!user?._id) {
      showToast({ message: 'You must be logged in to post', type: 'error', duration: 4000, position: 'top', title: 'Error' });
      return;
    }

    if (
      !formData.category || !formData.description || !formData.price ||
      !formData.city || !formData.address || !formData.home_cover ||
      !formData.whatsapp_url || !formData.region || !formData.telephone || formData.telephone ==="+237600000000"
    ) {
      showToast({ message: 'Please fill all required fields', type: 'warning', duration: 5000, position: 'top', title: 'Warning' });
      return;
    }

    if (!formData.details || formData.details.length < 3) {
      showToast({ message: 'Please add at least 3 detail images', type: 'info', duration: 5000, position: 'top', title: 'Info' });
      return;
    }

    if (parseFloat(formData.price) <= 5000) {
      showToast({ message: 'Price must be greater than 5000', type: 'warning', duration: 5000, position: 'top', title: 'Warning' });
      return;
    }

    try {
      setLoading(true);

      // Upload cover image
      let uploadedCover = formData.home_cover;
      if (uploadedCover.startsWith('data:image')) {
        const coverRes = await uploadToCloudinary(uploadedCover);
        uploadedCover = coverRes.secure_url;
      }

      // Upload detail images
      const uploadedDetails = await Promise.all(
        formData.details.map(async (img) => {
          if (img.startsWith('data:image')) {
            const res = await uploadToCloudinary(img);
            return res.secure_url;
          }
          return img;
        })
      );

      // Pass userId as first arg, form fields as second — keeps them separate
      await createHome(user._id, {
        address: formData.address,
        description: formData.description,
        city: formData.city,
        telephone: formData.telephone,
        category: formData.category,
        price: formData.price,
        home_cover: uploadedCover,
        whatsapp_url: formData.whatsapp_url,
        facebook_url: formData.facebook_url || undefined,
        region: formData.region,
        details: uploadedDetails,
      });

      // Reset form on success
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
        telephone: '+237600000000',
      });
    } catch (error) {
      showToast({
        message: error?.message ?? 'Failed to create home',
        type: 'error',
        duration: 5000,
        position: 'top',
        title: 'Error',
      });
    } finally {
      setLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView className={`${loading ? 'bg-gray-700/40' : 'bg-white'} relative`}>
      <KeyboardAvoidingView behavior="padding" className="h-full bg-white">
        {loading && (
          <View className="bg-gray-700/40 absolute z-10 top-0 left-0 h-full w-full flex items-center justify-center">
            <ActivityIndicator size="large" color="#124BCC" />
          </View>
        )}

        <View className="flex relative flex-row items-center justify-between p-4 mx-3">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.back()}
            className={`size-10 rounded-full ${user?.image_url ? '' : 'bg-gray-200'} items-center justify-center`}
          >
            <Image
              source={user?.image_url ? { uri: user.image_url } : icon.userr}
              className={`${user?.image_url ? 'size-10 rounded-full' : 'size-6'}`}
              tintColor={user?.image_url ? '' : '#124BCC'}
              resizeMode="cover"
            />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-[#124BCC]">{t('List Property')}</Text>
        </View>

        <ScrollView className="h-full bg-gray-100">
          <View className="flex items-center justify-center mt-3 mx-5">

            <InputField
              label={t('City')}
              placeholder={t('cityPlaceholder')}
              styles="mx-2"
              value={formData.city}
              onTextChange={(text) => setFormData((p) => ({ ...p, city: text }))}
            />

            <InputField
              label={t('title')}
              placeholder={t('titlePlaceholder')}
              styles="mx-2"
              value={formData.address}
              onTextChange={(text) => setFormData((p) => ({ ...p, address: text }))}
            />

            <View className="w-full mx-2">
              <Text className="text-black font-semibold text-md my-2">{t('Category')}</Text>
              <DropdownInput
                style="border border-[#124BCC] w-[100%] flex rounded-lg p-4 mt-2"
                data={categoryData}
                onChange={(item) => setFormData((p) => ({ ...p, category: item.value }))}
                placeholder={t('selectCategory')}
              />
            </View>

            <View>
              <Text className="text-black font-semibold text-md my-2">Telephone</Text>
              <PhoneInput
                value={formData.telephone}
                onChangePhoneNumber={(val) => setFormData((p) => ({ ...p, telephone: val }))}
                selectedCountry={selectedCountry}
                onChangeSelectedCountry={(c) => setSelectedCountry(c)}
                placeholder={t('Phone')}
                defaultValue="+23760000000"
                placeholderTextColor="gray"
              />
            </View>

            {/* Cover image */}
            <View className="flex relative flex-col items-center justify-center mt-7 mb-3 w-full h-40 rounded-xl border border-[#123BCC]">
              {formData.home_cover ? (
                <Image source={{ uri: formData.home_cover }} className="w-full h-full rounded-xl" />
              ) : (
                <TouchableOpacity onPress={pickImage} activeOpacity={0.7} className="flex flex-col items-center justify-center">
                  <Image source={icon.cloud} className="size-16 opacity-65" tintColor="#124BCC" />
                  <Text className="text-[#124BCC] font-semibold text-md mx-2">{t('imageCover')}</Text>
                </TouchableOpacity>
              )}
              {formData.home_cover && (
                <TouchableOpacity
                  onPress={() => setFormData((p) => ({ ...p, home_cover: '' }))}
                  activeOpacity={0.7}
                  className="absolute -top-1 -right-2"
                >
                  <Image source={icon.cancel} className="size-5" tintColor="#4b5563" />
                </TouchableOpacity>
              )}
            </View>

            <InputField
              label="Description"
              placeholder={t('DiscribeHouse')}
              styles="mx-2"
              value={formData.description}
              onTextChange={(text) => setFormData((p) => ({ ...p, description: text }))}
              multiline={true}
              numberOfLines={4}
            />

            <View className="w-full mx-2">
              <Text className="text-black font-semibold text-md my-2">Region</Text>
              <DropdownInput
                style="border border-[#124BCC] w-[100%] flex rounded-lg p-4 mt-2"
                data={regionData}
                value={formData.region}
                onChange={(item) => setFormData((p) => ({ ...p, region: item.value }))}
                placeholder={t('SelectRegion')}
              />
            </View>

            <InputField
              label="Whatsapp"
              placeholder="https://wa.me/12334455"
              styles="mx-2"
              value={formData.whatsapp_url}
              onTextChange={(text) => setFormData((p) => ({ ...p, whatsapp_url: text }))}
            />

            <InputField
              label="Facebook"
              placeholder={t('Optional')}
              styles="mx-2"
              value={formData.facebook_url}
              onTextChange={(text) => setFormData((p) => ({ ...p, facebook_url: text }))}
            />

            {/* Detail images */}
            <ScrollView
              className="w-full h-40 rounded-xl border border-[#123BCC] p-4 mt-7 mb-3"
              contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center' }}
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              {formData.details.length > 0 ? (
                formData.details.map((item, index) => (
                  <View key={index} className="w-3/12 relative mx-1 h-full">
                    <Image source={{ uri: item }} className="size-full rounded-xl" />
                    <TouchableOpacity
                      onPress={() => removeDetailImage(index)}
                      activeOpacity={0.7}
                      className="size-5 absolute -top-1 right-1"
                    >
                      <Image source={icon.cancel} className="size-5 absolute -top-2 -right-2" tintColor="#4b5563" />
                    </TouchableOpacity>
                  </View>
                ))
              ) : (
                <TouchableOpacity onPress={pickImageDetails} activeOpacity={0.7} className="flex flex-col items-center justify-center">
                  <Image source={icon.cloud} className="size-16 opacity-65" tintColor="#124BCC" />
                  <Text className="text-[#124BCC] font-semibold text-md mx-2">{t('uploadDetails')}</Text>
                </TouchableOpacity>
              )}
            </ScrollView>

            <InputField
              label={t('Price')}
              placeholder={t('enterPrice')}
              keyBoardType="numeric"
              styles="mx-2"
              value={formData.price}
              onTextChange={(text) => setFormData((p) => ({ ...p, price: text }))}
            />

            <CustomButton
              title={t('uploadPost')}
              containerStyles="rounded-xl my-5 py-4 w-full"
              textStyles="text-white text-lg font-semibold"
              handlePress={handlePost}
              isLoading={loading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Post;