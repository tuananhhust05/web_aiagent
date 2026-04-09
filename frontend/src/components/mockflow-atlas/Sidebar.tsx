import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Video,
  BarChart3,
  ClipboardCheck,
  HelpCircle,
  BookOpen,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Settings,
  Target,
  FileText,
  Sparkles,
  MoreHorizontal,
  Home,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { useSidebar } from "../../hooks/useSidebar";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";
import { Sheet, SheetContent } from "../ui/sheet";

// ─── SVG icon ────────────────────────────────────────────────────────────────
const RecordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" fill="#DC2626" />
  </svg>
);

// ─── Types ────────────────────────────────────────────────────────────────────
interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  action?: "strategy-modal";
}

interface SettingsSubItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const navItems: NavItem[] = [
  { icon: CalendarDays, label: "Meeting Intelligence", href: "/atlas/calendar" },
  { icon: Video, label: "Meeting Insights", href: "/atlas/insights" },
  { icon: Target, label: "Strategy", action: "strategy-modal" },
  { icon: ClipboardCheck, label: "Action Ready", href: "/atlas/todo" },
  { icon: HelpCircle, label: "Q&A Engine", href: "/atlas/qna" },
  { icon: BarChart3, label: "Performance", href: "/atlas/performance" },
];

const settingsSubItems: SettingsSubItem[] = [
  { icon: BookOpen, label: "Knowledge", href: "/atlas/knowledge" },
  { icon: RecordIcon, label: "Record", href: "/atlas/record" },
  { icon: FileText, label: "Meeting Templates", href: "/atlas/playbooks" },
];

const strategyFeatures = [
  "Account playbooks and strategic plans",
  "Cross-meeting themes and opportunities",
  "Smart suggestions powered by Meeting Intelligence",
];

// ─── LabelText ────────────────────────────────────────────────────────────────
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

// ─── CollapsedTooltip ─────────────────────────────────────────────────────────
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
              "whitespace-nowrap rounded-lg border border-[hsl(var(--forskale-teal)/0.3)] px-3.5 py-2",
              "bg-gradient-to-r from-[hsl(var(--forskale-green)/0.9)] to-[hsl(var(--forskale-teal)/0.9)] backdrop-blur-sm",
              "text-sm font-semibold text-white shadow-lg shadow-[hsl(var(--forskale-teal)/0.2)]",
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

