import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import GoogleAuthButton from '../../components/GoogleAuthButton'
import { decodeJWT } from '../../lib/utils'
import { authAPI } from '../../lib/api'

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function Login() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingToken, setIsProcessingToken] = useState(false)
  const { signIn, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  // Handle Google OAuth token from URL params
  useEffect(() => {
    const handleGoogleToken = async () => {
      const token = searchParams.get('token')
      const userId = searchParams.get('user_id')
      const isNew = searchParams.get('is_new') === 'true'
      const error = searchParams.get('error')

      // Handle OAuth error
      if (error) {
        toast.error('Google authentication failed')
        // Clean URL params
        navigate('/login', { replace: true })
        return
      }

      // Handle successful OAuth
      if (token && userId) {
        setIsProcessingToken(true)
        try {
          console.log('Processing Google OAuth token:', { token: token.substring(0, 20) + '...', userId, isNew })

          // Decode token to get user info
          const decodedToken = decodeJWT(token)
          console.log('Decoded token:', decodedToken)

          if (!decodedToken) {
            throw new Error('Invalid token format')
          }

          // Store token in localStorage
          localStorage.setItem('token', token)

          // Get user data from backend using new /auth/me endpoint
          const response = await authAPI.getMe()
          const userData = response.data
          console.log('Google OAuth - User Data:', userData)

          // Ensure backward compatibility by adding id field if _id exists
          if (userData._id && !userData.id) {
            userData.id = userData._id
          }

          // Store user data in localStorage
          localStorage.setItem('user', JSON.stringify(userData))

          // Refresh user data in auth context
          refreshUser()

          // Show success message
          if (isNew) {
            toast.success(`Welcome to AgentVoice, ${userData.first_name}!`)
          } else {
            toast.success(`Welcome back, ${userData.first_name}!`)
          }

          // Clean URL params and redirect to dashboard
          navigate('/dashboard', { replace: true })

        } catch (error: any) {
          console.error('Google OAuth token processing error:', error)
          toast.error('Failed to complete authentication')
          // Clean URL params
          navigate('/login', { replace: true })
        } finally {
          setIsProcessingToken(false)
        }
      }
    }

    handleGoogleToken()
  }, [searchParams, navigate, refreshUser])

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const { error } = await signIn(data.email, data.password)
      if (error) {
        toast.error(error.message || 'Login failed')
      } else {
        toast.success('Welcome back!')
        navigate('/')
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSuccess = (data: any) => {
    const { user, is_new_user } = data
    if (is_new_user) {
      toast.success(`Welcome to AgentVoice, ${user.first_name}!`)
      navigate('/onboarding')
    } else {
      toast.success(`Welcome back, ${user.first_name}!`)
      navigate('/dashboard')
    }
  }

  const handleGoogleError = (error: string) => {
    toast.error(error)
  }

  // Show loading state when processing Google OAuth token
  if (isProcessingToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Completing Authentication
          </h1>
          <p className="text-gray-600 mb-6">
            Please wait while we complete your Google authentication...
          </p>
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-gray-600 leading-relaxed">
            Sign in to your AgentVoice account to continue
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  {...register('email')}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  placeholder="Enter your email"
                />
              </div>
              {errors.email && (
                <p className="mt-2 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full pl-12 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">Remember me</span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn btn-primary btn-lg group"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  Sign In
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          {/* Social Login Buttons */}
          <div className="space-y-3">
            <GoogleAuthButton
              onSuccess={handleGoogleSuccess}
              onError={handleGoogleError}
              variant="login"
            />
          </div>
        </div>

        {/* Sign Up Link */}
        <div className="text-center mt-8">
          <p className="text-gray-600">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-primary-600 hover:text-primary-700 font-semibold transition-colors"
            >
              Sign up for free
            </Link>
          </p>
        </div>

        {/* Features Preview */}
        <div className="mt-12 grid grid-cols-1 gap-4">
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">AI-Powered Voice Agents</h3>
                <p className="text-sm text-gray-600">Natural conversations that convert</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Advanced Analytics</h3>
                <p className="text-sm text-gray-600">Track performance and optimize campaigns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 