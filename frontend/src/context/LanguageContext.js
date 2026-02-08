import { createContext, useContext, useState, useCallback } from 'react';
import { translations } from '../lib/i18n';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try { return localStorage.getItem('receipty-lang') || 'fr'; }
    catch { return 'fr'; }
  });

  const toggleLang = useCallback(() => {
    const newLang = lang === 'fr' ? 'en' : 'fr';
    setLang(newLang);
    try { localStorage.setItem('receipty-lang', newLang); } catch {}
  }, [lang]);

  const t = translations[lang];

  return (
    <LanguageContext.Provider value={{ lang, setLang, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
