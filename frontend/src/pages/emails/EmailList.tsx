import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Mail, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Trash2,
  Filter,
  Search
} from 'lucide-react'
import { emailsAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

interface Email {
  id: string
  subject: string
  status: 'draft' | 'sending' | 'sent' | 'failed'
  total_recipients: number
  sent_count: number
  failed_count: number
  created_at: string
  sent_at?: string
}

const EmailList: React.FC = () => {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const navigate = useNavigate()

  useEffect(() => {
    loadEmails()
  }, [statusFilter])

  const loadEmails = async () => {
    try {
      setLoading(true)
      
      const params: any = {}
      if (statusFilter !== 'all') {
        params.status_filter = statusFilter
      }
      
      const response = await emailsAPI.getEmails(params)
      setEmails(response.data || [])
    } catch (error: any) {
      console.error('Error loading emails:', error)
      toast.error('Failed to load emails')
      setEmails([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmail = async (emailId: string) => {
    if (!window.confirm('Are you sure you want to delete this email?')) {
      return
    }

    try {
      await emailsAPI.deleteEmail(emailId)
      toast.success('Email deleted successfully')
      loadEmails()
    } catch (error: any) {
      console.error('Error deleting email:', error)
      toast.error('Failed to delete email')
    }
  }

  const handleSendEmail = async (emailId: string) => {
    try {
      await emailsAPI.sendEmail(emailId)
      toast.success('Email sent successfully')
      loadEmails()
    } catch (error: any) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'sending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      default:
        return <Mail className="h-4 w-4 text-gray-600" />
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

  const filteredEmails = emails.filter(email =>
    email.subject.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Marketing</h1>
          <p className="text-gray-600">Manage and send marketing emails to your contacts</p>
        </div>
        <Link
          to="/emails/create"
          className="btn btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Email</span>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search emails..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="draft">Draft</option>
            <option value="sending">Sending</option>
            <option value="sent">Sent</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Email List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {filteredEmails.length === 0 ? (
          <div className="text-center py-12">
            <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No emails found</h3>
            <p className="text-gray-600 mb-4">
              {searchTerm ? 'Try adjusting your search terms' : 'Get started by creating your first email'}
            </p>
            {!searchTerm && (
              <Link
                to="/emails/create"
                className="btn btn-primary"
              >
                Create Email
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subject
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recipients
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(email.status)}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {email.subject}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(email.status)}`}>
                        {email.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div>Total: {email.total_recipients}</div>
                        {email.status === 'sent' && (
                          <div className="text-green-600">Sent: {email.sent_count}</div>
                        )}
                        {email.failed_count > 0 && (
                          <div className="text-red-600">Failed: {email.failed_count}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div>
                        <div>Created: {new Date(email.created_at).toLocaleDateString()}</div>
                        {email.sent_at && (
                          <div className="text-green-600">
                            Sent: {new Date(email.sent_at).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/emails/${email.id}`)}
                          className="text-primary-600 hover:text-primary-900"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {email.status === 'draft' && (
                          <button
                            onClick={() => handleSendEmail(email.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Send Email"
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleDeleteEmail(email.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Email"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default EmailList
