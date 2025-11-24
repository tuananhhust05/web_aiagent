import { useEffect, useMemo, useState } from 'react'
import { telegramAPI } from '../lib/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { CheckCircle2, Image as ImageIcon, Loader2, Info, AlertCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

type RequestStatus = 'idle' | 'loading' | 'success' | 'error'

const TelegramLogin = () => {
  const { user } = useAuth()
  const userId = useMemo(() => user?.id || (user as any)?._id || '', [user])
  const loginImageUrl = userId ? `https://4skale.com/image_profile_login/telegram_login_${userId}.png` : ''

  const [profileStatus, setProfileStatus] = useState<RequestStatus>('idle')
  const [loginStatus, setLoginStatus] = useState<RequestStatus>('idle')
  const [imageReady, setImageReady] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageVersion, setImageVersion] = useState(0)
  const [apiId, setApiId] = useState('')
  const [apiHash, setApiHash] = useState('')
  const [configLoading, setConfigLoading] = useState(false)
  const [configSaving, setConfigSaving] = useState(false)
  const [configMessage, setConfigMessage] = useState<string | null>(null)
  const [configError, setConfigError] = useState<string | null>(null)

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
    setImageReady(false)
    setImageLoaded(false)
    setImageVersion(0)
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
      await telegramAPI.saveAppConfig({
        api_id: apiId.trim(),
        api_hash: apiHash.trim(),
      })
      setConfigMessage('Telegram App credentials saved successfully.')
    } catch (error: any) {
      console.error('Failed to save Telegram app config', error)
      setConfigError(error?.response?.data?.detail || 'Failed to save Telegram App credentials.')
    } finally {
      setConfigSaving(false)
    }
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const handleLogin = async () => {
    if (!userId || loginStatus === 'loading') return
    setLoginStatus('loading')
    try {
      telegramAPI.login()
      await sleep(10000)
    } catch (error) {
      // console.error('Failed to login Telegram', error)
    } finally {
      setImageReady(true)
      for(let i = 0; i < 100; i++) {
        reloadImage()
        await sleep(4000)
      }
      setLoginStatus('success')
    }
  }

  const canLogin = profileStatus === 'success' && !!userId

  const reloadImage = () => {
    setImageLoaded(false)
    setImageVersion((prev) => prev + 1)
  }

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
                <li>Please wait approximately <strong>15 seconds</strong> after clicking Login for the system to generate the QR code.</li>
                <li>You need to <strong>scan the QR code within 1 minute</strong> after it appears to successfully log in.</li>
                <li>If the displayed image is not a QR code (e.g., a profile picture or other notification), this means you have already successfully logged in previously. You can <strong>proceed to create campaigns immediately</strong> without needing to log in again.</li>
              </ul>
            </div>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-sm font-semibold text-gray-900">Telegram App Credentials</p>
                <p className="text-xs text-gray-500">Provide your Telegram App API ID & API Hash so we can authenticate on your behalf.</p>
              </div>
              {configLoading && (
                <div className="flex items-center gap-2 text-xs text-blue-600">
                  <LoadingSpinner size="sm" className="text-blue-600" />
                  Loading...
                </div>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {configMessage && <p className="text-xs text-emerald-600">{configMessage}</p>}
              {configError && <p className="text-xs text-red-600">{configError}</p>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-7xl">
          {imageReady && loginImageUrl ? (
            <div className="relative w-full aspect-square max-w-4xl mx-auto bg-white rounded-2xl border-2 border-gray-200 shadow-xl overflow-hidden">
              {!imageLoaded && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 z-10">
                  <LoadingSpinner size="lg" className="text-blue-600" />
                </div>
              )}
              <div className="w-full h-full flex items-center justify-center overflow-hidden">
                <img
                  key={imageVersion}
                  src={loginImageUrl}
                  alt="Telegram login QR code"
                  className="w-full h-full object-contain scale-120"
                  style={{ transform: 'scale(1.2)', objectPosition: 'center' }}
                  onLoad={() => setImageLoaded(true)}
                  onError={() => setImageLoaded(true)}
                />
              </div>
            </div>
          ) : (
            <div className="w-full max-w-4xl mx-auto aspect-square bg-white rounded-2xl border-2 border-dashed border-gray-300 flex items-center justify-center">
              <div className="text-center space-y-2">
                <ImageIcon className="h-12 w-12 text-gray-400 mx-auto" />
                <p className="text-gray-500 font-medium">
                  {userId
                    ? imageReady
                      ? 'Preparing your login image...'
                      : 'Press Login to load your Telegram QR code.'
                    : 'User ID is required before the image can be loaded.'}
                </p>
                {loginImageUrl && (
                  <p className="text-xs text-gray-400 mt-2 break-all px-4">{loginImageUrl}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TelegramLogin


