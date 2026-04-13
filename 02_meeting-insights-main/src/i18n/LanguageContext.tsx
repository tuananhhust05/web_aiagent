import React, { createContext, useContext } from "react";
import type { Language } from "./translations";
import { t as translate, type TranslationKey } from "./translations";

const LanguageContext = createContext<Language>("EN");

export function LanguageProvider({ language, children }: { language: Language; children: React.ReactNode }) {
  return <LanguageContext.Provider value={language}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): Language {
  return useContext(LanguageContext);
}

export function useT() {
  const lang = useContext(LanguageContext);
  return (key: TranslationKey) => translate(key, lang);
}
