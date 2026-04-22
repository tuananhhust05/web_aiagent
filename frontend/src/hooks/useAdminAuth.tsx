import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { api } from '@/lib/api'

interface AdminUser {
  id: string
  username: string
  email: string
  role: string
}

interface AdminAuthContextType {
  user: AdminUser | null
  token: string | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('admin_token')
    const storedUser = localStorage.getItem('admin_user')

    if (storedToken && storedUser) {
      setToken(storedToken)
      setUser(JSON.parse(storedUser))
      api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })

    if (response.data.access_token) {
      const userData: AdminUser = {
        id: response.data.user?.id || response.data.user?._id,
        username: response.data.user?.username || response.data.user?.first_name || 'Admin',
        email: response.data.user?.email || email,
        role: response.data.user?.role || 'USER',
      }

      setToken(response.data.access_token)
      setUser(userData)
      localStorage.setItem('admin_token', response.data.access_token)
      localStorage.setItem('admin_user', JSON.stringify(userData))
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access_token}`
    }
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_user')
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AdminAuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
