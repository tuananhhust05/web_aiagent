import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Video,
  BarChart3,
  ClipboardCheck,
  HelpCircle,
  BookOpen,
  User,
  UserPlus,
  LogOut,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Target,
  FileText,
  Settings,
  Home,
} from "lucide-react";
import { cn } from "@/lib/utils";
import forskaleLogo from "@/assets/forskale-logo.png";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";

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
  { icon: CalendarDays, labelKey: "sidebar.meetingIntelligence", route: "/atlas/calendar" },
  { icon: Video, labelKey: "sidebar.meetingInsight", route: "/atlas/calls" },
  { icon: Target, labelKey: "sidebar.strategy", route: "/atlas/strategy" },
  { icon: ClipboardCheck, labelKey: "sidebar.actionReady", route: "/atlas/todo" },
  { icon: HelpCircle, labelKey: "sidebar.qnaEngine", route: "/atlas/qna" },
  { icon: BarChart3, labelKey: "sidebar.performance", route: "/atlas/performance" },
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
    route: "/atlas/knowledge",
  },
  {
    icon: RecordIcon,
    labelKey: "sidebar.record",
    route: "/atlas/record",
  },
  {
    icon: FileText,
    labelKey: "sidebar.meetingTemplates",
    route: "/meeting-templates",
  },
];

interface AtlasSidebarProps {
  activeNav?: string;
}

export function AtlasSidebar({ activeNav }: AtlasSidebarProps) {
  const { user, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 });
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountButtonRef = useRef<HTMLButtonElement>(null);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const [accountMenuPos, setAccountMenuPos] = useState({ top: 0, left: 0 });
  const { tEN: t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Map labelKey to EN label for activeNav matching
  const isActive = (item: NavItem | SettingsSubItem) => {
    const label = t(item.labelKey);
    if (activeNav) return label === activeNav;
    if ("route" in item && item.route) return location.pathname === item.route;
    if ("href" in item && item.href) return false;
    return false;
  };

  const isSettingsActive = settingsSubItems.some((sub) => isActive(sub));

  const updateSubmenuPos = useCallback(() => {
    if (settingsButtonRef.current) {
      const rect = settingsButtonRef.current.getBoundingClientRect();
      setSubmenuPos({ top: rect.top, left: rect.right + 8 });
    }
  }, []);

  const updateAccountMenuPos = useCallback(() => {
    if (accountButtonRef.current) {
      const rect = accountButtonRef.current.getBoundingClientRect();
      setAccountMenuPos({ top: rect.top, left: rect.right + 8 });
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

  useEffect(() => {
    if (!accountOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (accountButtonRef.current?.contains(target)) return;
      if (accountMenuRef.current?.contains(target)) return;
      setAccountOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [accountOpen]);

  useEffect(() => {
    if (!collapsed || !accountOpen) return;

    const adjustMenuPos = () => {
      if (!accountButtonRef.current || !accountMenuRef.current) return;

      const padding = 8;
      const btnRect = accountButtonRef.current.getBoundingClientRect();
      const menuRect = accountMenuRef.current.getBoundingClientRect();

      let top = btnRect.top;
      let left = btnRect.right + 8;

      if (top + menuRect.height + padding > window.innerHeight) {
        top = Math.max(padding, window.innerHeight - menuRect.height - padding);
      }
      if (left + menuRect.width + padding > window.innerWidth) {
        left = Math.max(padding, window.innerWidth - menuRect.width - padding);
      }

      setAccountMenuPos((prev) => (prev.top === top && prev.left === left ? prev : { top, left }));
    };

    const raf = requestAnimationFrame(adjustMenuPos);
    window.addEventListener("resize", adjustMenuPos);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", adjustMenuPos);
    };
  }, [collapsed, accountOpen]);

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

            return item.href ? (
              <a key={item.labelKey} href={item.href} className={classes}>
                {content}
              </a>
            ) : item.route ? (
              <button key={item.labelKey} className={classes} onClick={() => navigate(item.route!)}>
                {content}
              </button>
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
          <button
            ref={accountButtonRef}
            className={cn(
              "group relative flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left transition-all duration-200",
              collapsed && "justify-center px-0",
              accountOpen
                ? "bg-sidebar-accent text-sidebar-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            )}
            aria-haspopup="true"
            aria-expanded={accountOpen}
            onClick={() => {
              if (collapsed) updateAccountMenuPos();
              setSettingsOpen(false);
              setAccountOpen((o) => !o);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") setAccountOpen(false);
            }}
          >
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full forskale-gradient-bg text-xs font-bold text-primary-foreground">
              {user?.email?.[0]?.toUpperCase() || "U"}
            </div>
            {!collapsed && (
              <>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-sidebar-foreground">
                    {user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.email || "User"}
                  </p>
                  <p className="truncate text-[10px] text-sidebar-foreground/50">{user?.email || ""}</p>
                </div>
                <ChevronRight className={cn("h-4 w-4 opacity-50 transition-transform", accountOpen && "rotate-90")} />
              </>
            )}
          </button>

          {!collapsed && accountOpen && (
            <div className="mt-2 space-y-1">
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                onClick={() => {
                  navigate("/profile");
                  setAccountOpen(false);
                }}
              >
                <User className="h-4 w-4 flex-shrink-0" />
                <span>{t("sidebar.account")}</span>
              </button>
              <button
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                onClick={() => {
                  setAccountOpen(false);
                  signOut();
                }}
              >
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span>{t("sidebar.logout")}</span>
              </button>
            </div>
          )}
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
                  onClick={() => {
                    if (sub.route) navigate(sub.route);
                    setSettingsOpen(false);
                  }}
                >
                  {el}
                </button>
              );
            })}
          </div>,
          document.body,
        )}

      {collapsed &&
        accountOpen &&
        createPortal(
          <div
            ref={accountMenuRef}
            className="fixed z-[9999] min-w-[200px] max-h-[calc(100vh-16px)] overflow-auto rounded-lg border border-border/60 bg-card p-2 shadow-lg animate-scale-in"
            style={{ top: accountMenuPos.top, left: accountMenuPos.left }}
            role="menu"
            onKeyDown={(e) => {
              if (e.key === "Escape") setAccountOpen(false);
            }}
          >
            <button
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left border border-border/40 text-muted-foreground hover:bg-forskale-teal/5 hover:text-foreground"
              role="menuitem"
              onClick={() => {
                navigate("/profile");
                setAccountOpen(false);
              }}
            >
              <User className="h-4 w-4 flex-shrink-0" />
              <span>{t("sidebar.account")}</span>
            </button>
            <button
              className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left border border-border/40 text-muted-foreground hover:bg-forskale-teal/5 hover:text-foreground"
              role="menuitem"
              onClick={() => {
                setAccountOpen(false);
                signOut();
              }}
            >
              <LogOut className="h-4 w-4 flex-shrink-0" />
              <span>{t("sidebar.logout")}</span>
            </button>
          </div>,
          document.body,
        )}

    </>
  );
}
