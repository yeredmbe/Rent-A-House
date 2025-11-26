
import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Localization from 'expo-localization'
import i18next from "i18next"
import { initReactI18next, } from "react-i18next"
import en from "../locales/en.json"
import fr from "../locales/fr.json"

const lngResource={
    en:{
        translation:en
    },
    fr:{
        translation:fr
    }
}

async function loadLanguage() {
  const savedLang = await AsyncStorage.getItem('appLanguage')
  return savedLang || Localization.getLocales()[0].languageCode || 'en'
}

export const initLanguage = async () => {
  const lng = await loadLanguage();

  await i18next.use(initReactI18next)
    .init({
      compatibilityJSON: 'v3',
      resources: lngResource,
      lng,
      fallbackLng: 'en',
      interpolation: { escapeValue: false },
    });

  return true;
};

export const changeLanguage = async (lang) => {
  await i18next.changeLanguage(lang)
  await AsyncStorage.setItem('appLanguage', lang)
}

export default i18next