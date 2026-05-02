import { createContext, useContext, useState, ReactNode } from "react";
import { Lang, t, TranslationKey } from "./translations";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "en",
  setLang: () => {},
  t: (key) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>(() => {
    const saved = localStorage.getItem("forskale_lang");
    return (saved as Lang) || "en";
  });

  const handleSetLang = (newLang: Lang) => {
    localStorage.setItem("forskale_lang", newLang);
    setLang(newLang);
  };

  const translate = (key: TranslationKey) => t(key, lang);

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t: translate }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
