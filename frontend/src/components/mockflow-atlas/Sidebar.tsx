import { useState, useEffect } from "react";
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
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useAuth } from "../../hooks/useAuth";

interface NavLink {
  type: "link";
  icon: typeof Radio;
  label: string;
  href: string;
}

type NavItem = NavLink;

const navItems: NavItem[] = [
  { type: "link", icon: CalendarDays, label: "Meeting Intelligence", href: "/atlas/calendar" },
  { type: "link", icon: Video, label: "Meeting Insights", href: "/atlas/insights" },
  { type: "link", icon: BarChart3, label: "Performance", href: "/atlas/performance" },
  { type: "link", icon: ClipboardCheck, label: "Action Ready", href: "/atlas/todo" },
  { type: "link", icon: HelpCircle, label: "Q&A Engine", href: "/atlas/qna" },
  { type: "link", icon: BookOpen, label: "Knowledge", href: "/atlas/knowledge" },
];

export function AtlasSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile sidebar is open
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

  const sidebarContent = (
    <>
      {/* Header: Logo + Collapse */}
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
        {/* Close button on mobile, collapse toggle on desktop */}
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

      {/* Gradient divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

      {/* Navigation */}
      <nav className="mt-3 flex flex-1 flex-col gap-0.5 overflow-y-auto overflow-x-hidden px-3 scrollbar-thin">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.href ||
            location.pathname.startsWith(item.href + "/");

          return (
            <button
              key={item.label}
              onClick={() => handleNavigate(item.href)}
              className={cn(
                "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-200",
                collapsed && "justify-center px-0",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground/70 hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-accent-foreground"
              )}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-[60%] w-[3px] -translate-y-1/2 rounded-r bg-gradient-to-b from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))]" />
              )}
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Gradient divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

      {/* Bottom: Record + Invite + User */}
      <div className="px-3 py-3 space-y-2">
        {/* Record button */}
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

        <div
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-3 py-2",
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
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="truncate text-[10px] text-sidebar-foreground/50">{displayEmail}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile hamburger button — fixed top-left */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed top-3 left-3 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-card border border-border shadow-md text-foreground lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar — slides in from left */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[70] flex flex-col bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))] text-sidebar-foreground transition-transform duration-300 ease-in-out w-64 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar — always visible */}
      <aside
        className={cn(
          "hidden lg:flex flex-col bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))] text-sidebar-foreground transition-all duration-300 ease-in-out",
          collapsed ? "w-[72px]" : "w-60"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
