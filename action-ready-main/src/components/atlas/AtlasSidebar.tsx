import { useState } from "react";
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
} from "lucide-react";
import forskaleLogo from "@/assets/forskale-logo.png";

const navItems = [
  { icon: CalendarDays, label: "Meeting Intelligence", href: "#" },
  { icon: Video, label: "Meeting Insights", href: "#" },
  { icon: BarChart3, label: "Performance", href: "#" },
  { icon: ClipboardCheck, label: "Action Ready", href: "#", active: true },
  { icon: HelpCircle, label: "Q&A Engine", href: "#" },
  { icon: BookOpen, label: "Knowledge", href: "#" },
];

const AtlasSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`group/sidebar relative hidden min-h-screen flex-col bg-gradient-to-b from-[hsl(var(--sidebar-accent))] to-[hsl(var(--sidebar-background))] text-sidebar-foreground transition-all duration-300 ease-in-out lg:flex ${
        collapsed ? "w-[72px]" : "w-60"
      }`}
    >
      {/* Collapse Toggle - White pill at edge */}
      <button
        onClick={() => setCollapsed((prev) => !prev)}
        className="invisible absolute -right-4 top-16 z-50 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.15)] transition-all duration-200 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)] group-hover/sidebar:visible"
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <ChevronLeft
          className={`h-4 w-4 text-sidebar transition-transform duration-300 ${
            collapsed ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Logo & Brand */}
      <div className="flex items-center gap-3 px-4 py-5">
        <img
          src={forskaleLogo}
          alt="ForSkale"
          className="h-16 w-16 shrink-0 rounded-lg object-contain drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]"
        />
        {!collapsed && (
          <p className="text-base font-semibold tracking-wide text-sidebar-foreground">
            ForSkale
          </p>
        )}
      </div>

      {/* Gradient divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

      {/* Record CTA */}
      <div className="px-3 py-3">
        <button
          className={`flex w-full items-center justify-center gap-2.5 rounded-xl bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-4 py-2.5 text-sm font-semibold text-white shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_16px_hsl(var(--forskale-green)/0.4)] ${
            collapsed ? "px-0" : ""
          }`}
        >
          <Radio className="h-4.5 w-4.5 shrink-0" />
          {!collapsed && <span>Record</span>}
        </button>
      </div>

      {/* Gradient divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              item.active
                ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                : "text-sidebar-foreground/70 hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-foreground"
            }`}
            title={item.label}
          >
            {item.active && (
              <span className="absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-gradient-to-b from-forskale-green to-forskale-teal" />
            )}
            <item.icon className="h-5 w-5 shrink-0" strokeWidth={item.active ? 2 : 1.6} />
            {!collapsed && <span>{item.label}</span>}
          </a>
        ))}
      </nav>

      {/* Gradient divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

      {/* Invite button */}
      <div className="px-3 py-2">
        <button
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground/70 transition-colors hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-foreground ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <UserPlus className="h-5 w-5 shrink-0" strokeWidth={1.6} />
          {!collapsed && <span>Invite</span>}
        </button>
      </div>

      {/* User card */}
      <div className={`px-3 pb-4 ${collapsed ? "flex justify-center" : ""}`}>
        <div className={`flex items-center gap-3 rounded-lg px-3 py-2.5 ${collapsed ? "px-0" : ""}`}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-forskale-green to-forskale-teal text-sm font-bold text-white">
            JD
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-sidebar-foreground">John Doe</p>
              <p className="truncate text-xs text-sidebar-foreground/50">john@forskale.ai</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AtlasSidebar;
