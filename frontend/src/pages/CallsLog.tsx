import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { callsAPI } from '../lib/api'
import { Phone, Search, Filter, Download, Eye, TrendingUp } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { toast } from 'react-hot-toast'

interface Call {
  id: string
  phone_number: string
  agent_name: string
  call_type: 'inbound' | 'outbound'
  duration: number
  status: 'completed' | 'failed' | 'busy' | 'no_answer' | 'cancelled'
  sentiment?: 'positive' | 'negative' | 'neutral'
  sentiment_score?: number
  feedback?: string
  meeting_booked: boolean
  created_at: string
}

export default function CallsLog() {
  const { } = useAuth()
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    phone_number: '',
    start_date: '',
    end_date: '',
    agent_name: '',
    call_type: '',
    status: '',
    sentiment: ''
  })

  useEffect(() => {
    fetchCalls()
  }, [])

  const fetchCalls = async () => {
    try {
      setLoading(true)
      
      // Clean up filters - remove empty strings and convert to proper types
      const cleanFilters: any = {}
      
      if (filters.phone_number.trim()) {
        cleanFilters.phone_number = filters.phone_number.trim()
      }
      if (filters.agent_name.trim()) {
        cleanFilters.agent_name = filters.agent_name.trim()
      }
      if (filters.start_date.trim()) {
        cleanFilters.start_date = filters.start_date.trim()
      }
      if (filters.end_date.trim()) {
        cleanFilters.end_date = filters.end_date.trim()
      }
      if (filters.call_type.trim()) {
        cleanFilters.call_type = filters.call_type.trim()
      }
      if (filters.status.trim()) {
        cleanFilters.status = filters.status.trim()
      }
       if (filters.sentiment.trim()) {
         cleanFilters.sentiment = filters.sentiment.trim()
       }
      
      const params = {
        ...cleanFilters,
        limit: 50,
        offset: 0
      }
      
       console.log('Calls API Params:', params) // Debug log
       const response = await callsAPI.getCalls(params)
       console.log('Calls API Response:', response.data) // Debug log
       
       // Ensure each call has an id field
        const callsWithId = (response.data || []).map((call: any) => ({
         ...call,
         id: call.id || call._id || `call_${Date.now()}_${Math.random()}`
       }))
       
       console.log('Calls with ID:', callsWithId) // Debug log
       setCalls(callsWithId)
    } catch (error) {
      console.error('Error fetching calls:', error)
      toast.error('Failed to fetch calls')
      setCalls([]) // Set empty array on error
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
      month: '2-digit',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // const getStatusColor = (status: string) => {
  //   switch (status) {
  //     case 'completed':
  //       return 'bg-green-100 text-green-800'
  //     case 'failed':
  //       return 'bg-red-100 text-red-800'
  //     case 'busy':
  //       return 'bg-yellow-100 text-yellow-800'
  //     case 'no_answer':
  //       return 'bg-gray-100 text-gray-800'
  //     default:
  //       return 'bg-gray-100 text-gray-800'
  //   }
  // }

  const getSentimentIcon = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-white text-xs">+</div>
      case 'negative':
        return <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs">-</div>
      case 'neutral':
        return <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs">=</div>
      default:
        return <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center text-white text-xs">?</div>
    }
  }

  const handleApplyFilters = async () => {
    await fetchCalls()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (calls.length === 0 && !loading) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Calls</h1>
            <p className="text-gray-600">No calls found</p>
          </div>
        </div>
        
        {/* Empty State */}
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No calls yet</h3>
          <p className="text-gray-600 mb-6">
            Start making calls from your contacts to see them here.
          </p>
          <button
            onClick={fetchCalls}
            className="btn btn-primary"
          >
            Refresh
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Call History</h1>
            <p className="text-primary-100 text-lg">
              {calls.length.toLocaleString()} total calls • {calls.filter(c => c.status === 'completed').length} successful
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors">
              <Download className="h-4 w-4 mr-2 inline" />
              Export
            </button>
            <button 
              onClick={fetchCalls}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <TrendingUp className="h-4 w-4 mr-2 inline" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Filter className="h-5 w-5 mr-2 text-primary-600" />
            Filters
          </h3>
          <button
            onClick={handleApplyFilters}
            className="btn btn-primary btn-sm"
          >
            Apply Filters
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.phone_number}
                onChange={(e) => setFilters({...filters, phone_number: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Search phone..."
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => setFilters({...filters, start_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => setFilters({...filters, end_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleApplyFilters}
              className="w-full bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors flex items-center justify-center"
            >
              <Filter className="h-4 w-4 mr-2" />
              Apply
            </button>
          </div>
        </div>
        
      </div>

      {/* Calls Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agent
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Number
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Feedback
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {calls.map((call) => (
                <tr key={call.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDate(call.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {call.agent_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatDuration(call.duration)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
                      <span className="text-sm text-gray-900 capitalize">{call.call_type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {call.phone_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getSentimentIcon(call.sentiment)}
                      <span className="ml-2 text-sm text-gray-900">
                        {call.feedback || 'No feedback'}
                      </span>
                    </div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                     <Link 
                       to={`/calls/${call.id}`}
                       className="text-primary-600 hover:text-primary-900 transition-colors"
                     >
                       <Eye className="h-4 w-4" />
                     </Link>
                   </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {calls.length === 0 && (
          <div className="text-center py-12">
            <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No calls found</p>
          </div>
        )}
      </div>
    </div>
  )
}
