import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import LanguageDetector from 'i18next-browser-languagedetector';

// Ensure PUBLIC_URL ends with slash for consistent path construction
const publicUrl = process.env.PUBLIC_URL || '';
const basePath = publicUrl ? (publicUrl.endsWith('/') ? publicUrl : publicUrl + '/') : '/';

i18n
  .use(Backend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en-US',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false
    },
    ns: ['app'],
    backend: {
      loadPath: `${basePath}i18n/{{ns}}/{{lng}}.json`
    },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage']
    }
  });

// Let the Electron main process know the current language, so native dialogs
// (which have no access to i18next) can show text in the right language.
const notifyElectronOfLanguage = (lng: string) => {
  (window as any).electronAPI?.setLanguage?.(lng);
};

i18n.on('languageChanged', notifyElectronOfLanguage);
i18n.on('initialized', () => {
  notifyElectronOfLanguage(i18n.language);
});

export const supportedLanguages = [
  {
    label: 'English',
    value: 'en-US'
  },
  {
    label: 'Polski',
    value: 'pl-PL'
  }
];

export default i18n;
