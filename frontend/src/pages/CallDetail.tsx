import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { callsAPI } from '../lib/api'
import { 
  ArrowLeft, 
  Download, 
  Play, 
  Pause, 
  Volume2, 
  Clock, 
  Phone, 
  User, 
  MessageSquare,
  TrendingUp,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { toast } from 'react-hot-toast'

interface CallDetail {
  id: string
  phone_number: string
  agent_name: string
  call_type: 'inbound' | 'outbound'
  duration: number
  status: 'completed' | 'failed' | 'busy' | 'no_answer' | 'cancelled'
  recording_url?: string
  transcript?: string
  sentiment?: 'positive' | 'negative' | 'neutral'
  sentiment_score?: number
  feedback?: string
  meeting_booked: boolean
  meeting_date?: string
  notes?: string
  created_at: string
  updated_at: string
  user_id: string
}

export default function CallDetail() {
  const { callId } = useParams<{ callId: string }>()
  const navigate = useNavigate()
  const [call, setCall] = useState<CallDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [audioProgress] = useState(0)
  const [audioDuration] = useState(0)

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
      toast.error('Failed to load call details')
    } finally {
      setLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />
      case 'busy':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />
      case 'no_answer':
        return <AlertCircle className="h-5 w-5 text-gray-500" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'busy':
        return 'bg-yellow-100 text-yellow-800'
      case 'no_answer':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'bg-green-100 text-green-800'
      case 'negative':
        return 'bg-red-100 text-red-800'
      case 'neutral':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleDownloadAudio = () => {
    if (call?.recording_url) {
      const link = document.createElement('a')
      link.href = call.recording_url
      link.download = `call-${call.phone_number}-${call.created_at}.mp3`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success('Audio download started')
    } else {
      toast.error('No audio recording available')
    }
  }

  const handlePlayPause = () => {
    if (call?.recording_url) {
      setAudioPlaying(!audioPlaying)
      // Audio playback logic would go here
      toast('Audio playback functionality coming soon')
    } else {
      toast.error('No audio recording available')
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
        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Call not found</h3>
        <p className="text-gray-600 mb-6">The call you're looking for doesn't exist.</p>
        <button
          onClick={() => navigate('/calls')}
          className="btn btn-primary"
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
            <h1 className="text-2xl font-bold text-gray-900">Call Details</h1>
            <p className="text-gray-600">{call.phone_number}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {call.recording_url && (
            <button
              onClick={handleDownloadAudio}
              className="btn btn-outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Audio
            </button>
          )}
        </div>
      </div>

      {/* Call Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Status Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Status</p>
              <div className="flex items-center mt-2">
                {getStatusIcon(call.status)}
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(call.status)}`}>
                  {call.status.replace('_', ' ').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Duration Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Duration</p>
              <div className="flex items-center mt-2">
                <Clock className="h-5 w-5 text-blue-500" />
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  {formatDuration(call.duration)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Agent</p>
              <div className="flex items-center mt-2">
                <User className="h-5 w-5 text-purple-500" />
                <span className="ml-2 text-lg font-semibold text-gray-900">
                  {call.agent_name}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sentiment Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Sentiment</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(call.sentiment)}`}>
                  {call.sentiment?.toUpperCase() || 'UNKNOWN'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Phone className="h-5 w-5 mr-2 text-primary-600" />
            Call Information
          </h3>
          
          <div className="space-y-4">
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Phone Number:</span>
              <span className="text-sm text-gray-900">{call.phone_number}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Call Type:</span>
              <span className="text-sm text-gray-900 capitalize">{call.call_type}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Created:</span>
              <span className="text-sm text-gray-900">{formatDate(call.created_at)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-sm font-medium text-gray-600">Updated:</span>
              <span className="text-sm text-gray-900">{formatDate(call.updated_at)}</span>
            </div>
            
            {call.meeting_booked && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Meeting Booked:</span>
                <span className="text-sm text-green-600 font-medium">Yes</span>
              </div>
            )}
            
            {call.meeting_date && (
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Meeting Date:</span>
                <span className="text-sm text-gray-900">{formatDate(call.meeting_date)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Audio Player */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <Volume2 className="h-5 w-5 mr-2 text-primary-600" />
            Audio Recording
          </h3>
          
          {call.recording_url ? (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">Call Recording</span>
                  <span className="text-xs text-gray-500">{formatDuration(call.duration)}</span>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handlePlayPause}
                    className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors"
                  >
                    {audioPlaying ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </button>
                  
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${audioProgress}%` }}
                    ></div>
                  </div>
                  
                  <span className="text-xs text-gray-500">
                    {formatDuration(audioProgress * audioDuration / 100)} / {formatDuration(audioDuration)}
                  </span>
                </div>
              </div>
              
              <button
                onClick={handleDownloadAudio}
                className="w-full btn btn-outline"
              >
                <Download className="h-4 w-4 mr-2" />
                Download Audio File
              </button>
            </div>
          ) : (
            <div className="text-center py-8">
              <Volume2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No audio recording available</p>
            </div>
          )}
        </div>
      </div>

      {/* Transcript */}
      {call.transcript && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-primary-600" />
            Call Transcript
          </h3>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
              {call.transcript}
            </pre>
          </div>
        </div>
      )}

      {/* Feedback and Notes */}
      {(call.feedback || call.notes) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
          
          <div className="space-y-4">
            {call.feedback && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Feedback</h4>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                  {call.feedback}
                </p>
              </div>
            )}
            
            {call.notes && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Notes</h4>
                <p className="text-sm text-gray-900 bg-gray-50 rounded-lg p-3">
                  {call.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
