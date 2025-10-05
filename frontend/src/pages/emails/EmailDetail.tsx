import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Send, 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle,
  Users,
  Calendar,
  User
} from 'lucide-react'
import { emailsAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

interface EmailDetail {
  id: string
  subject: string
  content: string
  is_html: boolean
  status: 'draft' | 'sending' | 'sent' | 'failed'
  recipients: Array<{
    email: string
    name?: string
    contact_id?: string
  }>
  attachments: Array<{
    filename: string
    content_type: string
    size: number
  }>
  sent_count: number
  failed_count: number
  total_recipients: number
  created_at: string
  sent_at?: string
}

const EmailDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [email, setEmail] = useState<EmailDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (id) {
      loadEmail()
    }
  }, [id])

  const loadEmail = async () => {
    try {
      setLoading(true)
      const response = await emailsAPI.getEmail(id!)
      setEmail(response.data || null)
    } catch (error: any) {
      console.error('Error loading email:', error)
      toast.error('Failed to load email')
      navigate('/emails')
    } finally {
      setLoading(false)
    }
  }

  const handleSendEmail = async () => {
    if (!email) return

    try {
      setSending(true)
      await emailsAPI.sendEmail(email.id)
      toast.success('Email sent successfully')
      loadEmail() // Reload to get updated status
    } catch (error: any) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    } finally {
      setSending(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'sending':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return <Mail className="h-5 w-5 text-gray-600" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      case 'sending':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!email) {
    return (
      <div className="text-center py-12">
        <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Email not found</h3>
        <p className="text-gray-600">The email you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/emails')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{email.subject}</h1>
            <p className="text-gray-600">Email Details</p>
          </div>
        </div>
        
        {email.status === 'draft' && (
          <button
            onClick={handleSendEmail}
            disabled={sending}
            className="btn btn-primary flex items-center space-x-2"
          >
            {sending ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
            <span>Send Email</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Email Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Content</h3>
              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(email.status)}`}>
                {email.status}
              </span>
            </div>
            
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              {email.is_html ? (
                <div dangerouslySetInnerHTML={{ __html: email.content }} />
              ) : (
                <pre className="whitespace-pre-wrap font-mono text-sm">{email.content}</pre>
              )}
            </div>
          </div>

          {/* Attachments */}
          {email.attachments.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Attachments</h3>
              <div className="space-y-2">
                {email.attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium">{attachment.filename}</div>
                      <div className="text-sm text-gray-500">
                        {attachment.content_type} • {(attachment.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Email Info */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Email Information</h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                {getStatusIcon(email.status)}
                <div>
                  <div className="text-sm font-medium text-gray-900">Status</div>
                  <div className="text-sm text-gray-500 capitalize">{email.status}</div>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <Calendar className="h-5 w-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Created</div>
                  <div className="text-sm text-gray-500">
                    {new Date(email.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              
              {email.sent_at && (
                <div className="flex items-center space-x-3">
                  <Send className="h-5 w-5 text-gray-400" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">Sent</div>
                    <div className="text-sm text-gray-500">
                      {new Date(email.sent_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recipients Stats */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recipients</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Total Recipients</span>
                <span className="text-sm font-medium">{email.total_recipients}</span>
              </div>
              
              {email.status === 'sent' && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Successfully Sent</span>
                    <span className="text-sm font-medium text-green-600">{email.sent_count}</span>
                  </div>
                  
                  {email.failed_count > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Failed</span>
                      <span className="text-sm font-medium text-red-600">{email.failed_count}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Recipients List */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Recipients List</h3>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {email.recipients.map((recipient, index) => (
                <div key={index} className="flex items-center space-x-3 p-2 bg-gray-50 rounded">
                  <User className="h-4 w-4 text-gray-400" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">
                      {recipient.name || 'No name'}
                    </div>
                    <div className="text-sm text-gray-500 truncate">
                      {recipient.email}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailDetail
