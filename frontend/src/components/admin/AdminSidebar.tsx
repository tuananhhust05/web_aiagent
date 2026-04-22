import { useState } from 'react'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Users, 
  ShieldCheck, 
  RefreshCw, 
  KeyRound, 
  FileSearch, 
  ClipboardCheck, 
  FileBarChart,
  Lock,
  Eye,
} from 'lucide-react'

export type AdminPage = 'dashboard' | 'users' | 'roles' | 'lifecycle' | 'mfa' | 'access_review' | 'audit' | 'iso' | 'reports'

interface NavItem {
  id: AdminPage
  label: string
  icon: React.ElementType
  color: string
}

const CORE_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#185FA5' },
  { id: 'users', label: 'Users & Accounts', icon: Users, color: '#639922' },
  { id: 'roles', label: 'Roles & Permissions', icon: ShieldCheck, color: '#7F77DD' },
  { id: 'lifecycle', label: 'Lifecycle', icon: RefreshCw, color: '#EF9F27' },
]

const SECURITY_ITEMS: NavItem[] = [
  { id: 'mfa', label: 'MFA & Auth Policy', icon: KeyRound, color: '#D85A30' },
  { id: 'access_review', label: 'Access Reviews', icon: ClipboardCheck, color: '#1D9E75' },
  { id: 'audit', label: 'Audit Logs', icon: Eye, color: '#D4537E' },
]

const COMPLIANCE_ITEMS: NavItem[] = [
  { id: 'iso', label: 'ISO 27001 Coverage', icon: Lock, color: '#533AB7' },
  { id: 'reports', label: 'Reports & Evidence', icon: FileBarChart, color: '#888780' },
]

const PAGE_TITLES: Record<AdminPage, string> = {
  dashboard: 'Dashboard',
  users: 'Users & Accounts',
  roles: 'Roles & Permissions',
  lifecycle: 'Lifecycle Management',
  mfa: 'MFA & Authentication Policy',
  access_review: 'Access Reviews',
  audit: 'Audit Logs',
  iso: 'ISO 27001 Coverage',
  reports: 'Reports & Evidence',
}

interface AdminSidebarProps {
  activePage: AdminPage
  onPageChange: (page: AdminPage) => void
}

export default function AdminSidebar({ activePage, onPageChange }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)

  const NavSection = ({ title, items }: { title: string; items: NavItem[] }) => (
    <div className="px-3 py-2">
      <div className="px-3 py-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">{title}</div>
      {items.map((item) => {
        const Icon = item.icon
        const isActive = activePage === item.id
        return (
          <button
            key={item.id}
            onClick={() => onPageChange(item.id)}
            className={cn(
              'flex w-full items-center gap-2.5 rounded-md px-3 py-[7px] mt-0.5 text-sm transition-all',
              isActive 
                ? 'bg-white/90 text-gray-900 font-medium shadow-sm border border-gray-200' 
                : 'text-gray-600 hover:bg-white/50 hover:text-gray-900'
            )}
          >
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0" 
              style={{ backgroundColor: isActive ? item.color : `${item.color}80` }} 
            />
            {!collapsed && <span>{item.label}</span>}
          </button>
        )
      })}
    </div>
  )

  return (
    <aside 
      className={cn(
        'flex flex-col h-full bg-gray-50 border-r border-gray-200 transition-all duration-200',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      <div className="px-4 py-4 border-b border-gray-200">
        {!collapsed && (
          <>
            <h1 className="text-sm font-medium text-gray-900">IAM Portal</h1>
            <p className="text-[11px] text-gray-500 mt-0.5">ISO/IEC 27001 Compliant</p>
          </>
        )}
        {collapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">IAM</div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <NavSection title="Core" items={CORE_ITEMS} />
        <div className="h-px bg-gray-200 mx-3 my-2" />
        <NavSection title="Security" items={SECURITY_ITEMS} />
        <div className="h-px bg-gray-200 mx-3 my-2" />
        <NavSection title="Compliance" items={COMPLIANCE_ITEMS} />
      </div>

      <div className="px-3 py-2 border-t border-gray-200">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-white/50 hover:text-gray-700 transition-all"
        >
          <div className={cn('flex-shrink-0', collapsed ? 'rotate-180' : '')}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </div>
          {!collapsed && <span className="text-xs">Collapse</span>}
        </button>
      </div>
    </aside>
  )
}

export { PAGE_TITLES }