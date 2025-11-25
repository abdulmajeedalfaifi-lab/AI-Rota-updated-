import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { LanguageCode, Translation } from '../types';
import { TRANSLATIONS } from '../constants';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize from LocalStorage if available, default to 'en'
  const [language, setLanguage] = useState<LanguageCode>(() => {
    const saved = localStorage.getItem('aiRota_lang');
    return (saved as LanguageCode) || 'en';
  });

  const isRTL = language === 'ar';

  useEffect(() => {
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
    localStorage.setItem('aiRota_lang', language);
  }, [language, isRTL]);

  const t = (key: string): string => {
    const entry = TRANSLATIONS[key];
    if (!entry) return key;
    return entry[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};