import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { 
  Users, 
  Phone, 
  BarChart3, 
  ArrowUpRight,
  Plus,
  Target,
  Upload,
  TrendingUp,
  FileText,
  DollarSign,
  Trophy,
  Briefcase,
  Activity,
  Smile,
  Calendar,
  ChevronDown
} from 'lucide-react'
import { statsAPI, dealsAPI, csmAPI } from '../lib/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'

export default function Dashboard() {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [timeRange, setTimeRange] = useState('30')
  
  // Fetch dashboard stats from API
  const { data: statsResponse, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => statsAPI.getDashboardStats(),
  })

  // Fetch deals stats
  const { data: dealsStatsResponse } = useQuery({
    queryKey: ['deals-stats'],
    queryFn: () => dealsAPI.getStats(),
  })

  // Fetch CSM stats
  const { data: csmStatsResponse } = useQuery({
    queryKey: ['csm-stats'],
    queryFn: () => csmAPI.getStats(),
  })

  const stats = statsResponse?.data || {
    total_contacts: 0,
    calls_this_month: 0,
    active_campaigns: 0,
    total_campaigns: 0,
    calls_by_status: {},
    recent_calls: [],
    recent_campaigns: [],
    month: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    new_leads: 0,
    open_deals: 0,
    active_clients: 0
  }

  const dealsStats = dealsStatsResponse?.data || {
    open_deals: 0,
    total_value: 0,
    win_rate: 0,
    avg_deal_value: 0
  }

  const csmStats = csmStatsResponse?.data || {
    active_customers: 0,
    churn_rate: 0,
    average_health_score: 0,
    total_account_value: 0
  }

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const recentActivity = [
    {
      id: 1,
      type: 'contact_added',
      title: 'New contact added',
      description: 'John Smith from TechCorp was added to your contact list',
      time: '2 hours ago',
      icon: Users
    },
    {
      id: 2,
      type: 'campaign_started',
      title: 'Campaign launched',
      description: 'Q4 Sales Campaign started with 150 contacts',
      time: '4 hours ago',
      icon: Target
    },
    {
      id: 3,
      type: 'call_completed',
      title: 'Call completed',
      description: 'Successfully called Sarah Johnson from InnovateCo',
      time: '6 hours ago',
      icon: Phone
    },
    {
      id: 4,
      type: 'crm_sync',
      title: 'CRM sync completed',
      description: 'Synced 45 new contacts from HubSpot',
      time: '1 day ago',
      icon: Upload
    }
  ]

  const quickActions = [
    {
      title: 'Add Contact',
      description: 'Create a new contact manually',
      icon: Plus,
      link: '/contacts/new',
      color: 'blue'
    },
    {
      title: 'Start Campaign',
      description: 'Launch a new voice campaign',
      icon: Target,
      link: '/campaigns',
      color: 'purple'
    }
  ]

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Dashboard</h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Three Phase Dashboard */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">GENERAL DASHBOARD</h1>
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="30">Last 30 Days</option>
            <option value="90">Last 90 Days</option>
            <option value="365">Last Year</option>
          </select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Phase 1 */}
          <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
            <div className="bg-blue-100 text-center text-[11px] font-semibold text-blue-900 tracking-tight py-2 border-b border-blue-200">
              PHASE 1: LEADS & ACQUISITION
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center">
                <p className="text-blue-700 text-sm font-semibold mb-1">New Leads:</p>
                <div className="text-4xl font-bold text-blue-700">{stats.new_leads?.toLocaleString() || 0}</div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-blue-600" />
                    <span>Cost per Lead:</span>
                  </div>
                  <span className="font-semibold text-gray-900">€8.50</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                    <span>Top Channel:</span>
                  </div>
                  <div className="flex items-center gap-2 font-semibold text-gray-900">
                    <span>LinkedIn</span>
                    <span className="text-sm text-green-600 font-semibold">↑ +15%</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={() => toggleSection('conversion')}
                  className="w-full flex items-center justify-between text-sm text-gray-700 hover:text-gray-900"
                >
                  <span className="font-semibold">conversion details</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {expandedSections.conversion && (
                  <div className="mt-3 flex items-end gap-1">
                    {['100%', '80%', '70%', '55%', '45%', '35%', '25%'].map((width, idx) => (
                      <div
                        key={idx}
                        className="bg-blue-200 rounded-sm"
                        style={{ width, height: `${6 + idx}px` }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
            <div className="bg-orange-100 text-center text-[11px] font-semibold text-orange-900 tracking-tight py-2 border-b border-orange-200">
              PHASE 2: NEGOTIATIONS (Sales)
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center">
                <p className="text-orange-700 text-sm font-semibold mb-1">Open Deals:</p>
                <div className="text-4xl font-bold text-orange-600">{dealsStats.open_deals || stats.open_deals || 0}</div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    <span>Pipeline Value:</span>
                  </div>
                  <span className="font-semibold text-gray-900">€{((dealsStats.total_value || 0) / 1000).toFixed(0)}k</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-orange-600" />
                    <span>Win Rate:</span>
                  </div>
                  <span className="font-semibold text-gray-900">{dealsStats.win_rate?.toFixed(0) || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-orange-600" />
                    <span>Avg. Deal Size:</span>
                  </div>
                  <span className="font-semibold text-gray-900">€{((dealsStats.avg_deal_value || 0) / 1000).toFixed(1)}k</span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={() => toggleSection('sales')}
                  className="w-full flex items-center justify-between text-sm text-gray-700 hover:text-gray-900"
                >
                  <span className="font-semibold">sales details</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {expandedSections.sales && (
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <div className="h-10 w-12 rounded-sm bg-orange-200 border border-orange-300"></div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                    <div className="h-8 w-10 rounded-sm bg-orange-300 border border-orange-400"></div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                    <div className="h-6 w-8 rounded-sm bg-orange-400 border border-orange-500"></div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="border border-gray-200 rounded-lg bg-white shadow-sm">
            <div className="bg-green-100 text-center text-[11px] font-semibold text-green-900 tracking-tight py-2 border-b border-green-200">
              PHASE 3: CUSTOMER SUCCESS (CSM) & RENEWALS
            </div>
            <div className="p-4 space-y-4">
              <div className="text-center">
                <p className="text-green-700 text-sm font-semibold mb-1">Active Clients:</p>
                <div className="text-4xl font-bold text-green-600">{csmStats.active_customers || stats.active_clients || 0}</div>
              </div>
              <div className="space-y-2 text-sm text-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span>Churn Rate:</span>
                  </div>
                  <span className="font-semibold text-gray-900">{csmStats.churn_rate?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smile className="h-4 w-4 text-green-600" />
                    <span>NPS Score:</span>
                  </div>
                  <span className="font-semibold text-gray-900">{csmStats.average_health_score?.toFixed(0) || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-600" />
                    <span>Forecasted Renewals:</span>
                  </div>
                  <span className="font-semibold text-gray-900">€{((csmStats.total_account_value || 0) / 1000).toFixed(0)}k</span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <button
                  onClick={() => toggleSection('retention')}
                  className="w-full flex items-center justify-between text-sm text-gray-700 hover:text-gray-900"
                >
                  <span className="font-semibold">retention details</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {expandedSections.retention && (
                  <div className="mt-3 space-y-2">
                    <div className="text-xs font-semibold text-gray-700 text-center">customer health score</div>
                    <div className="relative h-4 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min((csmStats.average_health_score || 0), 100)}%` }}
                      ></div>
                      <div 
                        className="absolute top-0 left-0 h-full w-1 bg-gray-900"
                        style={{ left: `${Math.min((csmStats.average_health_score || 0), 100)}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-center">
                      Score: {csmStats.average_health_score?.toFixed(0) || 0}/100
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
            <div className="space-y-4">
              {quickActions.map((action) => (
                <Link
                  key={action.title}
                  to={action.link}
                  className="group block p-4 rounded-xl border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all duration-200"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-10 h-10 bg-${action.color}-50 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <action.icon className={`h-5 w-5 text-${action.color}-600`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 group-hover:text-gray-700 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600">{action.description}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
              <Link 
                to="/activity" 
                className="text-primary-600 hover:text-primary-700 font-medium text-sm transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-4 p-4 rounded-xl hover:bg-gray-50 transition-colors">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <activity.icon className="h-5 w-5 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-gray-900">{activity.title}</h3>
                      <span className="text-sm text-gray-500">{activity.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{activity.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Performance Chart Section */}
      <div className="mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Campaign Performance</h2>
            <div className="flex items-center space-x-4">
              <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent">
                <option>Last 30 days</option>
                <option>Last 90 days</option>
                <option>Last 6 months</option>
              </select>
            </div>
          </div>
          
          {/* Placeholder for chart */}
          <div className="h-64 bg-gray-50 rounded-xl flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Chart component will be integrated here</p>
              <p className="text-sm text-gray-500">Showing campaign performance metrics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 