import { createContext, useContext, useState } from 'react';
import fr from './fr';
import en from './en';

const translations = { fr, en };
const I18nContext = createContext();

export function I18nProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('app_lang') || 'fr');

  const t = (keyPath) => {
    const keys = keyPath.split('.');
    const result = keys.reduce((obj, key) => obj?.[key], translations[lang]);
    if (result === undefined) {
      console.warn(`[i18n] Missing key: "${keyPath}" for lang "${lang}"`);
      return keyPath;
    }
    return result;
  };

  const switchLang = (newLang) => {
    if (translations[newLang]) {
      setLang(newLang);
      localStorage.setItem('app_lang', newLang);
    }
  };

  return (
    <I18nContext.Provider value={{ t, lang, switchLang, language: lang, setLanguage: switchLang }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useTranslation = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used inside <I18nProvider>');
  return ctx;
};
