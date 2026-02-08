import React, { useEffect, useState } from 'react'
import { BACKEND_OAUTH_BASE_URL } from '../../lib/api'
import { Loader2, AlertTriangle } from 'lucide-react'

/**
 * Google Calendar OAuth: Google redirects here (frontend URL).
 * This page redirects the browser to the BACKEND with the same ?state=&code=&scope=
 * so the backend can exchange code for tokens and redirect to /atlas/calendar?connected=success.
 * Uses BACKEND_OAUTH_BASE_URL (VITE_BACKEND_OAUTH_URL in prod) to avoid redirecting to same page (infinite loop).
 */
const GoogleCalendarCallback: React.FC = () => {
  const [redirectError, setRedirectError] = useState<string | null>(null)

  useEffect(() => {
    const search = window.location.search
    const base = (BACKEND_OAUTH_BASE_URL || '').replace(/\/$/, '')
    const backendCallbackUrl = `${base}/auth/google/calendar/callback${search}`

    try {
      const target = new URL(backendCallbackUrl)
      const sameOrigin = target.origin === window.location.origin
      const samePath = target.pathname === window.location.pathname
      if (sameOrigin && samePath) {
        setRedirectError('same_origin')
        return
      }
    } catch {
      // ignore
    }

    window.location.href = backendCallbackUrl
  }, [])

  if (redirectError === 'same_origin') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6">
        <AlertTriangle className="h-12 w-12 text-amber-500 mb-4" />
        <h1 className="text-lg font-semibold text-gray-900 mb-2">Calendar connection misconfiguration</h1>
        <p className="text-sm text-gray-600 text-center max-w-md mb-4">
          Set <strong>VITE_BACKEND_OAUTH_URL</strong> to your backend URL (e.g. https://api.forskale.com) when building, or proxy <code className="bg-gray-100 px-1 rounded">/auth</code> to the backend.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
      <p className="text-sm text-gray-600">Completing Google Calendar connection…</p>
      <p className="text-xs text-gray-400 mt-2">Redirecting to backend.</p>
    </div>
  )
}

export default GoogleCalendarCallback
