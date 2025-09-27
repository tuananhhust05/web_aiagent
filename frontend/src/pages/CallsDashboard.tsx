import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { callsAPI } from '../lib/api'
import { Phone, Clock, Search, Filter, Download, Eye, TrendingUp } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import { toast } from 'react-hot-toast'

interface KPIData {
  total_calls: number
  call_success_rate: number
  avg_call_duration: number
  meetings_booked: number
  total_calls_change: number
  success_rate_change: number
  duration_change: number
  meetings_change: number
}

interface Call {
  id: string
  phone_number: string
  agent_name?: string
  call_type: 'inbound' | 'outbound'
  duration?: number
  status: 'completed' | 'failed' | 'busy' | 'no_answer' | 'cancelled' | 'connecting' | 'initiated'
  sentiment?: 'positive' | 'negative' | 'neutral'
  sentiment_score?: number
  feedback?: string
  meeting_booked: boolean
  created_at: string
}

export default function CallsDashboard() {
  const { } = useAuth()
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [calls, setCalls] = useState<Call[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    phone_number: '',
    start_date: '',
    end_date: '',
    unique_calls_only: false
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch KPIs and calls in parallel
        const [kpiResponse, callsResponse] = await Promise.all([
          callsAPI.getKPISummary(),
          callsAPI.getCalls({ limit: 50, offset: 0 })
        ])
        
        setKpiData(kpiResponse.data)
        
        // Ensure each call has an id field
        const callsWithId = (callsResponse.data || []).map((call: any) => ({
          ...call,
          id: call.id || call._id || `call_${Date.now()}_${Math.random()}`
        }))
        
        setCalls(callsWithId)
      } catch (error) {
        console.error('Error fetching data:', error)
        toast.error('Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'N/A'
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
    try {
      setLoading(true)
      
      // Clean up filters - remove empty strings
      const cleanFilters: any = {}
      
      if (filters.phone_number.trim()) {
        cleanFilters.phone_number = filters.phone_number.trim()
      }
      if (filters.start_date.trim()) {
        cleanFilters.start_date = filters.start_date.trim()
      }
      if (filters.end_date.trim()) {
        cleanFilters.end_date = filters.end_date.trim()
      }
      if (filters.unique_calls_only) {
        cleanFilters.unique_calls_only = filters.unique_calls_only
      }
      
      // Fetch both KPIs and calls with filters
      const [kpiResponse, callsResponse] = await Promise.all([
        callsAPI.getKPISummary(cleanFilters),
        callsAPI.getCalls({ ...cleanFilters, limit: 50, offset: 0 })
      ])
      
      setKpiData(kpiResponse.data)
      
      // Ensure each call has an id field
      const callsWithId = (callsResponse.data || []).map((call: any) => ({
        ...call,
        id: call.id || call._id || `call_${Date.now()}_${Math.random()}`
      }))
      
      setCalls(callsWithId)
    } catch (error) {
      console.error('Error applying filters:', error)
      toast.error('Failed to apply filters')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  const kpiCards = kpiData ? [
    {
      title: 'Total Calls',
      value: kpiData.total_calls.toLocaleString(),
      icon: Phone,
      color: 'bg-blue-500'
    },
    {
      title: 'Avg. Call Duration',
      value: formatDuration(kpiData.avg_call_duration),
      icon: Clock,
      color: 'bg-purple-500'
    }
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Monitoring key KPIs for AI voice meeting bookings</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {kpiCards.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${kpi.color}`}>
                <kpi.icon className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search phone number
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                value={filters.phone_number}
                onChange={(e) => setFilters({...filters, phone_number: e.target.value})}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Enter phone number"
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
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <label className="text-sm font-medium text-gray-700 mr-2">
              Unique calls
            </label>
            <input
              type="checkbox"
              checked={filters.unique_calls_only}
              onChange={(e) => setFilters({...filters, unique_calls_only: e.target.checked})}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
          </div>
        </div>
      </div>

      {/* Calls List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Recent Calls</h3>
            <div className="flex items-center space-x-4">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors">
                <Download className="h-4 w-4 mr-2 inline" />
                Export
              </button>
              <button 
                onClick={handleApplyFilters}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <TrendingUp className="h-4 w-4 mr-2 inline" />
                Refresh
              </button>
            </div>
          </div>
        </div>
        
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
                  Status
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
                    {call.agent_name || 'N/A'}
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      call.status === 'completed' ? 'bg-green-100 text-green-800' :
                      call.status === 'failed' ? 'bg-red-100 text-red-800' :
                      call.status === 'connecting' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {call.status}
                    </span>
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
