import { ReactNode, useEffect } from 'react'
import { useAdminAuth } from '@/hooks/useAdminAuth'
import { useNavigate, useLocation } from 'react-router-dom'
import { Shield, Users, FileText, Key, ShieldCheck, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface AdminLayoutProps {
  children: ReactNode
}

const navItems = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: Shield },
  { path: '/admin/users', label: 'Users', icon: Users },
  { path: '/admin/audit', label: 'Audit Logs', icon: FileText },
  { path: '/admin/policy', label: 'Password Policy', icon: Key },
  { path: '/admin/reviews', label: 'Access Reviews', icon: ShieldCheck },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, logout } = useAdminAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (!loading && !user && location.pathname !== '/admin/login') {
      navigate('/admin/login', { replace: true })
    }
  }, [loading, user, navigate, location.pathname])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const isActive = (path: string) => location.pathname === path

  const handleLogout = () => {
    logout()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-screen flex bg-slate-950">
      <aside className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">IAM Admin</h1>
              <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
                ISO 27001
              </Badge>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 mb-4 px-4">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">
                {user?.username || 'Admin'}
              </p>
              <p className="text-xs text-slate-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
