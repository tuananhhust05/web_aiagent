import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { callsAPI } from '../lib/api'
import { Download, ArrowLeft, Smile, Frown, Meh, Phone, Clock, User } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface CallDetail {
  id: string
  phone_number: string
  agent_name: string
  call_type: 'inbound' | 'outbound'
  duration: number
  status: 'completed' | 'failed' | 'busy' | 'no_answer' | 'cancelled'
  sentiment?: 'positive' | 'negative' | 'neutral'
  sentiment_score?: number
  feedback?: string
  transcript?: string
  recording_url?: string
  meeting_booked: boolean
  created_at: string
}

export default function CallSentiment() {
  const { callId } = useParams<{ callId: string }>()
  const navigate = useNavigate()
  const { } = useAuth()
  const [call, setCall] = useState<CallDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (callId) {
      fetchCallDetail()
    }
  }, [callId])

  const fetchCallDetail = async () => {
    try {
      setLoading(true)
      const response = await callsAPI.getCall(callId!)
      setCall(response.data)
    } catch (error) {
      console.error('Error fetching call detail:', error)
    } finally {
      setLoading(false)
    }
  }

  // const formatDuration = (seconds: number) => {
  //   const minutes = Math.floor(seconds / 60)
  //   const remainingSeconds = seconds % 60
  //   return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  // }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <Smile className="h-8 w-8 text-green-500" />
      case 'negative':
        return <Frown className="h-8 w-8 text-red-500" />
      case 'neutral':
        return <Meh className="h-8 w-8 text-gray-500" />
      default:
        return <Meh className="h-8 w-8 text-gray-400" />
    }
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600'
      case 'negative':
        return 'text-red-600'
      case 'neutral':
        return 'text-gray-600'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800`
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`
      case 'busy':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'no_answer':
        return `${baseClasses} bg-gray-100 text-gray-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const handleDownloadAudio = () => {
    if (call?.recording_url) {
      // Create a temporary link to download the audio
      const link = document.createElement('a')
      link.href = call.recording_url
      link.download = `call_${call.id}_recording.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } else {
      alert('No recording available for this call')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!call) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Call not found</p>
        <button
          onClick={() => navigate('/calls')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          Back to Calls
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/calls')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Call Sentiment</h1>
          </div>
        </div>
        <button
          onClick={handleDownloadAudio}
          className="btn btn-outline"
        >
          <Download className="h-4 w-4 mr-2" />
          Download Audio
        </button>
      </div>

      {/* Sentiment Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4 mb-6">
          {getSentimentIcon(call.sentiment)}
          <div>
            <h2 className={`text-xl font-semibold ${getSentimentColor(call.sentiment)}`}>
              Sentiment: {call.sentiment || 'Unknown'}
            </h2>
            {call.sentiment_score && (
              <p className="text-sm text-gray-600">
                Confidence: {(call.sentiment_score * 100).toFixed(1)}%
              </p>
            )}
          </div>
        </div>

        {call.feedback && (
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">Feedback</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">
                {call.feedback}
              </p>
            </div>
          </div>
        )}

        {call.transcript && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">Transcript</h3>
            <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {call.transcript}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Call Details */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Call Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-center space-x-3">
            <Clock className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Time</p>
              <p className="font-medium text-gray-900">{formatDate(call.created_at)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Agent</p>
              <p className="font-medium text-gray-900">{call.agent_name}</p>
              <p className="text-xs text-gray-500 capitalize">
                {call.call_type} | {call.status}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Phone className="h-5 w-5 text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={getStatusBadge(call.status)}>
                {call.status}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
