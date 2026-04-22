import { cn } from '@/lib/utils';
import { useLanguage, type Language } from '@/components/strategy/LanguageContext';

const langs: Language[] = ['IT', 'EN'];

export default function StrategyTopBar() {
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-2 bg-card border-b border-border">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {t('topbar.title')}
        </span>
        <span className="px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider uppercase bg-[hsl(var(--forskale-teal)/0.15)] text-[hsl(var(--forskale-teal))] border border-[hsl(var(--forskale-teal)/0.3)]">
          Beta
        </span>
      </div>
      <div className="flex items-center rounded-full border border-border bg-muted p-0.5">
        {langs.map(lang => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={cn(
              "px-3.5 py-1 rounded-full text-xs font-semibold uppercase transition-all duration-200",
              language === lang
                ? "bg-[hsl(var(--forskale-teal))] text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {lang}
          </button>
        ))}
      </div>
    </div>
  );
}

