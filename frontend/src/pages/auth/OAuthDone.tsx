import { useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { decodeJWT } from '../../lib/utils'
import { authAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'
import { Sparkles } from 'lucide-react'

/**
 * Dedicated OAuth landing page. Backend redirects here with ?token=...&user_id=...&needs_profile=...&is_new=...
 * This route is registered in BOTH unauthenticated and authenticated branches so it always runs
 * and processes the token before any other redirect logic.
 */
export default function OAuthDone() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { refreshUser } = useAuth()
  const processed = useRef(false)

  useEffect(() => {
    if (processed.current) return
    const token = searchParams.get('token')
    const userId = searchParams.get('user_id')
    const isNew = searchParams.get('is_new') === 'true'
    const needsProfile = searchParams.get('needs_profile') === 'true'
    const error = searchParams.get('error')

    if (error) {
      processed.current = true
      toast.error('Google authentication failed')
      navigate('/login', { replace: true })
      return
    }

    if (!token || !userId) {
      processed.current = true
      navigate('/login', { replace: true })
      return
    }

    processed.current = true
    const run = async () => {
      try {
        const decoded = decodeJWT(token)
        if (!decoded) {
          throw new Error('Invalid token')
        }
        localStorage.setItem('token', token)
        const response = await authAPI.getMe()
        const userData = response.data
        if (userData._id && !userData.id) userData.id = userData._id
        localStorage.setItem('user', JSON.stringify(userData))
        refreshUser()

        // Bất kể lần đăng nhập thứ mấy: nếu chưa đủ thông tin (terms/gdpr) thì luôn qua welcome → supplement-profile
        const needsProfileFromUser = !userData.terms_accepted || !userData.gdpr_consent
        const mustCompleteProfile = needsProfile === true || needsProfileFromUser

        if (mustCompleteProfile) {
          navigate(`/auth/welcome?is_new=${isNew}`, { replace: true })
          return
        }
        if (isNew) {
          toast.success(`Welcome to Atlas, ${userData.first_name || 'there'}!`)
        } else {
          toast.success(`Welcome back, ${userData.first_name || 'there'}!`)
        }
        navigate('/atlas/calendar', { replace: true })
      } catch (e: any) {
        console.error('OAuth done error:', e)
        toast.error('Failed to complete sign-in')
        navigate('/login', { replace: true })
      }
    }
    run()
  }, [searchParams, navigate, refreshUser])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-white to-emerald-50/20 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/20">
          <Sparkles className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Completing sign-in</h1>
        <p className="text-gray-600 font-light mb-6">Taking you to Atlas...</p>
        <LoadingSpinner size="lg" />
      </div>
    </div>
  )
}
