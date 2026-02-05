import React, { useEffect } from 'react'
import { API_BASE_URL } from '../../lib/api'
import { Loader2 } from 'lucide-react'

/**
 * Google Calendar OAuth callback lands here (redirect_uri is frontend).
 * We forward the browser to the backend callback so backend can exchange code,
 * save token, and redirect to /atlas/calendar?connected=success.
 */
const GoogleCalendarCallback: React.FC = () => {
  useEffect(() => {
    const search = window.location.search
    const backendCallbackUrl = `${API_BASE_URL}/auth/google/calendar/callback${search}`
    console.log('[Calendar OAuth] Frontend callback: forwarding to backend', {
      hasCode: !!new URLSearchParams(search).get('code'),
      hasState: !!new URLSearchParams(search).get('state'),
      backendUrl: backendCallbackUrl,
    })
    window.location.href = backendCallbackUrl
  }, [])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
      <Loader2 className="h-10 w-10 animate-spin text-blue-600 mb-4" />
      <p className="text-sm text-gray-600">Đang hoàn tất kết nối Google Calendar...</p>
      <p className="text-xs text-gray-400 mt-2">Chuyển hướng tới backend để xử lý token.</p>
    </div>
  )
}

export default GoogleCalendarCallback
