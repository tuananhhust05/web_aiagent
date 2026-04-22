import { LanguageProvider as AppLanguageProvider, useLanguage as useAppLanguage } from "@/i18n/LanguageContext";
import { t as translate } from "@/i18n/translations";

export type Lang = "IT" | "EN";

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  tEN: (key: string) => string;
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  return <AppLanguageProvider>{children}</AppLanguageProvider>;
}

export function useLanguage(): LanguageContextType {
  const { lang, setLang, t } = useAppLanguage();

  const mappedLang: Lang = lang === "it" ? "IT" : "EN";

  return {
    lang: mappedLang,
    setLang: (nextLang: Lang) => setLang(nextLang === "IT" ? "it" : "en"),
    t: (key: string) => t(key as never),
    tEN: (key: string) => translate(key as never, "en"),
  };
}
