import { AtlasSidebar } from "@/components/atlas/Sidebar";
import { useLanguage } from "@/contexts/LanguageContext";

interface AppLayoutProps {
  children: React.ReactNode;
  activeNav?: string;
}

export function AppLayout({ children, activeNav }: AppLayoutProps) {
  const { lang, setLang } = useLanguage();

  return (
    <div className="flex h-screen overflow-hidden">
      <AtlasSidebar activeNav={activeNav} />
      <div className="relative flex flex-1 flex-col overflow-hidden">
        {/* Dashboard top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-2 bg-card border-b border-border">
           <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
             Meeting Intelligence
           </span>
          <div className="flex items-center rounded-full border border-border bg-muted p-0.5">
            <button
              onClick={() => setLang("IT")}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold uppercase transition-all duration-200 ${
                lang === "IT"
                  ? "bg-forskale-teal text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              IT
            </button>
            <button
              onClick={() => setLang("EN")}
              className={`px-3.5 py-1 rounded-full text-xs font-semibold uppercase transition-all duration-200 ${
                lang === "EN"
                  ? "bg-forskale-teal text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              EN
            </button>
          </div>
        </div>
        <div className="relative flex flex-1 overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
