import { useEffect, useMemo, useState } from 'react'
import { telegramAPI } from '../lib/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { CheckCircle2, Loader2, Info, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

const TelegramLogin = () => {
  const { user } = useAuth()
  const userId = useMemo(() => user?.id || (user as any)?._id || '', [user])

  const [profileStatus, setProfileStatus] = useState<RequestStatus>('idle')
  const [loginStatus, setLoginStatus] = useState<RequestStatus>('idle')
  const [apiId, setApiId] = useState('')
  const [apiHash, setApiHash] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [configMessage, setConfigMessage] = useState<string | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)
  const [isVerified, setIsVerified] = useState(false)
  const [otpCode, setOtpCode] = useState('')
  const [otpMessage, setOtpMessage] = useState<string | null>(null)
  const [otpError, setOtpError] = useState<string | null>(null)
  const [otpRequesting, setOtpRequesting] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)

  useEffect(() => {
    if (!userId) {
      resetState()
      return
    }
    resetState()
    createProfile()
    fetchAppConfig()
  }, [userId])

  const resetState = () => {
    setProfileStatus('idle')
    setLoginStatus('idle')
  }

  const createProfile = async () => {
    if (!userId) return
    setProfileStatus('loading')
    try {
      await telegramAPI.createLoginProfile()
      setProfileStatus('success')
    } catch (error: any) {
      console.error('Failed to create Telegram profile', error)
      setProfileStatus('error')
    }
  }

  const fetchAppConfig = async () => {
    if (!userId) return
    setConfigLoading(true)
    setConfigError(null)
    try {
      const { data } = await telegramAPI.getAppConfig()
      setApiId(data?.api_id || '')
      setApiHash(data?.api_hash || '')
      setPhoneNumber(data?.phone_number || '')
      setIsVerified(Boolean(data?.is_verified))
    } catch (error: any) {
      console.error('Failed to fetch Telegram app config', error)
      setConfigError('Failed to load saved Telegram App credentials.')
    } finally {
      setConfigLoading(false)
    }
  }

  const handleSaveConfig = async () => {
    if (!apiId.trim() || !apiHash.trim()) {
      setConfigError('Please provide both api_id and api_hash.')
      return
    }

    setConfigSaving(true)
    setConfigError(null)
    setConfigMessage(null)
    try {
      const { data } = await telegramAPI.saveAppConfig({
        api_id: apiId.trim(),
        api_hash: apiHash.trim(),
        phone_number: phoneNumber.trim(),
      })
      setPhoneNumber(data?.phone_number || phoneNumber.trim())
      setIsVerified(Boolean(data?.is_verified))
      setConfigMessage('Telegram App credentials saved successfully.')
    } catch (error: any) {
      console.error('Failed to save Telegram app config', error)
      setConfigError(error?.response?.data?.detail || 'Failed to save Telegram App credentials.')
    } finally {
      setConfigSaving(false)
    }
  }

  const handleRequestOtp = async () => {
    if (!phoneNumber.trim()) {
      setOtpError('Please enter your Telegram phone number (include country code).')
      return
    }
    setOtpRequesting(true)
    setOtpError(null)
    setOtpMessage(null)
    try {
      await telegramAPI.requestOtp({ phone_number: phoneNumber.trim() })
      setOtpMessage('OTP sent to your Telegram app. Please enter the code below.')
      setIsVerified(false)
    } catch (error: any) {
      console.error('Failed to request Telegram OTP', error)
      setOtpError(error?.response?.data?.detail || 'Failed to request OTP.')
    } finally {
      setOtpRequesting(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      setOtpError('Please enter the OTP code you received.')
      return
    }
    setOtpVerifying(true)
    setOtpError(null)
    setOtpMessage(null)
    try {
      await telegramAPI.verifyOtp({ code: otpCode.trim() })
      setOtpMessage('Telegram session verified successfully.')
      setIsVerified(true)
      setOtpCode('')
    } catch (error: any) {
      console.error('Failed to verify Telegram OTP', error)
      setOtpError(error?.response?.data?.detail || 'Failed to verify OTP.')
    } finally {
      setOtpVerifying(false)
    }
  }

  const handleLogin = async () => {
    if (!userId || loginStatus === 'loading') return
    setLoginStatus('loading')
    try {
      await telegramAPI.login()
      setLoginStatus('success')
    } catch (error) {
      console.error('Failed to login Telegram', error)
      setLoginStatus('error')
    }
  }

  const canLogin = profileStatus === 'success' && !!userId && isVerified

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-blue-600 uppercase tracking-[0.2em]">Telegram</p>
            <h1 className="text-xl font-bold text-gray-900">Telegram Login Connector</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500">User ID</p>
              <p className="font-mono text-xs text-gray-900">
                {userId || 'Loading...'}
              </p>
            </div>
            <button
              onClick={handleLogin}
              disabled={!canLogin || loginStatus === 'loading'}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-sky-600 px-6 py-2 text-sm font-semibold text-white shadow-md hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-60 transition"
            >
              {!userId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Waiting...
                </>
              ) : loginStatus === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-3 space-y-3">
          <div className="flex items-center gap-3 text-xs">
            {!userId && (
              <>
                <LoadingSpinner size="sm" className="text-blue-600" />
                <span className="text-gray-600">Fetching user_id...</span>
              </>
            )}
            {profileStatus === 'loading' && (
              <>
                <LoadingSpinner size="sm" className="text-blue-600" />
                <span className="text-gray-600">Creating profile...</span>
              </>
            )}
            {profileStatus === 'success' && (
              <>
                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                <span className="text-emerald-600">Profile ready</span>
              </>
            )}
            {profileStatus === 'error' && (
              <>
                <AlertCircle className="h-3 w-3 text-red-500" />
                <span className="text-red-600">Profile creation failed</span>
              </>
            )}
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3 text-xs">
            <Info className="h-4 w-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-blue-800">
              <p className="font-semibold">Login Instructions:</p>
              <ul className="list-disc list-inside space-y-0.5 text-blue-700">
                <li>Enter your Telegram App API credentials (api_id and api_hash) and save them.</li>
                <li>Enter your Telegram phone number (with country code) and request an OTP.</li>
                <li>Enter the OTP code you receive in your Telegram app to verify and establish a session.</li>
                <li>Once verified, you can <strong>proceed to create campaigns</strong> and send messages using the session.</li>
              </ul>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Telegram App Credentials</p>
                <p className="text-xs text-gray-500">
                  Provide your Telegram App API ID, API Hash, and Telegram phone number (with country code).
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  <a 
                    href="https://core-telegram-org.translate.goog/api/obtaining_api_id?_x_tr_sl=en&_x_tr_tl=vi&_x_tr_hl=vi&_x_tr_pto=tc" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="underline hover:text-blue-700 font-medium"
                  >
                    📖 Guide to get App ID and App Hash
                  </a>
                </p>
              </div>
              {configLoading && (
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <LoadingSpinner size="sm" className="text-blue-600" />
                  Loading...
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Telegram App api_id</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition"
                  placeholder="Enter your api_id"
                  value={apiId}
                  onChange={(e) => setApiId(e.target.value)}
                  disabled={configSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Telegram App api_hash</label>
                <input
                  type="password"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition"
                  placeholder="Enter your api_hash"
                  value={apiHash}
                  onChange={(e) => setApiHash(e.target.value)}
                  disabled={configSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Telegram Phone Number</label>
                <input
                  type="tel"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition"
                  placeholder="+84123456789"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  disabled={configSaving}
                />
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <button
                onClick={handleSaveConfig}
                disabled={configSaving || !apiId.trim() || !apiHash.trim()}
                className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-black/90 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {configSaving ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  'Save credentials'
                )}
              </button>
              <div className="flex items-center gap-2 text-xs">
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] uppercase tracking-wide ${
                    isVerified ? 'bg-emerald-100 text-emerald-700' : 'bg-yellow-100 text-yellow-700'
                  }`}
                >
                  {isVerified ? 'Session verified' : 'Verification required'}
                </span>
                {configMessage && <p className="text-emerald-600">{configMessage}</p>}
                {configError && <p className="text-red-600">{configError}</p>}
              </div>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Telegram OTP Verification</p>
                <p className="text-xs text-gray-500">
                  Request an OTP to your Telegram app and verify it to establish a persistent session.
                </p>
              </div>
              <button
                onClick={handleRequestOtp}
                disabled={otpRequesting || !apiId.trim() || !apiHash.trim() || !phoneNumber.trim()}
                className="inline-flex items-center justify-center rounded-md border border-gray-300 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-gray-900 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                {otpRequesting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                    Sending OTP...
                  </>
                ) : (
                  'Send OTP'
                )}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Enter OTP Code</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 transition"
                  placeholder="12345"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  disabled={otpVerifying}
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleVerifyOtp}
                  disabled={otpVerifying || !otpCode.trim()}
                  className="w-full inline-flex items-center justify-center rounded-md bg-sky-600 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow-sm hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
                >
                  {otpVerifying ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" />
                      Verifying...
                    </>
                  ) : (
                    'Verify OTP'
                  )}
                </button>
              </div>
            </div>
            <div className="mt-3 text-xs">
              {otpMessage && <p className="text-emerald-600">{otpMessage}</p>}
              {otpError && <p className="text-red-600">{otpError}</p>}
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default TelegramLogin