// ─── Main component ───────────────────────────────────────────────────────────
export function AtlasSidebar() {
  const { collapsed, transitioning, visuallyCollapsed, toggle } = useSidebar();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [strategyModalOpen, setStrategyModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [submenuPos, setSubmenuPos] = useState({ top: 0, left: 0 });

  const profileMenuRef = useRef<HTMLDivElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut } = useAuth();

  // Derived visibility flags
  const showText = !transitioning && !visuallyCollapsed;
  const showCollapsedTooltip = collapsed && !transitioning;

  // ── Effects ────────────────────────────────────────────────────────────────
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    if (profileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [profileMenuOpen]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  // Close settings submenu when sidebar collapses
  useEffect(() => {
    if (collapsed) setSettingsOpen(false);
  }, [collapsed]);

  // ── Settings submenu helpers ───────────────────────────────────────────────
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

  // ── User data ──────────────────────────────────────────────────────────────
  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"
    : "?";
  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "User"
    : "User";
  const displayEmail = user?.email ?? "";

  // ── Navigation helpers ─────────────────────────────────────────────────────
  const handleNavigate = (href: string) => {
    navigate(href);
    setMobileOpen(false);
  };

  const handleNavClick = (item: NavItem) => {
    if (item.action === "strategy-modal") {
      setStrategyModalOpen(true);
    } else if (item.href) {
      handleNavigate(item.href);
    }
  };

  const isNavActive = (item: NavItem) => {
    if (!item.href) return false;
    return location.pathname === item.href || location.pathname.startsWith(item.href + "/");
  };

  const isSettingsActive = settingsSubItems.some(
    (sub) => sub.href && (location.pathname === sub.href || location.pathname.startsWith(sub.href + "/"))
  );

  // ─── Desktop sidebar JSX ───────────────────────────────────────────────────
  const desktopSidebar = (
    <aside
      className={cn(
        "hidden lg:flex group/sidebar relative h-screen shrink-0 flex-col overflow-visible",
        "border-r border-sidebar-border bg-gradient-to-b from-sidebar-accent to-sidebar",
        "transition-[width,min-width] duration-300 ease-in-out",
        collapsed ? "w-[60px] min-w-[60px]" : "w-60 min-w-60",
      )}
      data-sidebar-collapsed={String(collapsed)}
    >
      {/* Floating toggle button */}
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

      {/* Logo */}
      <div className={cn("flex items-center px-4 py-5", collapsed && "justify-center px-0")}>
        <div className={cn("flex min-w-0 items-center overflow-hidden", showText ? "gap-2.5" : "gap-0", collapsed && "justify-center")}>
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-md scale-125" />
            <img
              src="/images/forskale-logo.png"
              alt="ForSkale"
              className={cn(
                "relative flex-shrink-0 rounded-lg object-contain drop-shadow-[0_0_24px_rgba(255,255,255,0.9)]",
                collapsed ? "h-8 w-8" : "h-16 w-16",
              )}
            />
          </div>
          <LabelText show={showText} className="text-sm font-bold tracking-wide text-white">
            ForSkale
          </LabelText>
        </div>
      </div>

      {/* Home capsule button */}
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
              <Home className="h-5 w-5 text-[hsl(197,86%,64%)] drop-shadow-[0_0_8px_hsl(197,86%,64%,0.6)]" />
            </div>
            <LabelText show={showText} className="tracking-wide drop-shadow-[0_0_8px_hsl(197,86%,64%,0.3)]">
              Home
            </LabelText>
          </button>
        </CollapsedTooltip>
      </div>

      {/* Nav items */}
      <nav className={cn("flex-1 space-y-0.5 overflow-y-auto overflow-x-visible py-1", collapsed ? "px-2" : "px-3")}>
        {navItems.map((item) => {
          const active = isNavActive(item);
          return (
            <CollapsedTooltip key={item.label} label={item.label} enabled={showCollapsedTooltip}>
              <button
                onClick={() => handleNavClick(item)}
                className={cn(
                  "group relative flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-left transition-all duration-200 overflow-hidden",
                  showText ? "gap-3" : "gap-0",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-white")} />
                <LabelText show={showText}>{item.label}</LabelText>
              </button>
            </CollapsedTooltip>
          );
        })}

        {/* Settings with hover submenu */}
        <div onMouseEnter={showSettings} onMouseLeave={hideSettings}>
          <CollapsedTooltip label="Settings" enabled={showCollapsedTooltip}>
            <button
              ref={settingsButtonRef}
              className={cn(
                "group relative flex w-full items-center rounded-lg px-3 py-2.5 text-sm text-left transition-all duration-200 overflow-hidden",
                showText ? "gap-3" : "gap-0",
                collapsed && "justify-center px-0",
                isSettingsActive
                  ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
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
              <Settings className={cn("h-5 w-5 flex-shrink-0", isSettingsActive && "text-white")} />
              <LabelText show={showText} className="flex-1">Settings</LabelText>
              {showText && <ChevronRight className="h-3.5 w-3.5 opacity-50" />}
            </button>
          </CollapsedTooltip>
        </div>
      </nav>

      {/* Divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

      {/* Invite button */}
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

      {/* User profile area */}
      <div className={cn("px-3 pb-4 pt-1", collapsed && "px-2")} ref={profileMenuRef}>
        <button
          onClick={() => setProfileMenuOpen(!profileMenuOpen)}
          className={cn(
            "relative flex w-full items-center rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent cursor-pointer",
            showText ? "gap-2.5" : "gap-0",
            collapsed && "justify-center px-0",
          )}
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={displayName}
              className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))] text-xs font-bold text-white">
              {initials}
            </div>
          )}
          <div
            className={cn(
              "min-w-0 overflow-hidden text-left transition-[opacity,max-width] duration-150 ease-out",
              showText ? "max-w-[140px] opacity-100 delay-75" : "max-w-0 opacity-0 delay-0"
            )}
          >
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="truncate text-[10px] text-sidebar-foreground/50">{displayEmail}</p>
          </div>
        </button>

        {profileMenuOpen && (
          <div
            className={cn(
              "absolute z-50 mb-1 w-48 rounded-lg border border-border bg-card shadow-xl py-1",
              collapsed ? "bottom-4 left-full ml-2" : "bottom-16 left-3"
            )}
          >
            <button
              onClick={() => {
                setProfileMenuOpen(false);
                handleNavigate("/profile");
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </button>
            <div className="mx-2 h-px bg-border" />
            <button
              onClick={() => {
                setProfileMenuOpen(false);
                signOut();
              }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-muted transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  // ─── Mobile sidebar content (shared between Sheet and bottom nav) ──────────
  const mobileSidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-md scale-125" />
            <img src="/images/forskale-logo.png" alt="ForSkale" className="relative h-16 w-16 rounded-lg object-contain" />
          </div>
          <span className="whitespace-nowrap text-sm font-bold text-white tracking-wide">ForSkale</span>
        </div>
      </div>

      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

      <nav className="mt-3 flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-3 scrollbar-thin">
        {navItems.map((item) => {
          const active = isNavActive(item);
          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left w-full",
                active
                  ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                  : "text-sidebar-foreground/70 hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-white")} />
              <span className="whitespace-nowrap">{item.label}</span>
            </button>
          );
        })}

        <div onMouseEnter={showSettings} onMouseLeave={hideSettings}>
          <button
            ref={settingsButtonRef}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left",
              isSettingsActive
                ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                : "text-sidebar-foreground/70 hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-foreground"
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
            <Settings className={cn("h-5 w-5 flex-shrink-0", isSettingsActive && "text-white")} />
            <span className="flex-1">Settings</span>
            <ChevronRight className="h-3.5 w-3.5 opacity-50" />
          </button>
        </div>
      </nav>

      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

      <div className="px-3 py-3 space-y-2">
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors">
          <UserPlus className="h-5 w-5 flex-shrink-0" />
          <span>Invite</span>
        </button>

        <div ref={profileMenuRef} className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent cursor-pointer"
          >
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={displayName}
                className="h-8 w-8 flex-shrink-0 rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))] text-xs font-bold text-white">
                {initials}
              </div>
            )}
            <div className="min-w-0 text-left">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="truncate text-[10px] text-sidebar-foreground/50">{displayEmail}</p>
            </div>
          </button>

          {profileMenuOpen && (
            <div className="absolute z-50 mb-1 w-48 rounded-lg border border-border bg-card shadow-xl py-1 bottom-full left-0">
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  handleNavigate("/profile");
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
              >
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </button>
              <div className="mx-2 h-px bg-border" />
              <button
                onClick={() => {
                  setProfileMenuOpen(false);
                  signOut();
                }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-red-400 hover:bg-muted transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );

  const mobileBottomNavItems = navItems.slice(0, 4);

  return (
    <>
      {/* Mobile Sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-64 p-0 border-r-0 bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))] text-sidebar-foreground lg:hidden"
        >
          {mobileSidebarContent}
        </SheetContent>
      </Sheet>

      {/* Mobile bottom nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around border-t border-border bg-card/95 backdrop-blur-md px-2 pb-safe lg:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        {mobileBottomNavItems.map((item) => {
          const active = isNavActive(item);
          return (
            <button
              key={item.label}
              onClick={() => handleNavClick(item)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-medium transition-colors",
                active ? "text-[hsl(var(--forskale-teal))]" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", active && "text-[hsl(var(--forskale-teal))]")} />
              <span className="truncate max-w-full">{item.label.split(" ")[0]}</span>
            </button>
          );
        })}
        <button
          onClick={() => setMobileOpen(true)}
          className="flex flex-1 flex-col items-center gap-0.5 py-2 px-1 text-[10px] font-medium text-muted-foreground transition-colors"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      {/* Desktop sidebar */}
      {desktopSidebar}

      {/* Settings submenu portal */}
      {settingsOpen && createPortal(
        <div
          ref={submenuRef}
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
            const subActive = sub.href && (location.pathname === sub.href || location.pathname.startsWith(sub.href + "/"));
            return (
              <button
                key={sub.label}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg border border-border/40 px-3 py-2.5 text-sm transition-all duration-200 text-left",
                  subActive
                    ? "bg-[hsl(var(--forskale-teal)/0.12)] text-foreground font-medium border-border/60"
                    : "text-muted-foreground hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-foreground"
                )}
                role="menuitem"
                style={{ animationDelay: `${idx * 50}ms` }}
                onClick={() => {
                  if (sub.href) {
                    handleNavigate(sub.href);
                    setSettingsOpen(false);
                  }
                }}
              >
                <sub.icon className="h-4 w-4 flex-shrink-0" />
                <span>{sub.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}

      {/* Strategy modal */}
      <Dialog open={strategyModalOpen} onOpenChange={setStrategyModalOpen}>
        <DialogContent className="max-w-md border-0 p-0 overflow-hidden rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.2)]">
          <div className="relative bg-gradient-to-br from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] px-6 pt-8 pb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <Target className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="text-xl font-bold text-white leading-tight">Strategy – Coming Soon</DialogTitle>
            </div>
            <DialogDescription className="text-white/85 text-sm leading-relaxed">
              A dedicated Strategy hub that guides you through every negotiation with clarity and confidence. This space
              will deliver real-time recommendations powered by advanced AI and Neuroscience, combining past
              conversations, critical context, and stakeholder insights – so you always know what to say next and how to
              move the discussion toward the desired outcome. Stay tuned
            </DialogDescription>
          </div>

          <div className="px-6 py-5 bg-white">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">What's coming</p>
            <ul className="space-y-2.5">
              {strategyFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Sparkles className="h-4 w-4 mt-0.5 flex-shrink-0 text-[hsl(var(--forskale-teal))]" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="px-6 pb-5 bg-white">
            <button
              onClick={() => setStrategyModalOpen(false)}
              className="w-full rounded-xl bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] px-4 py-2.5 text-sm font-medium text-white transition-shadow hover:shadow-[0_4px_16px_hsl(var(--forskale-teal)/0.4)] active:scale-[0.98]"
            >
              Got it
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
