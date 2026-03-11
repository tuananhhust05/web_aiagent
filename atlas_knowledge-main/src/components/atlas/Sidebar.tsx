import { useState } from 'react';
import {
  CalendarDays, Video, BarChart3, ClipboardCheck,
  HelpCircle, BookOpen, Radio, ChevronRight, UserPlus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { name: 'Meeting Intelligence', icon: CalendarDays, href: '#', active: false },
  { name: 'Meeting Insights', icon: Video, href: '#', active: false },
  { name: 'Performance', icon: BarChart3, href: '#', active: false },
  { name: 'Action Ready', icon: ClipboardCheck, href: '#', active: false },
  { name: 'Q&A Engine', icon: HelpCircle, href: '#', active: false },
  { name: 'Knowledge', icon: BookOpen, href: '#', active: true },
];

export const AtlasSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        'group/sidebar relative flex flex-col shrink-0 transition-all duration-300 ease-in-out h-screen',
        'bg-gradient-to-b from-sidebar-accent to-sidebar',
        collapsed ? 'w-[72px]' : 'w-60'
      )}
    >
      {/* Collapse toggle — visible on sidebar hover */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className={cn(
          'invisible group-hover/sidebar:visible',
          'absolute top-16 -right-4 z-50',
          'h-8 w-8 rounded-full bg-white flex items-center justify-center',
          'shadow-[0_2px_8px_rgba(0,0,0,0.15)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]',
          'transition-all duration-200 text-gray-600 hover:text-gray-900',
        )}
      >
        <ChevronRight
          className={cn('h-4 w-4 transition-transform duration-300', !collapsed && 'rotate-180')}
        />
      </button>

      {/* Logo Header */}
      <div className="flex items-center gap-3 px-4 py-5 shrink-0">
        <div
          className={cn(
            'h-16 w-16 shrink-0 rounded-2xl bg-gradient-to-br from-forskale-green via-forskale-teal to-forskale-blue',
            'flex items-center justify-center text-white font-bold text-lg',
            'drop-shadow-[0_0_14px_rgba(255,255,255,0.7)]'
          )}
        >
          FS
        </div>
        {!collapsed && (
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-bold tracking-wider uppercase text-sidebar-foreground">Atlas</span>
            <span className="text-xs text-sidebar-foreground/60">by ForSkale</span>
          </div>
        )}
      </div>

      {/* Gradient divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

      {/* Record Call CTA */}
      <div className="px-3 py-4">
        <button
          className={cn(
            'w-full flex items-center justify-center gap-2 rounded-2xl px-4 py-3 transition-all duration-300',
            'bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue',
            'text-white font-semibold text-sm',
            'shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)]',
            'hover:-translate-y-0.5 hover:shadow-[0_6px_16px_hsl(var(--forskale-green)/0.4)]'
          )}
        >
          <Radio className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Record Call</span>}
        </button>
      </div>

      {/* Gradient divider */}
      <div className="mx-4 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent mb-2" />

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.name}
              href={item.href}
              className={cn(
                'group relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors',
                item.active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/70 hover:bg-[hsl(var(--forskale-teal)/0.08)] hover:text-sidebar-foreground'
              )}
            >
              {item.active && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-gradient-to-b from-forskale-green to-forskale-teal" />
              )}
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && (
                <span className="truncate text-sm">{item.name}</span>
              )}
            </a>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-3">
        <div className="mx-1 h-px bg-gradient-to-r from-transparent via-sidebar-primary/20 to-transparent" />

        <button
          className={cn(
            'w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs',
            'text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <UserPlus className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Invite teammate</span>}
        </button>

        <div
          className={cn(
            'flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5',
            collapsed && 'justify-center px-2'
          )}
        >
          <div className="h-8 w-8 shrink-0 rounded-full bg-gradient-to-br from-forskale-green to-forskale-teal flex items-center justify-center text-white text-xs font-semibold">
            R
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-xs text-sidebar-foreground truncate font-medium">Rev Ops</p>
              <p className="text-xs text-sidebar-foreground/60 truncate">revops@forskale.com</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};

export default AtlasSidebar;
