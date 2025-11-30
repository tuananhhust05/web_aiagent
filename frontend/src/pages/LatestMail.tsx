import React, { useState, useEffect } from 'react'
import { Mail, RefreshCw, AlertCircle, Calendar, User, FileText, Loader2, CheckCircle } from 'lucide-react'
import { gmailAPI } from '../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface GmailEmail {
  id: string
  thread_id: string
  subject: string
  from: string
  snippet: string
  date: string | null
  internal_date: string | null
}

const LatestMail: React.FC = () => {
  const [emails, setEmails] = useState<GmailEmail[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gmailStatus, setGmailStatus] = useState<any>(null)
  const [maxResults, setMaxResults] = useState(10)
  const [reauthorizeUrl, setReauthorizeUrl] = useState<string | null>(null)

  useEffect(() => {
    checkGmailStatus()
    loadLatestEmails()
  }, [maxResults])

  const checkGmailStatus = async () => {
    try {
      const response = await gmailAPI.getStatus()
      setGmailStatus(response.data)
      
      // Log token info for debugging
      if (response.data.token_scopes) {
        console.log('📋 Gmail Token Scopes:', response.data.token_scopes)
        console.log('📋 Has Gmail Scope:', response.data.has_gmail_scope)
      }
      
      // If needs re-authorization, get the URL
      if (response.data.needs_reauthorization) {
        try {
          const reauthResponse = await gmailAPI.getReauthorizeUrl()
          setReauthorizeUrl(reauthResponse.data.auth_url)
        } catch (error: any) {
          console.error('Error getting reauthorize URL:', error)
        }
      }
    } catch (error: any) {
      console.error('Error checking Gmail status:', error)
    }
  }

  const loadLatestEmails = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await gmailAPI.getLatestEmails(maxResults)
      setEmails(response.data.emails || [])
    } catch (error: any) {
      console.error('Error loading latest emails:', error)
      const errorMessage = error.response?.data?.detail || 'Failed to load emails'
      setError(errorMessage)
      toast.error(errorMessage)
      setEmails([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadLatestEmails()
    await checkGmailStatus()
    setRefreshing(false)
    toast.success('Emails refreshed')
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return 'Just now'
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      })
    } catch {
      return dateString
    }
  }

  const extractEmailAddress = (from: string) => {
    // Extract email from "Name <email@example.com>" or just "email@example.com"
    const match = from.match(/<(.+)>/) || from.match(/([^\s<>]+@[^\s<>]+)/)
    return match ? match[1] || match[0] : from
  }

  const extractName = (from: string) => {
    // Extract name from "Name <email@example.com>"
    const match = from.match(/^(.+?)\s*</)
    return match ? match[1].trim() : null
  }

  if (loading && emails.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                <Mail className="h-8 w-8 text-blue-600" />
                Latest Mail
              </h1>
              <p className="mt-2 text-sm text-gray-600">
                View your latest emails from Gmail inbox
              </p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={maxResults}
                onChange={(e) => setMaxResults(Number(e.target.value))}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              >
                <option value={5}>5 emails</option>
                <option value={10}>10 emails</option>
                <option value={20}>20 emails</option>
                <option value={50}>50 emails</option>
              </select>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Gmail Status */}
        {gmailStatus && (
          <div className={`mb-6 p-4 rounded-lg border ${
            gmailStatus.configured && gmailStatus.has_gmail_scope
              ? 'bg-green-50 border-green-200' 
              : 'bg-yellow-50 border-yellow-200'
          }`}>
            <div className="flex items-start gap-3">
              {gmailStatus.configured && gmailStatus.has_gmail_scope ? (
                <>
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-green-800">
                      Gmail is configured for {gmailStatus.email || 'your account'}
                    </span>
                    {gmailStatus.token_scopes && (
                      <p className="text-xs text-green-700 mt-1">
                        Scopes: {gmailStatus.token_scopes.join(', ')}
                      </p>
                    )}
                  </div>
                </>
              ) : gmailStatus.needs_reauthorization ? (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-yellow-800">
                      Gmail permissions needed. Please re-authorize to grant Gmail access.
                    </span>
                    {gmailStatus.token_scopes && (
                      <p className="text-xs text-yellow-700 mt-1">
                        Current scopes: {gmailStatus.token_scopes.join(', ')} (missing Gmail scopes)
                      </p>
                    )}
                    {reauthorizeUrl && (
                      <a
                        href={reauthorizeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-block rounded-md bg-yellow-600 px-4 py-2 text-xs font-semibold text-white hover:bg-yellow-700 transition"
                      >
                        Re-authorize Gmail
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <span className="text-sm font-medium text-yellow-800">
                    Gmail is not configured. Please login with Google and grant Gmail permissions.
                  </span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="text-sm font-medium text-red-800">Error loading emails</p>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Emails List */}
        {emails.length === 0 && !loading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
            <p className="text-sm text-gray-600">
              {error 
                ? 'Unable to load emails. Please check your Gmail configuration.'
                : 'Your inbox appears to be empty or no emails match the current filter.'}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="divide-y divide-gray-200">
              {emails.map((email) => {
                const emailAddress = extractEmailAddress(email.from)
                const senderName = extractName(email.from)
                
                return (
                  <div
                    key={email.id}
                    className="p-6 hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Mail className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-sm font-semibold text-gray-900 truncate">
                                {email.subject || '(No Subject)'}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-gray-600 mb-2">
                              <User className="h-3.5 w-3.5" />
                              <span className="font-medium">
                                {senderName || emailAddress}
                              </span>
                              {senderName && (
                                <span className="text-gray-400">&lt;{emailAddress}&gt;</span>
                              )}
                            </div>
                            <p className="text-sm text-gray-700 line-clamp-2">
                              {email.snippet || '(No preview available)'}
                            </p>
                          </div>
                          <div className="flex-shrink-0 flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{formatDate(email.date)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Loading overlay when refreshing */}
        {refreshing && emails.length > 0 && (
          <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 flex items-center gap-3 shadow-lg">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span className="text-sm font-medium text-gray-900">Refreshing emails...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LatestMail

