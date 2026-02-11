import { useState, useEffect } from 'react'
import { Mail, RefreshCw, Search, AlertCircle, ExternalLink, Inbox, Clock } from 'lucide-react'
import { gmailAPI, GmailEmail, GmailStatusResponse } from '../lib/api'

export default function GmailPage() {
  const [emails, setEmails] = useState<GmailEmail[]>([])
  const [status, setStatus] = useState<GmailStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedEmail, setSelectedEmail] = useState<GmailEmail | null>(null)

  // Check Gmail status and load emails on mount
  useEffect(() => {
    checkStatusAndLoadEmails()
  }, [])

  const checkStatusAndLoadEmails = async () => {
    setLoading(true)
    setError(null)
    try {
      // First check status
      const statusRes = await gmailAPI.getStatus()
      setStatus(statusRes.data)

      if (!statusRes.data.configured) {
        setError('Gmail is not configured. Please login with Google to grant Gmail access.')
        setLoading(false)
        return
      }

      if (statusRes.data.needs_reauthorization) {
        setError('Gmail permissions need to be re-authorized.')
        setLoading(false)
        return
      }

      // Load emails
      await loadEmails()
    } catch (err: any) {
      console.error('Error checking Gmail status:', err)
      setError(err.response?.data?.detail || 'Failed to check Gmail status')
    } finally {
      setLoading(false)
    }
  }

  const loadEmails = async (query?: string) => {
    try {
      const res = await gmailAPI.getLatestEmails({ 
        max_results: 50,
        query: query || undefined 
      })
      setEmails(res.data.emails)
    } catch (err: any) {
      console.error('Error loading emails:', err)
      setError(err.response?.data?.detail || 'Failed to load emails')
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadEmails(searchQuery)
    setRefreshing(false)
  }

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    setRefreshing(true)
    await loadEmails(searchQuery)
    setRefreshing(false)
  }

  const handleReauthorize = async () => {
    try {
      const res = await gmailAPI.getReauthorizeUrl()
      window.location.href = res.data.auth_url
    } catch (err: any) {
      console.error('Error getting reauthorize URL:', err)
      setError(err.response?.data?.detail || 'Failed to get reauthorization URL')
    }
  }

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown'
    const date = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    } else if (diffDays === 1) {
      return 'Yesterday'
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const extractSenderName = (from: string) => {
    // Extract name from "Name <email@example.com>" format
    const match = from.match(/^(.+?)\s*<.*>$/)
    return match ? match[1].replace(/"/g, '') : from
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-600">Loading Gmail...</p>
        </div>
      </div>
    )
  }

  // Show reauthorization UI if needed
  if (error && (status?.needs_reauthorization || !status?.configured)) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Gmail Access Required</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button
                onClick={handleReauthorize}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Mail className="w-5 h-5" />
                Connect Gmail
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-500 rounded-lg flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Gmail</h1>
                <p className="text-sm text-gray-500">{status?.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <form onSubmit={handleSearch} className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search emails..."
                  className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </form>

              {/* Refresh button */}
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Refresh"
              >
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <div className="flex gap-6">
          {/* Email list */}
          <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {emails.length === 0 ? (
              <div className="p-12 text-center">
                <Inbox className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No emails found</h3>
                <p className="text-gray-500">
                  {searchQuery ? 'Try a different search query' : 'Your inbox is empty'}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {emails.map((email) => (
                  <div
                    key={email.id}
                    onClick={() => setSelectedEmail(email)}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedEmail?.id === email.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-900 truncate">
                            {extractSenderName(email.from)}
                          </span>
                        </div>
                        <h4 className="text-sm font-medium text-gray-800 truncate mb-1">
                          {email.subject || '(No subject)'}
                        </h4>
                        <p className="text-sm text-gray-500 truncate">{email.snippet}</p>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 flex-shrink-0">
                        <Clock className="w-4 h-4" />
                        {formatDate(email.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Email preview */}
          {selectedEmail && (
            <div className="w-1/2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  {selectedEmail.subject || '(No subject)'}
                </h2>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-lg font-medium text-gray-600">
                      {extractSenderName(selectedEmail.from).charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{extractSenderName(selectedEmail.from)}</p>
                    <p className="text-sm text-gray-500">{selectedEmail.from}</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedEmail.snippet}</p>
                <p className="mt-4 text-sm text-gray-400">
                  (Email snippet only - full content requires additional API scope)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
