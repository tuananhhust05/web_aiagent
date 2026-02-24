import { Mail, ExternalLink, AlertCircle, CheckCircle, Loader2, RefreshCw } from 'lucide-react'
import type { GmailStatusResponse } from '../../lib/api'

export interface GmailConnectPromptProps {
  status: GmailStatusResponse | null
  loading: boolean
  onReauthorize: () => void
  onRefresh: () => void
  reauthorizing?: boolean
}

export default function GmailConnectPrompt({
  status,
  loading,
  onReauthorize,
  onRefresh,
  reauthorizing,
}: GmailConnectPromptProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-[#3B82F6] mr-2" />
        <span className="text-sm text-gray-600">Checking Gmail connection...</span>
      </div>
    )
  }

  if (!status) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-red-900 mb-1">Unable to check Gmail status</h3>
            <p className="text-sm text-red-700 mb-3">
              Could not connect to the server to verify Gmail permissions.
            </p>
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    )
  }

  const isConnected = status.configured && status.has_gmail_scope && !status.needs_reauthorization

  if (isConnected) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-emerald-800">
              Gmail connected: {status.email || 'your account'}
            </p>
            {status.token_expiry && (
              <p className="text-xs text-emerald-600 mt-0.5">
                Token expires: {new Date(status.token_expiry).toLocaleString()}
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={onRefresh}
            className="shrink-0 p-2 rounded-lg text-emerald-600 hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            title="Refresh status"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  if (status.needs_reauthorization) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
            <AlertCircle className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-amber-900 mb-1">Gmail permissions expired</h3>
            <p className="text-sm text-amber-700 mb-1">
              Your Gmail access token has expired or is missing required permissions.
              <strong className="font-semibold"> Please re-connect to fully utilize To-Do Ready's email intelligence features</strong> — 
              including automatic prospect reply detection, AI-prepared responses, and communication thread analysis.
            </p>
            {status.token_scopes && status.token_scopes.length > 0 && (
              <p className="text-xs text-amber-600 mb-3">
                Current scopes: {status.token_scopes.join(', ')}
              </p>
            )}
            <button
              type="button"
              onClick={onReauthorize}
              disabled={reauthorizing}
              className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
            >
              {reauthorizing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Re-authorize Gmail
              <ExternalLink className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center text-center">
        <div className="w-16 h-16 rounded-full bg-[#3B82F6]/10 flex items-center justify-center mb-4">
          <Mail className="h-8 w-8 text-[#3B82F6]" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect Gmail to Unlock Full Potential</h3>
        <p className="text-sm text-gray-600 mb-2 max-w-lg">
          To-Do Ready works best when connected to your Gmail. Without it, you'll only see tasks from calls.
        </p>
        <p className="text-sm text-gray-700 mb-6 max-w-lg">
          <strong className="font-semibold">With Gmail connected, you can:</strong>
        </p>
        <ul className="text-sm text-gray-600 mb-6 text-left max-w-md space-y-1.5">
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>Automatically detect incoming prospect replies</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>Get AI-prepared responses based on email context</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>Send approved replies directly from To-Do Ready</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>View full communication threads in Reply Lab</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
            <span>Handle objections and competitive mentions from emails</span>
          </li>
        </ul>
        <button
          type="button"
          onClick={onReauthorize}
          disabled={reauthorizing}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-medium text-white bg-[#3B82F6] hover:bg-[#2563EB] disabled:opacity-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:ring-offset-1"
        >
          {reauthorizing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Mail className="h-5 w-5" />
          )}
          Connect Google for Gmail Access
          <ExternalLink className="h-4 w-4" />
        </button>
        <p className="text-xs text-gray-500 mt-4">
          We request read and send access to your emails. Your data is secure and private.
        </p>
      </div>
    </div>
  )
}
