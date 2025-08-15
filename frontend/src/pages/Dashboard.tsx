import { Link } from 'react-router-dom'
import { 
  Users, 
  Building2, 
  TrendingUp, 
  Phone, 
  Calendar, 
  BarChart3, 
  Activity,
  ArrowUpRight,
  Plus,
  Upload,
  Target,
  CheckCircle
} from 'lucide-react'

export default function Dashboard() {
  // Mock data - in real app this would come from API
  const stats = {
    totalContacts: 1247,
    totalCompanies: 89,
    activeCampaigns: 12,
    conversionRate: 23.5,
    callsThisMonth: 456,
    revenue: 125000
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
      title: 'Import Contacts',
      description: 'Upload contacts from CSV file',
      icon: Upload,
      link: '/contacts/import',
      color: 'green'
    },
    {
      title: 'Start Campaign',
      description: 'Launch a new voice campaign',
      icon: Target,
      link: '/campaigns/new',
      color: 'purple'
    },
    {
      title: 'View Analytics',
      description: 'Check your performance metrics',
      icon: BarChart3,
      link: '/analytics',
      color: 'orange'
    }
  ]

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-8 lg:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">
              Dashboard
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
              Welcome back! Here's an overview of your voice agent campaigns and performance
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Last updated</p>
              <p className="text-sm font-medium text-gray-900">Just now</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Total Contacts</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalContacts.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">+12% from last month</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Companies</p>
            <p className="text-3xl font-bold text-gray-900">{stats.totalCompanies}</p>
            <p className="text-sm text-green-600 mt-1">+5 new this week</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
              <Target className="h-6 w-6 text-purple-600" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
            <p className="text-3xl font-bold text-gray-900">{stats.activeCampaigns}</p>
            <p className="text-sm text-green-600 mt-1">2 campaigns completed</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center">
              <Phone className="h-6 w-6 text-orange-600" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Calls This Month</p>
            <p className="text-3xl font-bold text-gray-900">{stats.callsThisMonth.toLocaleString()}</p>
            <p className="text-sm text-green-600 mt-1">+18% from last month</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-indigo-600" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
            <p className="text-3xl font-bold text-gray-900">{stats.conversionRate}%</p>
            <p className="text-sm text-green-600 mt-1">+2.3% improvement</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
              <Activity className="h-6 w-6 text-emerald-600" />
            </div>
            <ArrowUpRight className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-600">Revenue</p>
            <p className="text-3xl font-bold text-gray-900">${(stats.revenue / 1000).toFixed(0)}k</p>
            <p className="text-sm text-green-600 mt-1">+15% from last month</p>
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