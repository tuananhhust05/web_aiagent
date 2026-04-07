import { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '../lib/api'
import { setCookie, deleteCookie } from '../lib/cookies'

interface User {
  _id: string
  id?: string // For backward compatibility
  email: string
  username: string
  first_name: string
  last_name: string
  company_name?: string
  company_id?: string  // Company ID for company features
  industry?: string
  tone?: string
  language: string
  phone?: string
  role: string
  workspace_role?: string  // "owner" | "member"
  is_active: boolean
  is_verified: boolean
  gdpr_consent: boolean
  terms_accepted: boolean
  created_at: string
  updated_at: string
  google_id?: string
  avatar_url?: string
  auth_provider?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (userData: any) => Promise<{ error: any }>
  register: (userData: any) => Promise<{ error: any }>
  login: (userData: User, token: string) => void
  signOut: () => void
  updateUser: (userData: User) => void
  resetPassword: (email: string) => Promise<{ error: any }>
  updatePassword: (current_password: string, new_password: string) => Promise<{ error: any }>
  refreshUser: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored auth data on app load
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        // Ensure backward compatibility by adding id field if _id exists
        if (userData._id && !userData.id) {
          userData.id = userData._id
        }
        setUser(userData)
        // Set is_login cookie if user is authenticated
        setCookie('is_login', '1', 365)
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        deleteCookie('is_login')
      }
    } else {
      // No valid authentication, ensure cookie is deleted
      deleteCookie('is_login')
    }
    
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string) => {
    try {
      const response = await authAPI.login({ email, password })
      const { access_token, user: userData } = response.data
      
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
      // Set is_login cookie on successful login
      setCookie('is_login', '1', 365)
      return { error: null }
    } catch (error: any) {
      // Extract the backend detail message so the UI can display a meaningful error
      const detail = error.response?.data?.detail
      const message = typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: any) => d.msg || d).join(', ')
          : error.message || 'Login failed'
      return { error: { ...error, message } }
    }
  }

  const signUp = async (userData: any) => {
    try {
      const response = await authAPI.register(userData)
      const { access_token, user: newUser } = response.data
      
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)
      // Set is_login cookie on successful registration
      setCookie('is_login', '1', 365)
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const signOut = () => {
    localStorage.clear()
    // Delete is_login cookie
    deleteCookie('is_login')
    // Clear all other cookies
    document.cookie.split(';').forEach((c) => {
      const name = c.trim().split('=')[0]
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
    })
    setUser(null)
  }

  const resetPassword = async (email: string) => {
    try {
      await authAPI.forgotPassword(email)
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const updateUser = (userData: User) => {
    setUser(userData)
    localStorage.setItem('user', JSON.stringify(userData))
  }

  const updatePassword = async (current_password: string, new_password: string) => {
    try {
      await authAPI.changePassword({ current_password, new_password })
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
    // Set is_login cookie on login
    setCookie('is_login', '1', 365)
  }

  const refreshUser = () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (token && storedUser) {
      try {
        const userData = JSON.parse(storedUser)
        // Ensure backward compatibility by adding id field if _id exists
        if (userData._id && !userData.id) {
          userData.id = userData._id
        }
        setUser(userData)
        // Set is_login cookie when refreshing user
        setCookie('is_login', '1', 365)
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        deleteCookie('is_login')
        setUser(null)
      }
    } else {
      deleteCookie('is_login')
      setUser(null)
    }
  }

  const value = {
    user,
    loading,
    signIn,
    signUp,
    register: signUp, // Alias for backward compatibility
    login,
    signOut,
    updateUser,
    resetPassword,
    updatePassword,
    refreshUser,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 