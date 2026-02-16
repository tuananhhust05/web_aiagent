import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { authAPI } from '../../lib/api'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [user, setUser] = useState<any>(null)
  const processedRef = useRef(false)

  useEffect(() => {
    const code = searchParams.get('code')
    const errorParam = searchParams.get('error')
    // Guard: only one execution (avoids double call from React StrictMode or re-mount)
    if (processedRef.current) return
    processedRef.current = true

    const handleCallback = async () => {
      try {
        const state = searchParams.get('state')

        if (errorParam) {
          setStatus('error')
          setMessage('Authentication was cancelled or failed')
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('No authorization code received')
          return
        }

        // Verify state parameter
        const storedState = localStorage.getItem('google_oauth_state')
        if (state && storedState && state !== storedState) {
          setStatus('error')
          setMessage('Invalid state parameter')
          return
        }

        // Exchange code for token (only once; ref prevents double call from StrictMode/re-mount)
        const response = await authAPI.googleCallback({ code, state: state || undefined })
        const { access_token, user: userData, is_new_user, needs_profile_completion } = response.data

        // Store authentication data
        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.removeItem('google_oauth_state')

        // Update auth context
        login(userData, access_token)

        setUser(userData)
        setStatus('success')
        setMessage(is_new_user ? 'Account created successfully!' : 'Welcome back!')

        // Needs profile completion → go to welcome (chime + tour) then supplement-profile
        if (needs_profile_completion) {
          setTimeout(() => {
            navigate(`/auth/welcome?is_new=${is_new_user}`, { replace: true })
          }, 1200)
        } else {
          setTimeout(() => {
            navigate('/atlas/calendar')
          }, 1500)
        }

      } catch (error: any) {
        const detail = error.response?.data?.detail ?? ''
        const isInvalidGrant = typeof detail === 'string' && detail.includes('invalid_grant')

        // Code already used (e.g. double call): if we already have token/user from first call, treat as success
        if (isInvalidGrant) {
          const token = localStorage.getItem('token')
          const storedUser = localStorage.getItem('user')
          if (token && storedUser) {
            try {
              const userData = JSON.parse(storedUser)
              if (userData._id && !userData.id) userData.id = userData._id
              login(userData, token)
              setUser(userData)
              setStatus('success')
              setMessage('Welcome!')
              const needsProfile = !userData.terms_accepted || !userData.gdpr_consent
              setTimeout(() => {
                if (needsProfile) {
                  navigate(`/auth/welcome?is_new=${!!userData.google_id}`, { replace: true })
                } else {
                  navigate('/atlas/calendar', { replace: true })
                }
              }, 800)
              return
            } catch (_) {}
          }
        }

        processedRef.current = true
        console.error('Google callback error:', error)
        setStatus('error')
        setMessage(typeof detail === 'string' ? detail : 'Authentication failed')

        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams, navigate, login])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Completing Authentication
            </h2>
            <p className="text-gray-600">
              Please wait while we complete your Google authentication...
            </p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Successful!
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            {user && (
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-3">
                  {user.avatar_url && (
                    <img
                      src={user.avatar_url}
                      alt={user.first_name}
                      className="h-10 w-10 rounded-full"
                    />
                  )}
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {user.first_name} {user.last_name}
                    </p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                </div>
              </div>
            )}
            <p className="text-sm text-gray-500">
              Redirecting you to the dashboard...
            </p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Authentication Failed
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <p className="text-sm text-gray-500">
              Redirecting you to the login page...
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default GoogleCallback
