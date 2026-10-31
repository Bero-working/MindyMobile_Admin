/* eslint-disable no-void */
import i18next from '@/translations';
import localStore from '@/services/storage/localStore.service';

import { SupportedLanguages } from './schema';

const changeLanguage = (lang: SupportedLanguages) => {
  localStore.setSystemLanguage(lang);
  void i18next.changeLanguage(lang);
};

const toggleLanguage = () => {
  changeLanguage(
    i18next.language === SupportedLanguages.EN
      ? SupportedLanguages.VI
      : SupportedLanguages.EN
  );
};

export const useI18n = () => {
  return { changeLanguage, toggleLanguage };
};
