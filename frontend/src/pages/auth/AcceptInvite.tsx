import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Lock, Mail, User, Building2, CheckCircle } from 'lucide-react'
import { companiesAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { useAuth } from '../../hooks/useAuth'

const acceptInviteSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm_password: z.string(),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
})

type AcceptInviteForm = z.infer<typeof acceptInviteSchema>

export default function AcceptInvite() {
  const { inviteToken } = useParams<{ inviteToken: string }>()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [inviteInfo, setInviteInfo] = useState<any>(null)
  const navigate = useNavigate()
  const { setUser } = useAuth()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteForm>({
    resolver: zodResolver(acceptInviteSchema),
  })

  useEffect(() => {
    // You could fetch invite info here if needed
    // For now, we'll just validate the token exists
    if (!inviteToken) {
      toast.error('Invalid invite link')
      navigate('/login')
    }
  }, [inviteToken, navigate])

  const onSubmit = async (data: AcceptInviteForm) => {
    if (!inviteToken) return

    setIsLoading(true)
    try {
      const response = await companiesAPI.acceptInvite(inviteToken, data.password)
      const { access_token, user } = response.data

      // Store auth data
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(user))
      setUser(user)

      toast.success('Welcome to the team! Your account has been created.')
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to accept invite')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-emerald-50/20 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20">
            <Mail className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-semibold text-gray-900 tracking-tight mb-3">
            Accept Invitation
          </h1>
          <p className="text-gray-600 leading-relaxed font-light">
            Create your account to join the company
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm text-blue-900 font-medium">
                    You've been invited to join a company
                  </p>
                  <p className="text-sm text-blue-700 mt-1">
                    Create your password to complete the setup
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('password')}
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                  placeholder="At least 8 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  {...register('confirm_password')}
                  className="w-full pl-12 pr-12 py-3.5 border-2 border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 font-light"
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.confirm_password && (
                <p className="mt-2 text-sm text-red-600">{errors.confirm_password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-emerald-500 text-white py-4 rounded-2xl font-semibold text-lg shadow-lg shadow-blue-600/30 hover:shadow-xl hover:shadow-blue-600/40 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <LoadingSpinner size="sm" />
              ) : (
                'Accept Invitation & Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}


