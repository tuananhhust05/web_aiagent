import { useState, useRef, useEffect } from 'react'
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  PhoneCall,
  BarChart3,
  ClipboardCheck,
  BookOpen,
  Radio as RadioIcon,
  HelpCircle,
  User,
  ChevronDown,
  LogOut,
  FileText,
  Calendar,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

/** Settings menu items in the avatar dropdown */
const settingsMenuItems = [
  { label: 'Profile', href: '/profile', icon: User },
  { label: 'Edit Sales Playbook', href: '/atlas/playbooks', icon: FileText },
  { label: 'Meetings', href: '/meetings', icon: Calendar },
  { label: 'Dashboard', href: '/', icon: BarChart3 },
] as const

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
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dropdownOpen])

  const handleSignOut = () => {
    setDropdownOpen(false)
    signOut()
    navigate('/login')
  }

  const displayName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'User'
  const initial = (user?.first_name?.[0] || user?.email?.[0] || 'U').toUpperCase()

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

      <div className="flex-1 bg-[#f5f5f7] overflow-hidden min-w-0 flex flex-col">
        <header className="shrink-0 h-14 px-6 flex items-center justify-end border-b border-gray-200 bg-white/80">
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-[#0B1220] flex items-center justify-center text-white text-sm font-medium">
                  {initial}
                </div>
              )}
              <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <p className="px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">Settings</p>
                  {settingsMenuItems.map(({ label, href, icon: Icon }) => (
                    <Link
                      key={label}
                      to={href}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <Icon className="h-4 w-4 text-gray-400 shrink-0" />
                      {label}
                    </Link>
                  ))}
                </div>
                <div className="border-t border-gray-100 pt-1">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <LogOut className="h-4 w-4 text-gray-400 shrink-0" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="flex-1 overflow-hidden min-w-0">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
