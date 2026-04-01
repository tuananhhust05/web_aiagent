import { useLanguage } from "@/i18n/LanguageContext";
import { Lang, LANG_LABELS } from "@/i18n/translations";

const LANGS: Lang[] = ["it", "en", "es"];

const LanguageSwitcher = ({ variant = "dark" }: { variant?: "dark" | "light" }) => {
  const { lang, setLang } = useLanguage();

  const isDark = variant === "dark";

  return (
    <div className="flex gap-1 rounded-lg p-1" style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)" }}>
      {LANGS.map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          className="px-3 py-1.5 rounded-md text-xs font-bold transition-all"
          style={{
            background: lang === l ? "rgba(78,205,196,0.2)" : "transparent",
            color: lang === l ? (isDark ? "#4ECDC4" : "#2BA8A0") : (isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.35)"),
            border: lang === l ? "1px solid rgba(78,205,196,0.4)" : "1px solid transparent",
          }}
        >
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
