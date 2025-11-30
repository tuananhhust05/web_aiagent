import { useState, useEffect } from 'react'
import { emailsAPI } from '../lib/api'
import { CheckCircle2, Mail, Loader2, Eye, EyeOff } from 'lucide-react'

const EmailLogin = () => {
  const [email, setEmail] = useState('')
  const [appPassword, setAppPassword] = useState('')
  const [fromName, setFromName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingCredentials, setLoadingCredentials] = useState(true)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [existingCredentials, setExistingCredentials] = useState<{ email: string; from_name?: string } | null>(null)

  useEffect(() => {
    loadExistingCredentials()
  }, [])

  const loadExistingCredentials = async () => {
    setLoadingCredentials(true)
    try {
      const response = await emailsAPI.getCredentials()
      if (response.data) {
        setExistingCredentials({ 
          email: response.data.email,
          from_name: response.data.from_name 
        })
        setEmail(response.data.email)
        setFromName(response.data.from_name || '')
        console.log('✅ Loaded existing credentials:', {
          email: response.data.email,
          from_name: response.data.from_name
        })
      }
    } catch (error: any) {
      // If 404, no credentials exist yet - that's fine
      if (error.response?.status !== 404) {
        console.error('Failed to load existing credentials', error)
      } else {
        console.log('No existing credentials found - user needs to configure')
      }
    } finally {
      setLoadingCredentials(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    if (!email || !appPassword) {
      setError('Please fill in both email and app password')
      setLoading(false)
      return
    }

    try {
      await emailsAPI.saveCredentials({
        email: email.trim(),
        app_password: appPassword,
        from_name: fromName.trim() || undefined
      })
      setSaved(true)
      setExistingCredentials({ 
        email: email.trim(),
        from_name: fromName.trim() || undefined
      })
      // Clear password field after saving
      setAppPassword('')
      setTimeout(() => setSaved(false), 3000)
    } catch (error: any) {
      console.error('Failed to save email credentials', error)
      setError(error?.response?.data?.detail || 'Failed to save credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingCredentials) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
          <div className="flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-500">Loading email configuration...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Email Login</h1>
            <p className="text-sm text-gray-500">
              {existingCredentials 
                ? 'Update your email configuration' 
                : 'Enter your email and app password to configure email sending'}
            </p>
          </div>

          {existingCredentials && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              <div>
                <span>Current configuration: <strong>{existingCredentials.email}</strong></span>
                {existingCredentials.from_name && (
                  <span className="block text-xs mt-1">From Name: <strong>{existingCredentials.from_name}</strong></span>
                )}
                <span className="block text-xs mt-1 text-emerald-600">
                  Enter your app password below to update credentials
                </span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@example.com"
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="fromName" className="block text-sm font-medium text-gray-700 mb-1">
                From Name <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <input
                id="fromName"
                type="text"
                value={fromName}
                onChange={(e) => setFromName(e.target.value)}
                placeholder="Your Name or Company Name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                This name will appear as the sender name in recipient's inbox
              </p>
            </div>

            <div>
              <label htmlFor="appPassword" className="block text-sm font-medium text-gray-700 mb-1">
                App Password
              </label>
              <div className="relative">
                <input
                  id="appPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={appPassword}
                  onChange={(e) => setAppPassword(e.target.value)}
                  placeholder="Enter your app password"
                  required
                  className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                For Gmail, generate an app password from your Google Account settings.{' '}
                <a 
                  href="https://support.google.com/mail/answer/185833?hl=en" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 underline hover:text-blue-700 font-medium"
                >
                  📖 Guide to get App Password
                </a>
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {saved && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                <span>Credentials saved successfully!</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Saving...
                </>
              ) : (
                existingCredentials ? 'Update Credentials' : 'Save Credentials'
              )}
            </button>
          </form>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-xs text-blue-800">
            <p className="font-semibold mb-2">Note:</p>
            <ul className="list-disc list-inside space-y-1 text-blue-700">
              <li>Your credentials are securely stored and encrypted</li>
              <li>For Gmail, use an app password (not your regular password)</li>
              <li>You can update your credentials at any time</li>
            </ul>
            <p className="mt-2 text-blue-700">
              <a 
                href="https://support.google.com/mail/answer/185833?hl=en" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 font-medium"
              >
                📖 Guide to get Gmail App Password
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailLogin

