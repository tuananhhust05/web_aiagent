import { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '../lib/api'

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
  updatePassword: (password: string) => Promise<{ error: any }>
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
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
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
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const signUp = async (userData: any) => {
    try {
      const response = await authAPI.register(userData)
      const { access_token, user: newUser } = response.data
      
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(newUser))
      setUser(newUser)
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const signOut = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
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

  const updatePassword = async (password: string) => {
    try {
      await authAPI.changePassword({ current_password: '', new_password: password })
      return { error: null }
    } catch (error: any) {
      return { error }
    }
  }

  const login = (userData: User, token: string) => {
    localStorage.setItem('token', token)
    localStorage.setItem('user', JSON.stringify(userData))
    setUser(userData)
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
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        setUser(null)
      }
    } else {
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