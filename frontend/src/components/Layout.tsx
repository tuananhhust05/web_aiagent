import { useState, useRef, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {
  Home,
  Users,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  FileText,
  BarChart3,
  Target,
  Mic,
  Mail,
  MessageCircle,
  Send,
  ChevronDown,
  ChevronUp,
  UserCheck,
  TrendingUp,
  Briefcase,
  FolderOpen,
  ArrowUpRight,
  Database,
  Search,
  MoreHorizontal,
  LogIn,
} from 'lucide-react'
import { cn } from '../lib/utils'

// Type definitions
interface NavigationItem {
  name: string;
  href: string;
  icon: any;
  hasSubmenu?: boolean;
  submenu?: NavigationItem[];
}

// Settings submenu items
const settingsNavigation: NavigationItem[] = [
  { name: 'Agent', href: '/agent', icon: Mic },
  { name: 'RAG', href: '/ragclient', icon: FileText },
]

// More Functions submenu items
const moreFunctionsNavigation: NavigationItem[] = [
  { name: 'Calls Dashboard', href: '/calls-dashboard', icon: BarChart3 },
  { name: 'Email Marketing', href: '/emails', icon: Mail },
  { name: 'Email Login', href: '/email-login', icon: Mail },
  { name: 'Latest Mail', href: '/latest-mail', icon: Mail },
  { name: 'WhatsApp Chatbot', href: '/whatsapp', icon: MessageCircle },
  { name: 'WhatsApp Login', href: '/whatsapp-login', icon: LogIn },
  { name: 'Telegram Campaigns', href: '/telegram', icon: Send },
  { name: 'Telegram Login', href: '/telegram-login', icon: LogIn },
]

// New main navigation for sidebar
const mainNavigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/', icon: Home },
  { name: 'Marketing Campaign', href: '/campaigns', icon: Target },
  { name: 'Leads / Contacts', href: '/contacts', icon: Users },
  { name: 'Conversion Activities', href: '/convention-activities', icon: TrendingUp },
  { name: 'Deals', href: '/deals', icon: Briefcase },
  { name: 'CSM', href: '/csm', icon: FolderOpen },
  { name: 'Renewals', href: '/renewals', icon: UserCheck },
  { name: 'Up / Cross Sell', href: '/upsell', icon: ArrowUpRight },
  { name: 'Marketing Data', href: '/marketing-data', icon: Database },
]

// Main dropdown navigation (simplified)
const dropdownNavigation: NavigationItem[] = [
  { name: 'Settings', href: '#', icon: Settings, hasSubmenu: true, submenu: settingsNavigation },
  { name: 'More Functions', href: '#', icon: MoreHorizontal, hasSubmenu: true, submenu: moreFunctionsNavigation },
  { name: 'Profile', href: '/profile', icon: User },
]

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [settingsSubmenuOpen, setSettingsSubmenuOpen] = useState(false)
  const [moreFunctionsSubmenuOpen, setMoreFunctionsSubmenuOpen] = useState(false)
  const location = useLocation()
  const { user, signOut } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Handle click outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        console.log('Click outside dropdown detected')
        setDropdownOpen(false)
        setSettingsSubmenuOpen(false)
        setMoreFunctionsSubmenuOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  return (
    <div className="min-h-screen bg-gray-50 scrollbar-modern">
      {/* Mobile sidebar */}
      <div
        className={cn(
          'fixed inset-0 z-50 lg:hidden',
          sidebarOpen ? 'block' : 'hidden'
        )}
      >
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-black border-r border-gray-700 scrollbar-glass">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-bold text-white">4Skale</h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {mainNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5',
                      isActive ? 'text-white' : 'text-gray-400'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-700 p-4">
            <div className="text-xs text-gray-400 text-center">v2.5.0</div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-black border-r border-gray-700 scrollbar-glass">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-bold text-white">4Skale</h1>
          </div>
          <nav className="flex-1 space-y-1 px-2 py-4 overflow-y-auto">
            {mainNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    'group flex items-center px-3 py-2 text-sm font-medium rounded-md',
                    isActive
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <item.icon
                    className={cn(
                      'mr-3 h-5 w-5',
                      isActive ? 'text-white' : 'text-gray-400'
                    )}
                  />
                  {item.name}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-gray-700 p-4">
            <div className="text-xs text-gray-400 text-center">v2.5.0</div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 shadow-sm sm:px-6 lg:px-8">
          <div className="flex items-center gap-x-4">
            <button
              type="button"
              className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {/* Avatar Dropdown - Moved to right */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                <User className="h-4 w-4 text-white" />
              </div>
              <ChevronDown className="h-4 w-4" />
            </button>
            
            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div 
                ref={dropdownRef}
                className="absolute right-0 mt-2 w-64 bg-gray-800 rounded-md shadow-lg border border-gray-600 z-[60]"
              >
                <div className="p-4 border-b border-gray-600">
                  <p className="text-sm font-medium text-white">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                
                <div className="py-1">
                  {dropdownNavigation.map((item) => (
                    <div key={item.name}>
                      {item.hasSubmenu ? (
                        <div>
                          <button
                            onClick={() => {
                              if (item.name === 'Settings') {
                                console.log('Settings clicked, current state:', settingsSubmenuOpen)
                                setSettingsSubmenuOpen(!settingsSubmenuOpen)
                                setMoreFunctionsSubmenuOpen(false) // Close other submenu
                              } else if (item.name === 'More Functions') {
                                console.log('More Functions clicked, current state:', moreFunctionsSubmenuOpen)
                                setMoreFunctionsSubmenuOpen(!moreFunctionsSubmenuOpen)
                                setSettingsSubmenuOpen(false) // Close other submenu
                              }
                            }}
                            className="flex w-full items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                          >
                            <item.icon className="mr-3 h-4 w-4 text-gray-400" />
                            {item.name}
                            {((item.name === 'Settings' && settingsSubmenuOpen) || 
                              (item.name === 'More Functions' && moreFunctionsSubmenuOpen)) ? (
                              <ChevronUp className="ml-auto h-4 w-4" />
                            ) : (
                              <ChevronDown className="ml-auto h-4 w-4" />
                            )}
                          </button>
                          {((item.name === 'Settings' && settingsSubmenuOpen) || 
                            (item.name === 'More Functions' && moreFunctionsSubmenuOpen)) && (
                            <div className="bg-gray-800">
                              {item.submenu?.map((subItem) => (
                                <Link
                                  key={subItem.name}
                                  to={subItem.href}
                                  className="flex items-center px-8 py-2 text-sm text-gray-300 hover:bg-gray-700"
                                  onClick={() => {
                                    console.log('Submenu item clicked:', subItem.name)
                                    setDropdownOpen(false)
                                    setSettingsSubmenuOpen(false)
                                    setMoreFunctionsSubmenuOpen(false)
                                  }}
                                >
                                  <subItem.icon className="mr-3 h-4 w-4 text-gray-400" />
                                  {subItem.name}
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          to={item.href}
                          className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-800"
                          onClick={() => {
                            console.log('Profile clicked')
                            setDropdownOpen(false)
                          }}
                        >
                          <item.icon className="mr-3 h-4 w-4 text-gray-400" />
                          {item.name}
                        </Link>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="border-t border-gray-200 py-1">
                  <button
                    onClick={() => {
                      console.log('Sign out clicked')
                      setDropdownOpen(false)
                      signOut()
                    }}
                    className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="mr-3 h-4 w-4 text-gray-400" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <main className="py-6 scrollbar-modern">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
      
    </div>
  )
} 