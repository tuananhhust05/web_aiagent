import { useState } from "react";
import {
  CalendarDays,
  PhoneCall,
  BarChart3,
  ClipboardCheck,
  HelpCircle,
  BookOpen,
  Radio,
  ChevronLeft,
  ChevronRight,
  UserPlus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/forskale-logo.png";

const navItems = [
  { name: "Meeting Intelligence", icon: CalendarDays, active: false },
  { name: "Call Insights", icon: PhoneCall, active: false },
  { name: "Performance", icon: BarChart3, active: true },
  { name: "Action Ready", icon: ClipboardCheck, active: false },
  { name: "Q&A Engine", icon: HelpCircle, active: false },
  { name: "Knowledge", icon: BookOpen, active: false },
];

const AppSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "relative flex flex-col shrink-0 transition-all duration-300 h-screen",
        "bg-gradient-to-b from-sidebar-accent to-sidebar",
        "shadow-[4px_0_24px_rgba(0,0,0,0.25)] border-r border-border/10 z-10",
        collapsed ? "w-[72px]" : "w-60",
      )}
    >
      {/* Floating Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          "absolute top-[18px] -right-3.5 z-40 w-7 h-7 rounded-lg",
          "bg-background shadow-lg border border-border/50",
          "flex items-center justify-center",
          "text-muted-foreground hover:text-foreground transition-all duration-200",
          "hover:shadow-xl hover:scale-105",
        )}
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border/30">
        <div className="h-10 w-10 rounded-xl bg-background p-1.5 shrink-0 shadow-sm">
          <img src={logo} alt="ForSkale" className="h-full w-full rounded-lg object-contain" />
        </div>
        {!collapsed && (
          <span className="text-sm font-bold tracking-wider text-sidebar-accent-foreground">ForSkale</span>
        )}
      </div>

      {/* Gradient Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-sidebar-primary/40 to-transparent mx-4 my-3" />

      {/* Navigation */}
      <nav className="flex-1 py-2 space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href="#"
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors relative",
                item.active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-[0_0_0_1px_rgba(255,255,255,0.08)]"
                  : "text-muted-foreground hover:bg-forskale-teal/10 hover:text-foreground",
              )}
            >
              {item.active && (
                <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-full bg-gradient-to-b from-forskale-green via-forskale-teal to-forskale-blue" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span className="truncate text-sm">{item.name}</span>}
            </a>
          );
        })}
      </nav>

      {/* Gradient Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent mx-4 my-3" />

      {/* Record CTA */}
      <div className="px-4 mb-4">
        <button
          className={cn(
            "w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 transition-all duration-300",
            "bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue",
            "text-primary-foreground font-semibold text-sm shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]",
            "hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.4)]",
          )}
        >
          <Radio className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Record</span>}
        </button>
      </div>

      {/* Bottom Gradient Divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent mx-4 mb-3" />

      {/* Invite & User */}
      <div className="px-4 pb-4 space-y-3">
        <button
          className={cn(
            "w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs",
            "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors",
            collapsed && "justify-center",
          )}
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Invite teammate</span>}
        </button>

        <div
          className={cn(
            "flex items-center gap-3 rounded-2xl border border-border/30 bg-secondary/20 px-3 py-2.5",
            collapsed && "justify-center px-2",
          )}
        >
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue flex items-center justify-center text-primary-foreground text-xs font-semibold shrink-0">
            A
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs text-foreground truncate font-medium">Andrea Marino</p>
              <p className="text-xs text-muted-foreground truncate">andrea@forskale.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
