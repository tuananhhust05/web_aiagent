import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Radio,
  CalendarDays,
  Video,
  BarChart3,
  ClipboardCheck,
  HelpCircle,
  BookOpen,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Settings,
  Target,
  FileText,
  Sparkles,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "../ui/dialog";

const RecordIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" fill="none" />
    <circle cx="12" cy="12" r="4" fill="#DC2626" />
  </svg>
);

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

export function AtlasSidebar() {
  const [collapsed, setCollapsed] = useState(false);
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

  const initials = user
    ? `${user.first_name?.[0] ?? ""}${user.last_name?.[0] ?? ""}`.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"
    : "?";
  const displayName = user
    ? [user.first_name, user.last_name].filter(Boolean).join(" ") || user.username || "User"
    : "User";
  const displayEmail = user?.email ?? "";

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

  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="relative flex-shrink-0">
            <div className="absolute inset-0 rounded-full bg-white/10 blur-md scale-125" />
            <img src="/images/forskale-logo.png" alt="ForSkale" className="relative h-16 w-16 rounded-lg object-contain" />
          </div>
          {!collapsed && (
            <span className="whitespace-nowrap text-sm font-bold text-white tracking-wide">
              ForSkale
            </span>
          )}
        </div>
        <button
          onClick={() => {
            if (window.innerWidth < 1024) {
              setMobileOpen(false);
            } else {
              setCollapsed(!collapsed);
            }
          }}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          aria-label={mobileOpen ? "Close sidebar" : collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {mobileOpen && window.innerWidth < 1024 ? (
            <X className="h-4 w-4" />
          ) : collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>
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
                collapsed && "justify-center px-0",
                active
                  ? "bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-blue))] text-white font-medium shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]"
                  : "text-sidebar-foreground/70 hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-accent-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", active && "text-white")} />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}

        <div
          onMouseEnter={showSettings}
          onMouseLeave={hideSettings}
        >
          <button
            ref={settingsButtonRef}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left",
              collapsed && "justify-center px-0",
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

      <div className="px-3 py-3 space-y-2">
        <button
          onClick={() => handleNavigate("/atlas/record")}
          className={cn(
            "flex w-full items-center justify-center gap-2.5 py-2.5 text-sm font-semibold text-white transition-all duration-200",
            "bg-gradient-to-r from-[hsl(var(--forskale-green))] via-[hsl(var(--forskale-teal))] to-[hsl(var(--forskale-cyan))]",
            "hover:shadow-lg hover:shadow-[hsl(var(--forskale-teal)/0.3)] hover:brightness-110",
            "rounded-[5px]",
            collapsed && "px-0"
          )}
        >
          <Radio className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Record</span>}
        </button>

        <button
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors",
            collapsed && "justify-center px-0"
          )}
        >
          <UserPlus className="h-5 w-5 flex-shrink-0" />
          {!collapsed && <span>Invite</span>}
        </button>

        <div ref={profileMenuRef} className="relative">
          <button
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 transition-colors hover:bg-sidebar-accent cursor-pointer",
              collapsed && "justify-center px-0"
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
            {!collapsed && (
              <div className="min-w-0 text-left">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
                <p className="truncate text-[10px] text-sidebar-foreground/50">{displayEmail}</p>
              </div>
            )}
          </button>

          {profileMenuOpen && (
            <div
              className={cn(
                "absolute z-50 mb-1 w-48 rounded-lg border border-border bg-card shadow-xl py-1",
                collapsed ? "bottom-0 left-full ml-2" : "bottom-full left-0"
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
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border shadow-md text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex flex-col bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))] text-sidebar-foreground transition-transform duration-300 ease-in-out w-64 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <aside
        className={cn(
          "hidden lg:flex flex-col bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))] text-sidebar-foreground transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>

      {settingsOpen && createPortal(
        <div
          ref={submenuRef}
          className="fixed z-[9999] min-w-[200px] rounded-lg border border-border/60 bg-card p-2 shadow-lg"
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
                  "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200 text-left border border-border/40",
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
