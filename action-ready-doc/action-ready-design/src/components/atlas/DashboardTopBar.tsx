import { useLanguage, Lang } from "@/context/LanguageContext";

const DashboardTopBar = () => {
  const { lang, setLang, t } = useLanguage();

  const langs: Lang[] = ["it", "en"];

  return (
    <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-6 py-2">
      <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
        {t("actionReady")}
      </span>
      <div className="flex items-center rounded-full border border-border bg-muted p-0.5">
        {langs.map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold uppercase transition-all duration-200 ${
              lang === l
                ? "bg-forskale-teal text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardTopBar;
