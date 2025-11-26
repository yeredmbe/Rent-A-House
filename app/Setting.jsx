import { changeLanguage } from '../Services/i18next';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const Setting = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const { t, i18n } = useTranslation();

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'fr', name: 'Français' }
  ];

  // Sync currentLanguage with i18n language on component mount and when language changes
  useEffect(() => {
    const currentLang = i18n.language;
    const languageName = languages.find(lang => lang.code === currentLang)?.name || 'English';
    setCurrentLanguage(languageName);
  }, [i18n.language]);

  const toggleLanguage = async (language) => {
    setCurrentLanguage(language.name);
    await changeLanguage(language.code);
    setModalVisible(false);
    console.log('Language changed to:', language.code);
  };

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="dark-content" backgroundColor="#f9fafb" />
      
      {/* Main Content */}
      <View className="flex-1 px-5 pt-16">
        <Text className="text-3xl font-bold text-gray-800 text-center mb-2">
          {t("App Settings")}
        </Text>
        <Text className="text-base text-gray-600 mb-10 text-center">
          {t("ManagePrefereces")}
        </Text>
        
        {/* Language Button */}
        <TouchableOpacity 
          className="bg-blue-500 px-6 py-4 rounded-xl mb-8 shadow-lg shadow-blue-500/30"
          onPress={() => setModalVisible(true)}
        >
          <Text className="text-white text-lg font-semibold text-center">
            🌐 {t("Language")}: {currentLanguage} ▼
          </Text>
        </TouchableOpacity>
        
        {/* Other Settings */}
        <View className="bg-white rounded-xl p-4 shadow shadow-black/5">
          <Text className="text-base font-semibold text-gray-600 mb-4">
            {t("Other Settings")}
          </Text>
          
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-base text-gray-800">{t("Notifications")}</Text>
            <Text className="text-lg text-gray-400">›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row justify-between items-center py-3 border-b border-gray-100">
            <Text className="text-base text-gray-800">{t("Theme")}</Text>
            <Text className="text-lg text-gray-400">›</Text>
          </TouchableOpacity>
          
          <TouchableOpacity className="flex-row justify-between items-center py-3">
            <Text className="text-base text-gray-800">{t("Privacy")}</Text>
            <Text className="text-lg text-gray-400">›</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Language Modal - Fixed 150px Height */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl w-full" style={{ height: 150 }}>
            {/* Modal Header */}
            <View className="flex-row justify-between items-center px-5 pt-4 pb-2 border-b border-gray-200">
              <Text className="text-lg font-bold text-gray-800">
                {t("Select Language")}
              </Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
              >
                <Text className="text-lg text-gray-500 font-bold">✕</Text>
              </TouchableOpacity>
            </View>
            
            {/* Languages List */}
            <ScrollView 
              className="flex-1 px-3 pt-2"
              showsVerticalScrollIndicator={false}
            >
              {languages.map((language) => (
                <TouchableOpacity
                  key={language.code}
                  className={`flex-row justify-between items-center py-2 px-3 rounded-lg mx-1 mb-1 ${
                    currentLanguage === language.name 
                      ? 'bg-blue-500' 
                      : 'bg-gray-100'
                  }`}
                  onPress={() => toggleLanguage(language)}
                >
                  <Text className={`text-sm font-medium ${
                    currentLanguage === language.name 
                      ? 'text-white font-semibold' 
                      : 'text-gray-800'
                  }`}>
                    {language.name}
                  </Text>
                  {currentLanguage === language.name && (
                    <Text className="text-white text-sm font-bold">✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Setting;