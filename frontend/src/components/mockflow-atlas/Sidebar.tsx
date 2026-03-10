import { useState } from "react";
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
} from "lucide-react";
import { cn } from "../../lib/utils";

interface NavLink {
  type: "link";
  icon: typeof Radio;
  label: string;
  href: string;
}

type NavItem = NavLink;

const navItems: NavItem[] = [
  { type: "link", icon: Radio, label: "Record", href: "/atlas/record" },
  { type: "link", icon: CalendarDays, label: "Meeting Intelligence", href: "/atlas/calendar" },
  { type: "link", icon: Video, label: "Meeting Insights", href: "/atlas/insights" },
  { type: "link", icon: BarChart3, label: "Performance", href: "/atlas/performance" },
  { type: "link", icon: ClipboardCheck, label: "Action Ready", href: "/atlas/todo" },
  { type: "link", icon: HelpCircle, label: "Q&A Engine", href: "/atlas/qna" },
  { type: "link", icon: BookOpen, label: "Knowledge", href: "/atlas/knowledge" },
];

export function AtlasSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside
      className={cn(
        "flex flex-col bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))] text-sidebar-foreground transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-60"
      )}
    >
      {/* Header: Logo + Collapse */}
      <div className="flex items-center justify-between px-4 py-5">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <img src="/images/forskale-logo.png" alt="ForSkale" className="h-9 w-9 flex-shrink-0 rounded-lg object-contain" />
          {!collapsed && (
            <span className="whitespace-nowrap text-sm font-bold text-white tracking-wide">
              ForSkale
            </span>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded text-sidebar-foreground/60 hover:text-sidebar-foreground transition-colors"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
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
              onClick={() => navigate(item.href)}
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

      {/* Bottom: Invite + User */}
      <div className="px-3 py-3 space-y-2">
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
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[hsl(var(--forskale-green))] to-[hsl(var(--forskale-teal))] text-xs font-bold text-white">
            U
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">User</p>
              <p className="truncate text-[10px] text-sidebar-foreground/50">user@example.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
