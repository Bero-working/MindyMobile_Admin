import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import localStore from '@services/storage/localStore.service';
import en from './en';
import vi from './vi';

const storedLanguage = localStore.getSystemLanguage();

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, vi: { translation: vi } },
  supportedLngs: ['vi', 'en'],
  lng: storedLanguage === 'en' ? 'en' : 'vi',
  fallbackLng: 'vi',
  returnNull: false,
  returnEmptyString: false,
  interpolation: { escapeValue: false },
});

export default i18n;
