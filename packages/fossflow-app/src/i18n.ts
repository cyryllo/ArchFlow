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

// Tell the Electron main process the current language, so native dialogs
// (which have no access to i18next) can show text in the right language.
const applyLanguage = (lng: string) => {
  (window as any).electronAPI?.setLanguage?.(lng);
  // Page language for screen readers and hyphenation of long words
  document.documentElement.lang = lng;
};

i18n.on('languageChanged', applyLanguage);
i18n.on('initialized', () => {
  applyLanguage(i18n.language);
});

// Each language has app strings in src/i18n/<code>.json and editor strings
// in fossflow-lib/src/i18n/<code>.ts
export const supportedLanguages = [
  { label: 'English', value: 'en-US' },
  { label: 'Polski', value: 'pl-PL' },
  { label: 'Deutsch', value: 'de-DE' },
  { label: 'Français', value: 'fr-FR' },
  { label: 'Español', value: 'es-ES' },
  { label: 'Italiano', value: 'it-IT' },
  { label: 'Português (Brasil)', value: 'pt-BR' },
  { label: 'Čeština', value: 'cs-CZ' },
  { label: 'Nederlands', value: 'nl-NL' },
  { label: 'Українська', value: 'uk-UA' }
];

export default i18n;
