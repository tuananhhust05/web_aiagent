import { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { callsAPI } from '../lib/api'
import { Phone, TrendingUp, Clock, Calendar, ArrowUp, ArrowDown, Search, Filter } from 'lucide-react'
import LoadingSpinner from '../components/ui/LoadingSpinner'

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

export default function CallsDashboard() {
  const { } = useAuth()
  const [kpiData, setKpiData] = useState<KPIData | null>(null)
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    phone_number: '',
    start_date: '',
    end_date: '',
    unique_calls_only: false
  })

  useEffect(() => {
    const fetchKPIs = async () => {
      try {
        const response = await callsAPI.getKPISummary()
        setKpiData(response.data)
      } catch (error) {
        console.error('Error fetching KPIs:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchKPIs()
  }, [])

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const formatChange = (change: number) => {
    const isPositive = change >= 0
    const icon = isPositive ? ArrowUp : ArrowDown
    const color = isPositive ? 'text-green-600' : 'text-red-600'
    const sign = isPositive ? '+' : ''
    return { icon, color, text: `${sign}${change.toFixed(1)}%` }
  }

  const handleApplyFilters = async () => {
    try {
      setLoading(true)
      const params = {
        start_date: filters.start_date || undefined,
        end_date: filters.end_date || undefined,
        phone_number: filters.phone_number || undefined,
        unique_calls_only: filters.unique_calls_only
      }
      const response = await callsAPI.getKPISummary(params)
      setKpiData(response.data)
    } catch (error) {
      console.error('Error applying filters:', error)
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
      color: 'bg-blue-500',
      change: formatChange(kpiData.total_calls_change)
    },
    {
      title: 'Call Success Rate',
      value: `${kpiData.call_success_rate}%`,
      icon: TrendingUp,
      color: 'bg-green-500',
      change: formatChange(kpiData.success_rate_change)
    },
    {
      title: 'Avg. Call Duration',
      value: formatDuration(kpiData.avg_call_duration),
      icon: Clock,
      color: 'bg-purple-500',
      change: formatChange(kpiData.duration_change)
    },
    {
      title: 'Meetings Booked',
      value: kpiData.meetings_booked.toLocaleString(),
      icon: Calendar,
      color: 'bg-orange-500',
      change: formatChange(kpiData.meetings_change)
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiCards.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`p-3 rounded-lg ${kpi.color}`}>
                  <kpi.icon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{kpi.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{kpi.value}</p>
                </div>
              </div>
              <div className={`flex items-center ${kpi.change.color}`}>
                <kpi.change.icon className="h-4 w-4 mr-1" />
                <span className="text-sm font-medium">{kpi.change.text}</span>
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
    </div>
  )
}
