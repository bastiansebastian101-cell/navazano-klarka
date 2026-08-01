'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { cs } from '@/translations/cs';
import { en } from '@/translations/en';
import type { Translations } from '@/translations/cs';

export type Language = 'cs' | 'en';

interface LanguageContextType {
  language: Language;
  t: Translations;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('cs');

  useEffect(() => {
    const saved = localStorage.getItem('lang') as Language | null;
    if (saved === 'cs' || saved === 'en') setLanguageState(saved);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('lang', lang);
  };

  return (
    <LanguageContext.Provider value={{ language, t: language === 'cs' ? cs : en, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
