import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  House,
  CalendarDays,
  Video,
  Target,
  ClipboardCheck,
  CircleHelp,
  ChartColumn,
  Settings,
  ChevronRight,
  ChevronLeft,
  UserPlus,
  BookOpen,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/hooks/useSidebar";
import forskaleLogo from "@/assets/forskale-logo.png";

const RecordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" fill="#DC2626" />
  </svg>
);

const NAV_ITEMS = [
  { label: "Meeting Intelligence", icon: CalendarDays, href: "https://mockflow-artist.lovable.app" },
  { label: "Meeting Insight", icon: Video, href: "https://concept-artisan-space.lovable.app" },
  { label: "Strategy", icon: Target, href: null as string | null },
  { label: "Action Ready", icon: ClipboardCheck, href: "https://smooth-build-plan.lovable.app" },
  { label: "QnA Engine", icon: CircleHelp, href: "https://visual-dreamer-box.lovable.app" },
  { label: "Performance", icon: ChartColumn, href: "https://page-wonderland-79.lovable.app" },
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

function CollapsedTooltip({
  label,
  enabled,
  children,
}: {
  label: string;
  enabled: boolean;
  children: React.ReactElement;
}) {
  const [hovered, setHovered] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const handleEnter = useCallback(() => {
    if (!enabled) return;
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect();
      setPos({ top: rect.top + rect.height / 2, left: rect.right + 12 });
    }
    setHovered(true);
  }, [enabled]);

  const handleLeave = useCallback(() => setHovered(false), []);

  return (
    <div ref={ref} onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      {children}
      {enabled && hovered &&
        createPortal(
          <div
            className={cn(
              "pointer-events-none fixed z-[9999] -translate-y-1/2",
              "whitespace-nowrap rounded-lg border border-forskale-teal/30 px-3.5 py-2",
              "bg-gradient-to-r from-forskale-green/90 to-forskale-teal/90 backdrop-blur-sm",
              "text-sm font-semibold text-white shadow-lg shadow-forskale-teal/20",
            )}
            style={{ top: pos.top, left: pos.left }}
          >
            {label}
          </div>,
          document.body,
        )}
    </div>
  );
}

function LabelText({
  show,
  className,
  children,
}: {
  show: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "block overflow-hidden whitespace-nowrap transition-[opacity,max-width] duration-150 ease-out",
        show ? "max-w-[140px] opacity-100 delay-75" : "max-w-0 opacity-0 delay-0",
        className,
      )}
      aria-hidden={!show}
    >
      {children}
    </span>
  );
}

function NavItem({
  label,
  icon: Icon,
  href,
  collapsed,
  showText,
  showTooltip,
  active,
}: {
  label: string;
  icon: React.ElementType;
  href: string | null;
  collapsed: boolean;
  showText: boolean;
  showTooltip: boolean;
  active?: boolean;
}) {
  const base = cn(
    "group relative flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-left no-underline transition-all duration-200 overflow-hidden",
    showText ? "gap-3" : "gap-0",
    "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
    collapsed && "justify-center px-0",
    active && "bg-sidebar-accent text-sidebar-foreground",
  );

  const content = (
    <>
      <Icon className="h-5 w-5 flex-shrink-0" />
      <LabelText show={showText}>{label}</LabelText>
    </>
  );

  const element = href ? (
    <a href={href} className={base}>
      {content}
    </a>
  ) : (
    <button className={base}>{content}</button>
  );

  return (
    <CollapsedTooltip label={label} enabled={showTooltip}>
      {element}
    </CollapsedTooltip>
  );
}

interface AppNavSidebarProps {
  activeNav?: string;
}

