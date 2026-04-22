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
} from "lucide-react";
import { cn } from "@/lib/utils";
import forskaleLogo from "@/assets/forskale-logo.png";

const RecordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" fill="#DC2626" />
  </svg>
);

type NavItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  route?: string;
};

const navItems: NavItem[] = [
  { icon: CalendarDays, label: "Meeting Intelligence" },
  { icon: Video, label: "Meeting Insight" },
  { icon: Target, label: "Strategy", route: "/" },
  { icon: ClipboardCheck, label: "Action Ready" },
  { icon: HelpCircle, label: "QnA Engine" },
  { icon: BarChart3, label: "Performance" },
];

type SettingsSubItem = {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  route?: string;
};

const settingsSubItems: SettingsSubItem[] = [
  { icon: BookOpen, label: "Knowledge" },
  { icon: RecordIcon, label: "Record" },
  { icon: FileText, label: "Meeting Templates", route: "/meeting-templates" },
];

interface AppNavSidebarProps {
  activeNav?: string;
}

const AppNavSidebar = ({ activeNav }: AppNavSidebarProps) => {
  const [collapsed, setCollapsed] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 });
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isActive = (item: NavItem | SettingsSubItem) => {
    if (activeNav) return item.label === activeNav;
    if (item.route) return window.location.pathname === item.route;
    return false;
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
              <span className="whitespace-nowrap text-sm font-bold text-sidebar-foreground tracking-wide">ForSkale</span>
            )}
          </div>
        </div>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

        {/* Nav items */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const active = isActive(item);
            const classes = cn(
              "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left no-underline",
              collapsed && "justify-center px-0",
              active
                ? "forskale-gradient-bg text-primary-foreground font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
            );

            return (
              <button key={item.label} className={classes}>
                <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-primary-foreground")} />
                {!collapsed && <span>{item.label}</span>}
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
                  <span className="flex-1">Settings</span>
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

              return (
                <button
                  key={sub.label}
                  className={subClasses}
                  role="menuitem"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <sub.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{sub.label}</span>
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
};

export default AppNavSidebar;
