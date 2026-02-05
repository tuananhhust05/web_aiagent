import { Outlet, NavLink } from 'react-router-dom'
import {
  CalendarDays,
  PhoneCall,
  BarChart3,
  ClipboardCheck,
  BookOpen,
  Radio as RadioIcon,
  HelpCircle,
} from 'lucide-react'

const navItems = [
  { to: '/atlas/calendar', icon: CalendarDays, label: 'Calendar' },
  { to: '/atlas/calls', icon: PhoneCall, label: 'Call History' },
  { to: '/atlas/insights', icon: BarChart3, label: 'Insights' },
  { to: '/atlas/todo', icon: ClipboardCheck, label: 'To Do Ready' },
  { to: '/atlas/qna', icon: HelpCircle, label: 'Rolling Q&A' },
  { to: '/atlas/knowledge', icon: BookOpen, label: 'Knowledge' },
  { to: '/atlas/record', icon: RadioIcon, label: 'Record' },
] as const

export default function AtlasLayout() {
  return (
    <div className="flex w-screen h-screen bg-gray-50 overflow-hidden">
      <aside className="w-64 bg-[#0B1220] text-white flex flex-col shrink-0">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="text-xs uppercase tracking-widest text-blue-300 mb-1">Atlas</div>
          <div className="text-sm text-blue-100">by ForSkale</div>
        </div>

        <nav className="flex-1 py-4 space-y-1 text-sm">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `w-full flex items-center gap-2 px-5 py-2.5 text-left hover:bg-white/5 ${
                  isActive ? 'bg-white/10 text-white' : 'text-gray-300'
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-white/10 text-[11px] text-gray-400">
          v2.1.0
        </div>
      </aside>

      <div className="flex-1 bg-[#f5f5f7] overflow-hidden min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