const AppNavSidebar = ({ activeNav }: AppNavSidebarProps) => {
  const { collapsed, transitioning, visuallyCollapsed, toggle } = useSidebar();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 });
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showText = !transitioning && !visuallyCollapsed;
  const showCollapsedTooltip = collapsed && !transitioning;

  const isActive = (item: { label: string; route?: string }) => {
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
    if (!collapsed) setSettingsOpen(false);
  }, [collapsed]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  return (
    <>
      <aside
        className={cn(
          "group/sidebar relative flex h-screen shrink-0 flex-col overflow-visible border-r border-sidebar-border bg-gradient-to-b from-sidebar-accent to-sidebar",
          "transition-[width,min-width] duration-300 ease-in-out",
          collapsed ? "w-[60px] min-w-[60px]" : "w-60 min-w-60",
        )}
        data-sidebar-collapsed={collapsed}
      >
        <button
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "absolute top-16 -right-3.5 z-40",
            "flex h-7 w-7 items-center justify-center rounded-full",
            "bg-card text-muted-foreground shadow-card-md transition-all duration-200 ease-in-out hover:text-foreground hover:shadow-lg",
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <div className={cn("flex items-center px-4 py-5", collapsed && "justify-center px-0")}>
          <div className={cn("flex min-w-0 items-center overflow-hidden", showText ? "gap-2.5" : "gap-0", collapsed && "justify-center")}>
            <img
              src={forskaleLogo}
              alt="ForSkale"
              className={cn(
                "flex-shrink-0 rounded-lg object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.9)] drop-shadow-[0_0_40px_rgba(255,255,255,0.5)]",
                collapsed ? "h-8 w-8" : "h-16 w-16",
              )}
            />
            <LabelText show={showText} className="text-sm font-bold tracking-wide text-sidebar-foreground">
              ForSkale
            </LabelText>
          </div>
        </div>

        <div className={cn("flex justify-center px-3 pb-2 pt-1.5", collapsed && "px-2")}>
          <CollapsedTooltip label="Home" enabled={showCollapsedTooltip}>
            <button
              className={cn(
                "forskale-home-capsule group relative flex items-center justify-center rounded-2xl px-5 py-3 text-sm font-semibold text-white transition-all duration-200 overflow-hidden",
                showText ? "gap-3" : "gap-0",
                collapsed && "h-10 w-10 rounded-xl px-0",
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[hsl(197,86%,64%,0.2)] shadow-[inset_0_1px_0_hsl(197,86%,64%,0.25)]">
                <House className="h-5 w-5 text-[hsl(197,86%,64%)] drop-shadow-[0_0_8px_hsl(197,86%,64%,0.6)]" />
              </div>
              <LabelText show={showText} className="tracking-wide drop-shadow-[0_0_8px_hsl(197,86%,64%,0.3)]">
                Home
              </LabelText>
            </button>
          </CollapsedTooltip>
        </div>

        <nav className={cn("flex-1 space-y-0.5 overflow-y-auto overflow-x-visible py-1", collapsed ? "px-2" : "px-3")}>
          {NAV_ITEMS.map((item) => (
            <NavItem
              key={item.label}
              label={item.label}
              icon={item.icon}
              href={item.href}
              collapsed={collapsed}
              showText={showText}
              showTooltip={showCollapsedTooltip}
              active={isActive(item)}
            />
          ))}

          <div onMouseEnter={showSettings} onMouseLeave={hideSettings}>
            <CollapsedTooltip label="Settings" enabled={showCollapsedTooltip}>
              <button
                ref={settingsButtonRef}
                className={cn(
                  "group relative flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-left transition-all duration-200 overflow-hidden",
                  showText ? "gap-3" : "gap-0",
                  collapsed && "justify-center px-0",
                  isSettingsActive
                    ? "forskale-gradient-bg font-medium text-primary-foreground shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                )}
                aria-haspopup="true"
                aria-expanded={settingsOpen}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    updateSubmenuPos();
                    setSettingsOpen((open) => !open);
                  }
                  if (e.key === "Escape") setSettingsOpen(false);
                }}
              >
                <Settings className={cn("h-5 w-5 flex-shrink-0", isSettingsActive && "text-primary-foreground")} />
                <LabelText show={showText} className="flex-1">
                  Settings
                </LabelText>
                {showText && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
              </button>
            </CollapsedTooltip>
          </div>
        </nav>

        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

        <div className={cn("px-3 py-3", collapsed && "px-2")}>
          <CollapsedTooltip label="Invite" enabled={showCollapsedTooltip}>
            <button
              className={cn(
                "group relative flex w-full items-center rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground overflow-hidden",
                showText ? "gap-3" : "gap-0",
                collapsed && "justify-center px-0",
              )}
            >
              <UserPlus className="h-5 w-5 flex-shrink-0" />
              <LabelText show={showText}>Invite</LabelText>
            </button>
          </CollapsedTooltip>
        </div>

        <div className={cn("px-3 pb-4 pt-1", collapsed && "px-2")}>
          <div className={cn("flex items-center rounded-lg px-3 py-2", showText ? "gap-2.5" : "gap-0", collapsed && "justify-center px-0")}>
            <div className="forskale-gradient-bg flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-primary-foreground">
              A
            </div>
            <div className={cn("min-w-0 overflow-hidden transition-[opacity,max-width] duration-150 ease-out", showText ? "max-w-[140px] opacity-100 delay-75" : "max-w-0 opacity-0 delay-0")}>
              <p className="truncate text-sm font-medium text-sidebar-foreground">Andrea Marino</p>
              <p className="truncate text-[10px] text-sidebar-foreground/50">andrea@forskale.com</p>
            </div>
          </div>
        </div>
      </aside>

      {settingsOpen &&
        createPortal(
          <div
            className="fixed z-[9999] min-w-[200px] animate-scale-in rounded-lg border border-border/60 bg-card p-2 shadow-lg"
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
                "flex w-full items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5 text-left text-sm no-underline transition-all duration-200",
                subActive
                  ? "border-border/60 bg-forskale-teal/10 font-medium text-foreground"
                  : "text-muted-foreground hover:bg-forskale-teal/5 hover:text-foreground",
              );

              return (
                <button key={sub.label} className={subClasses} role="menuitem" style={{ animationDelay: `${idx * 50}ms` }}>
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
