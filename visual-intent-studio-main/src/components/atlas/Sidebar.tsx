import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Video,
  BarChart3,
  ClipboardCheck,
  HelpCircle,
  BookOpen,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Target,
  FileText,
  Settings,
  Home,
  Sparkles,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import forskaleLogo from "@/assets/forskale-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

const RecordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" fill="#DC2626" />
  </svg>
);

type NavItem = {
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  href?: string;
  route?: string;
  type?: "link" | "modal";
};

const HOME_HREF = "https://home-forskale.lovable.app";

const navItems: NavItem[] = [
  { icon: CalendarDays, labelKey: "sidebar.meetingIntelligence", href: "https://mockflow-artist.lovable.app" },
  { icon: Video, labelKey: "sidebar.meetingInsight", href: "https://concept-artisan-space.lovable.app" },
  { icon: Target, labelKey: "sidebar.strategy", type: "modal" },
  { icon: ClipboardCheck, labelKey: "sidebar.actionReady", href: "https://smooth-build-plan.lovable.app" },
  { icon: HelpCircle, labelKey: "sidebar.qnaEngine", href: "https://visual-dreamer-box.lovable.app" },
  { icon: BarChart3, labelKey: "sidebar.performance", href: "https://page-wonderland-79.lovable.app" },
];

type SettingsSubItem = {
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  href?: string;
  route?: string;
};

const settingsSubItems: SettingsSubItem[] = [
  {
    icon: BookOpen,
    labelKey: "sidebar.knowledge",
    href: "https://id-preview--be8e5a0c-8e6e-4c82-9fc9-68f5b7626ee0.lovable.app",
  },
  {
    icon: RecordIcon,
    labelKey: "sidebar.record",
    href: "https://id-preview--bd05911a-d8fd-4ab9-aaa7-333d630b922e.lovable.app",
  },
  { icon: FileText, labelKey: "sidebar.meetingTemplates", route: "/meeting-templates" },
];

