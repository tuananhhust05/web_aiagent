import React, { useEffect, useState } from 'react'
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

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error) {
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

        // Exchange code for token
        const response = await authAPI.googleCallback({ code, state: state || undefined })
        const { access_token, user: userData, is_new_user } = response.data

        // Store authentication data
        localStorage.setItem('token', access_token)
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.removeItem('google_oauth_state')

        // Update auth context
        login(userData, access_token)

        setUser(userData)
        setStatus('success')
        setMessage(is_new_user ? 'Account created successfully!' : 'Welcome back!')

        // Redirect after delay to Atlas
        setTimeout(() => {
          navigate('/atlas/calls')
        }, 1500)

      } catch (error: any) {
        console.error('Google callback error:', error)
        setStatus('error')
        setMessage(error.response?.data?.detail || 'Authentication failed')

        // Redirect to login after delay
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
