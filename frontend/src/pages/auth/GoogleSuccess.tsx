import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'react-hot-toast'

const GoogleSuccess: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleSuccess = async () => {
      try {
        const token = searchParams.get('token')
        const userId = searchParams.get('user_id')
        const isNew = searchParams.get('is_new') === 'true'

        console.log('Google Success - Token:', token ? 'Present' : 'Missing')
        console.log('Google Success - User ID:', userId)
        console.log('Google Success - Is New:', isNew)

        if (!token || !userId) {
          setStatus('error')
          setMessage('Invalid authentication response')
          return
        }

        // Store token
        localStorage.setItem('token', token)

        // Get user data from backend
        const response = await fetch(`https://forskale.com:8000/api/users/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Failed to get user data')
        }

        const userData = await response.json()
        console.log('Google Success - User Data:', userData)

        // Update auth context
        login(userData, token)

        setStatus('success')
        setMessage(isNew ? 'Account created successfully!' : 'Welcome back!')

        // Show success toast
        if (isNew) {
          toast.success(`Welcome to For Skale, ${userData.first_name}!`)
        } else {
          toast.success(`Welcome back, ${userData.first_name}!`)
        }

        // Redirect after delay to Atlas
        setTimeout(() => {
          navigate('/atlas/calls')
        }, 1500)

      } catch (error: any) {
        console.error('Google success error:', error)
        setStatus('error')
        setMessage('Failed to complete authentication')
        
        toast.error('Authentication failed')
        
        // Redirect to login after delay
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      }
    }

    handleSuccess()
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

export default GoogleSuccess