/* ─── Strategy Coming Soon Modal ─── */
function StrategyModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const { tEN: t } = useLanguage();

  useEffect(() => {
    if (open) {
      closeBtnRef.current?.focus();
      const handler = (e: KeyboardEvent) => {
        if (e.key === "Escape") onClose();
      };
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="strategy-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      <div className="relative z-10 mx-4 w-full max-w-md animate-in fade-in zoom-in-95 duration-300 ease-out">
        <div className="absolute -inset-px rounded-2xl forskale-gradient-bg opacity-60 blur-sm" />
        <div className="relative rounded-2xl bg-card p-6 shadow-2xl">
          <button
            ref={closeBtnRef}
            onClick={onClose}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors active:scale-95"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl forskale-gradient-bg shadow-lg">
            <Sparkles className="h-7 w-7 text-primary-foreground" />
          </div>
          <h2 id="strategy-modal-title" className="text-center text-xl font-bold text-foreground">
            {t("sidebar.strategyComingSoon")}
          </h2>
          <p className="mt-2 text-center text-sm leading-relaxed text-muted-foreground">
            {t("sidebar.strategyDescription")}
          </p>
          <button
            onClick={onClose}
            className="mt-6 w-full rounded-xl forskale-gradient-bg py-2.5 text-sm font-semibold text-primary-foreground shadow-md hover:shadow-lg transition-shadow duration-200 active:scale-[0.98]"
          >
            {t("sidebar.gotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AtlasSidebarProps {
  activeNav?: string;
}

export function AtlasSidebar({ activeNav }: AtlasSidebarProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 });
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { tEN: t } = useLanguage();

  // Map labelKey to EN label for activeNav matching
  const isActive = (item: NavItem | SettingsSubItem) => {
    const label = t(item.labelKey);
    if (activeNav) return label === activeNav;
    if ("route" in item && item.route) return window.location.pathname === item.route;
    return !activeNav && item.labelKey === "sidebar.meetingIntelligence";
  };

  const isSettingsActive = settingsSubItems.some((sub) => isActive(sub));

  const updateSubmenuPos = useCallback(() => {
    if (settingsButtonRef.current) {
      const rect = settingsButtonRef.current.getBoundingClientRect();
      setSubmenuPos({ top: rect.top, left: rect.right + 8 });
    }
  }, []);

  const showSettings = () => {
    if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    updateSubmenuPos();
    setSettingsOpen(true);
  };

  const hideSettings = () => {
    hideTimeoutRef.current = setTimeout(() => setSettingsOpen(false), 200);
  };

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <aside
        className={cn(
          "group/sidebar relative h-screen flex flex-col border-r border-sidebar-border transition-all duration-300 ease-in-out",
          "bg-gradient-to-b from-sidebar-accent to-sidebar",
          collapsed ? "w-[72px] min-w-[72px]" : "w-60 min-w-60",
        )}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "absolute top-16 -right-4 z-40 flex h-7 w-7 items-center justify-center rounded-full",
            "bg-card text-muted-foreground hover:text-foreground",
            "shadow-card-md hover:shadow-lg",
            "invisible group-hover/sidebar:visible transition-all duration-200 ease-in-out",
            collapsed && "rotate-180",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {/* Logo */}
        <div className="flex items-center px-4 py-5">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={forskaleLogo}
              alt="ForSkale"
              className="h-16 w-16 flex-shrink-0 rounded-lg object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.9)] drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]"
            />
            {!collapsed && (
              <span className="whitespace-nowrap text-sm font-bold text-sidebar-foreground tracking-wide">
                ForSkale
              </span>
            )}
          </div>
        </div>

        {/* Home — premium hero capsule */}
        <div className={cn("px-3 pt-1.5 pb-2", "flex justify-center")}>
          <a
            href={HOME_HREF}
            className={cn(
              "forskale-home-capsule group relative flex items-center gap-3 rounded-2xl px-5 py-3 text-sm font-semibold text-primary-foreground transition-all duration-200 no-underline",
              collapsed ? "justify-center px-3" : "justify-center",
            )}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(197,86%,64%,0.2)] shadow-[inset_0_1px_0_hsl(197,86%,64%,0.25)]">
              <Home className="h-5 w-5 text-forskale-cyan drop-shadow-[0_0_8px_hsl(197,86%,64%,0.6)]" />
            </div>
            {!collapsed && <span className="tracking-wide drop-shadow-[0_0_8px_hsl(197,86%,64%,0.3)]">{t("sidebar.home")}</span>}
          </a>
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = isActive(item);
            const classes = cn(
              "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left no-underline",
              collapsed && "justify-center px-0",
              active
                ? "forskale-gradient-bg text-primary-foreground font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            );

            const content = (
              <>
                <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-primary-foreground")} />
                {!collapsed && <span>{t(item.labelKey)}</span>}
              </>
            );

            if (item.type === "modal") {
              return (
                <button key={item.labelKey} className={classes} onClick={() => setStrategyOpen(true)}>
                  {content}
                </button>
              );
            }

            return item.href ? (
              <a key={item.labelKey} href={item.href} className={classes}>
                {content}
              </a>
            ) : (
              <button key={item.labelKey} className={classes}>
                {content}
              </button>
            );
          })}

          {/* Settings with hover submenu */}
          <div onMouseEnter={showSettings} onMouseLeave={hideSettings}>
            <button
              ref={settingsButtonRef}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left",
                collapsed && "justify-center px-0",
                isSettingsActive
                  ? "forskale-gradient-bg text-primary-foreground font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
              )}
              aria-haspopup="true"
              aria-expanded={settingsOpen}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  updateSubmenuPos();
                  setSettingsOpen((o) => !o);
                }
                if (e.key === "Escape") setSettingsOpen(false);
              }}
            >
              <Settings className={cn("h-5 w-5 flex-shrink-0", isSettingsActive && "text-primary-foreground")} />
              {!collapsed && (
                <>
                  <span className="flex-1">{t("sidebar.settings")}</span>
                  <ChevronRight className="h-3.5 w-3.5 opacity-50" />
                </>
              )}
            </button>
          </div>
        </nav>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

        {/* Invite */}
        <div className="px-3 py-3">
          <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
            <UserPlus className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Invite</span>}
          </button>
        </div>

        {/* User */}
        <div className="px-3 pb-4 pt-1">
          <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full forskale-gradient-bg text-xs font-bold text-primary-foreground">
              A
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-sidebar-foreground">Andrea Marino</p>
                <p className="truncate text-[10px] text-sidebar-foreground/50">andrea@forskale.com</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Settings submenu portal */}
      {settingsOpen &&
        createPortal(
          <div
            ref={submenuRef}
            className="fixed z-[9999] min-w-[200px] rounded-lg border border-border/60 bg-card p-2 shadow-lg animate-scale-in"
            style={{ top: submenuPos.top, left: submenuPos.left }}
            onMouseEnter={showSettings}
            onMouseLeave={hideSettings}
            role="menu"
            onKeyDown={(e) => {
              if (e.key === "Escape") setSettingsOpen(false);
            }}
          >
            {settingsSubItems.map((sub, idx) => {
              const subActive = isActive(sub);
              const subClasses = cn(
                "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left no-underline border border-border/40",
                subActive
                  ? "bg-forskale-teal/10 text-foreground font-medium border-border/60"
                  : "text-muted-foreground hover:bg-forskale-teal/5 hover:text-foreground",
              );

              const el = (
                <>
                  <sub.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{t(sub.labelKey)}</span>
                </>
              );

              return sub.href ? (
                <a
                  key={sub.labelKey}
                  href={sub.href}
                  className={subClasses}
                  role="menuitem"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {el}
                </a>
              ) : (
                <button
                  key={sub.labelKey}
                  className={subClasses}
                  role="menuitem"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  {el}
                </button>
              );
            })}
          </div>,
          document.body,
        )}

      <StrategyModal open={strategyOpen} onClose={() => setStrategyOpen(false)} />
    </>
  );
}
