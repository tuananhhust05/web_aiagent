import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  DollarSign,
  TrendingUp,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  X,
  Play,
  Pause
} from 'lucide-react'
import { dealsAPI, campaignsAPI, campaignGoalsAPI, groupsAPI, contactsAPI } from '../lib/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import DealCreateModal from '../components/DealCreateModal'
import DealDetailModal from '../components/DealDetailModal'
import DealEditModal from '../components/DealEditModal'

interface Deal {
  id: string
  name: string
  description?: string
  contact_id: string
  campaign_id?: string
  start_date?: string
  end_date?: string
  status: 'new' | 'contacted' | 'negotiation'
  cost: number
  revenue: number
  created_at: string
  updated_at: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  campaign_name?: string
}

interface DealStats {
  total_deals: number
  new_deals: number
  contacted_deals: number
  negotiation_deals: number
  total_revenue: number
  total_cost: number
  total_profit: number
}

interface CampaignGoal {
  id: string
  name: string
  description?: string
  color_gradient: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Campaign {
  id: string
  name: string
  status: string
  type: string
  created_at: string
  description?: string
  source?: string
}

interface Group {
  id: string
  name: string
  description?: string
  member_count: number
  color?: string
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  whatsapp_number?: string
  telegram_username?: string
  linkedin_profile?: string
  status: 'active' | 'inactive' | 'lead' | 'customer' | 'prospect'
  campaigns: Array<{
    id: string
    name: string
    status: string
    type: string
    created_at: string
  }>
  created_at: string
  updated_at: string
}

interface DealListResponse {
  deals: Deal[]
  total: number
  page: number
  limit: number
  stats: DealStats
}

const Deals: React.FC = () => {
  const navigate = useNavigate()
  const [deals, setDeals] = useState<Deal[]>([])
  const [stats, setStats] = useState<DealStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'contacted' | 'negotiation'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  
  // Campaign Goals state
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false)
  const [campaignGoals, setCampaignGoals] = useState<CampaignGoal[]>([])
  
  // Convention Campaigns state
  const [showCampaignModal] = useState(false)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showContactSelector, setShowContactSelector] = useState(false)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [contactSearchTerm, setContactSearchTerm] = useState('')

  const fetchDeals = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params: any = {
        page: currentPage,
        limit: 10
      }
      
      if (statusFilter !== 'all') {
        params.status = statusFilter
      }
      
      if (searchTerm.trim()) {
        params.search = searchTerm.trim()
      }
      
      const response = await dealsAPI.getDeals(params)
      const data: DealListResponse = response.data
      
      setDeals(data.deals)
      setStats(data.stats)
      setTotalPages(Math.ceil(data.total / data.limit))
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch deals')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDeals()
  }, [currentPage, statusFilter])

  useEffect(() => {
    fetchCampaignGoals()
    fetchGroups()
    fetchAllContacts()
  }, [])

  useEffect(() => {
    if (showCampaignModal) {
      fetchConventionCampaigns()
    }
  }, [showCampaignModal])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchDeals()
  }

  const handleStatusFilter = (status: 'all' | 'new' | 'contacted' | 'negotiation') => {
    setStatusFilter(status)
    setCurrentPage(1)
  }

  const handleDeleteDeal = async (dealId: string) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) {
      return
    }
    
    try {
      await dealsAPI.deleteDeal(dealId)
      await fetchDeals()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete deal')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'contacted':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'negotiation':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800'
      case 'negotiation':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Campaign Goals functions
  const fetchCampaignGoals = async () => {
    try {
      const response = await campaignGoalsAPI.getGoals('deals')
      setCampaignGoals(response.data || [])
    } catch (error) {
      console.error('Error fetching campaign goals:', error)
    }
  }

  const createCampaignGoal = (goalData: { name: string; description?: string }) => {
    const goalDataWithSource = {
      ...goalData,
      source: 'deals'
    }
    
    campaignGoalsAPI.createGoal(goalDataWithSource)
      .then(() => {
        fetchCampaignGoals()
        setShowCreateGoalModal(false)
      })
      .catch((error) => {
        console.error('Campaign goal creation error:', error)
        alert('Failed to create campaign goal')
      })
  }

  // Convention Campaigns functions
  const fetchConventionCampaigns = async () => {
    try {
      const response = await campaignsAPI.getCampaigns()
      const allCampaigns = response.data || []
      const dealsCampaigns = allCampaigns.filter((campaign: any) => campaign.source === 'deals')
      setCampaigns(dealsCampaigns)
    } catch (error) {
      console.error('Error fetching deals campaigns:', error)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await groupsAPI.getGroups()
      setGroups(response.data?.groups || [])
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchAllContacts = async () => {
    try {
      const response = await contactsAPI.getContacts({ limit: 1000 })
      const contacts = response.data || []
      
      const transformedContacts = contacts.map((contact: any) => ({
        ...contact,
        id: contact._id,
        name: `${contact.first_name} ${contact.last_name}`.trim()
      }))
      setAllContacts(transformedContacts)
    } catch (error) {
      console.error('Error fetching contacts:', error)
    }
  }

  const createCampaign = (campaignData: any) => {
    const newCampaign = {
      name: campaignData.name || '',
      description: campaignData.description || '',
      status: 'draft',
      type: campaignData.type || 'manual',
      source: 'deals',
      campaign_goal_id: campaignData.campaign_goal_id || null,
      contacts: selectedContacts.filter(id => id !== null && id !== undefined),
      group_ids: campaignData.group_ids || [],
      call_script: campaignData.call_script || '',
      schedule_time: campaignData.type === 'scheduled' && campaignData.schedule_time ? campaignData.schedule_time : null,
      schedule_settings: campaignData.type === 'scheduled' ? campaignData.schedule_settings : null,
      settings: {}
    }
    
    campaignsAPI.createCampaign(newCampaign)
      .then(() => {
        setShowCreateCampaign(false)
        setSelectedContacts([])
        alert('Campaign created successfully!')
        fetchConventionCampaigns()
      })
      .catch((error) => {
        console.error('Campaign creation error:', error)
        alert('Failed to create campaign')
      })
  }

  const handleContactToggle = (contactId: string) => {
    if (!contactId) return
    
    setSelectedContacts(prev => {
      const isSelected = prev.includes(contactId)
      return isSelected 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    })
  }

  const handleCampaignAction = (campaignId: string, action: string, campaignType?: string) => {
    if (action === 'active') {
      campaignsAPI.startCampaign(campaignId)
        .then((response) => {
          if (campaignType === 'manual') {
            alert(response.data.message || 'Manual campaign executed successfully')
          } else {
            alert('Scheduled campaign started successfully')
            fetchConventionCampaigns()
          }
        })
        .catch(() => alert('Failed to start campaign'))
    } else if (action === 'paused') {
      campaignsAPI.pauseCampaign(campaignId)
        .then(() => {
          alert('Campaign paused successfully')
          fetchConventionCampaigns()
        })
        .catch(() => alert('Failed to pause campaign'))
    }
  }

  const handleDeleteCampaign = (campaignId: string, campaignName: string) => {
    if (window.confirm(`Are you sure you want to delete campaign "${campaignName}"? This action cannot be undone.`)) {
      campaignsAPI.deleteCampaign(campaignId)
        .then(() => {
          alert('Campaign deleted successfully')
          fetchConventionCampaigns()
        })
        .catch(() => alert('Failed to delete campaign'))
    }
  }

  if (loading && deals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Deals Management</h1>
          <p className="text-gray-600">Manage your business deals and track revenue</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Deal
        </button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Deals</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total_deals}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.total_revenue)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Cost</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.total_cost)}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-full">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Profit</p>
                <p className={`text-2xl font-bold ${stats.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(stats.total_profit)}
                </p>
              </div>
              <div className={`p-3 rounded-full ${stats.total_profit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                <TrendingUp className={`h-6 w-6 ${stats.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Status Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">New Deals</p>
                <p className="text-xl font-bold text-blue-600">{stats.new_deals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Contacted</p>
                <p className="text-xl font-bold text-yellow-600">{stats.contacted_deals}</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-600">Negotiation</p>
                <p className="text-xl font-bold text-green-600">{stats.negotiation_deals}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Goals Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Campaign Goals</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {campaignGoals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => navigate(`/campaign-goals/${goal.id}`)}
              className="relative rounded-lg p-4 text-white font-medium text-center cursor-pointer hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-center"
              style={{ background: goal.color_gradient }}
            >
              <div className="text-lg font-semibold mb-2">{goal.name}</div>
              {!goal.is_active && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                  Inactive
                </div>
              )}
            </div>
          ))}
          
          {/* Add New Goal Button */}
          <div
            onClick={() => setShowCreateGoalModal(true)}
            className="relative rounded-lg p-4 text-white font-medium text-center cursor-pointer hover:shadow-lg transition-shadow min-h-[120px] flex flex-col justify-center items-center"
            style={{ background: 'linear-gradient(to right, #8B5CF6, #EC4899)' }}
          >
            <Plus className="h-8 w-8 mb-2" />
            <div className="text-sm font-semibold">Add New Goal</div>
          </div>
        </div>
        
        {campaignGoals.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No campaign goals found</p>
            <p className="text-sm text-gray-500 mt-2">Create your first campaign goal to get started</p>
          </div>
        )}
      </div>

      {/* Deals Campaigns Section */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Deals Campaigns</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900 truncate">{campaign.name}</h3>
                <div className="flex items-center space-x-1">
                  {campaign.status === 'draft' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCampaignAction(campaign.id, 'active', campaign.type);
                      }}
                      className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Start
                    </button>
                  )}
                  {campaign.status === 'active' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCampaignAction(campaign.id, 'paused');
                      }}
                      className="inline-flex items-center px-2 py-1 bg-yellow-600 text-white text-xs rounded hover:bg-yellow-700 transition-colors"
                    >
                      <Pause className="h-3 w-3 mr-1" />
                      Pause
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCampaignAction(campaign.id, 'active', campaign.type);
                      }}
                      className="inline-flex items-center px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Resume
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCampaign(campaign.id, campaign.name);
                    }}
                    className="inline-flex items-center px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 mb-3 text-sm line-clamp-2">{campaign.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-800' :
                  campaign.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                  campaign.status === 'paused' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {campaign.status}
                </span>
                <span className="text-sm text-gray-500">
                  {new Date(campaign.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <Link
                  to={`/campaigns/${campaign.id}`}
                  className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  View Details
                </Link>
                {campaign.source && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    Source: {campaign.source}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {/* Add New Campaign Button */}
          <div
            onClick={() => setShowCreateCampaign(true)}
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 hover:bg-blue-50 transition-colors cursor-pointer flex flex-col items-center justify-center min-h-[200px]"
          >
            <Plus className="h-8 w-8 text-gray-400 mb-2" />
            <div className="text-gray-600 font-medium">Create Campaign</div>
            <div className="text-sm text-gray-500 text-center">Start a new campaign for your deals</div>
          </div>
        </div>
        
        {campaigns.length === 0 && (
          <div className="text-center py-8">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No deals campaigns found</p>
            <p className="text-sm text-gray-500 mt-2">Create your first campaign to get started</p>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => handleStatusFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                statusFilter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleStatusFilter('new')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                statusFilter === 'new'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              New
            </button>
            <button
              onClick={() => handleStatusFilter('contacted')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                statusFilter === 'contacted'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Contacted
            </button>
            <button
              onClick={() => handleStatusFilter('negotiation')}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                statusFilter === 'negotiation'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Negotiation
            </button>
          </div>

          <button
            onClick={handleSearch}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Deals List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit
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
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{deal.name}</div>
                      {deal.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {deal.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{deal.contact_name}</div>
                      {deal.contact_email && (
                        <div className="text-sm text-gray-500">{deal.contact_email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(deal.status)}`}>
                      {getStatusIcon(deal.status)}
                      {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-medium">
                    {formatCurrency(deal.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                    {formatCurrency(deal.cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <span className={deal.revenue - deal.cost >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(deal.revenue - deal.cost)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(deal.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDeal(deal)
                          setShowDetailModal(true)
                        }}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDeal(deal)
                          setShowEditModal(true)
                        }}
                        className="text-yellow-600 hover:text-yellow-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDeal(deal.id)}
                        className="text-red-600 hover:text-red-900"
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{currentPage}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Empty State */}
      {deals.length === 0 && !loading && (
        <div className="text-center py-12">
          <Target className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No deals yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Start managing your business deals by creating your first deal.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Deal
            </button>
          </div>
        </div>
      )}

      {/* Create Deal Modal */}
      <DealCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchDeals}
      />

      {/* Deal Detail Modal */}
      <DealDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        deal={selectedDeal}
        onEdit={() => {
          setShowDetailModal(false)
          setShowEditModal(true)
        }}
        onDelete={() => {
          if (selectedDeal) {
            handleDeleteDeal(selectedDeal.id)
            setShowDetailModal(false)
          }
        }}
      />

      {/* Deal Edit Modal */}
      <DealEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        deal={selectedDeal}
        onSuccess={fetchDeals}
      />

      {/* Create Campaign Goal Modal */}
      {showCreateGoalModal && (
        <CreateCampaignGoalModal
          onClose={() => setShowCreateGoalModal(false)}
          onSubmit={createCampaignGoal}
        />
      )}

      {/* Create Campaign Modal */}
      {showCreateCampaign && (
        <CreateDealsCampaignModal
          onClose={() => setShowCreateCampaign(false)}
          onSubmit={createCampaign}
          onSelectContacts={() => setShowContactSelector(true)}
          selectedContactsCount={selectedContacts.length}
          groups={groups}
          campaignGoals={campaignGoals}
        />
      )}

      {/* Contact Selector Modal */}
      {showContactSelector && (
        <ContactSelectorModal
          contacts={allContacts}
          selectedContacts={selectedContacts}
          onToggle={handleContactToggle}
          onClose={() => {
            setShowContactSelector(false);
            setContactSearchTerm('');
          }}
          onConfirm={() => setShowContactSelector(false)}
          searchTerm={contactSearchTerm}
          onSearchChange={setContactSearchTerm}
          loading={loading}
        />
      )}
    </div>
  )
}

// Create Campaign Goal Modal Component
function CreateCampaignGoalModal({ 
  onClose, 
  onSubmit 
}: { 
  onClose: () => void
  onSubmit: (data: { name: string; description?: string }) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a goal name');
      return;
    }
    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Campaign Goal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Book a Meeting, Lead Nurturing"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe what this goal aims to achieve..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Create Deals Campaign Modal Component
function CreateDealsCampaignModal({ onClose, onSubmit, onSelectContacts, selectedContactsCount, groups, campaignGoals }: {
  onClose: () => void
  onSubmit: (data: any) => void
  onSelectContacts: () => void
  selectedContactsCount: number
  groups: Group[]
  campaignGoals: CampaignGoal[]
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'manual' as 'manual' | 'scheduled',
    call_script: '',
    schedule_time: '',
    group_ids: [] as string[],
    campaign_goal_id: '' as string,
    schedule_settings: {
      frequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'yearly',
      start_time: '',
      end_time: '',
      timezone: 'UTC',
      days_of_week: [] as number[],
      day_of_month: 1,
      month_of_year: 1
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Campaign name is required')
      return
    }
    if (!formData.call_script.trim()) {
      alert('Call script is required')
      return
    }
    if (formData.group_ids.length === 0 && selectedContactsCount === 0) {
      alert('Please select at least one group or contact')
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create Deals Campaign</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Describe your campaign"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="campaignType"
                  value="manual"
                  checked={formData.type === 'manual'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'manual' | 'scheduled' }))}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg transition-all ${
                  formData.type === 'manual'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      formData.type === 'manual'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.type === 'manual' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Manual</div>
                      <div className="text-sm text-gray-500">Start calls manually when you're ready</div>
                    </div>
                  </div>
                </div>
              </label>

              <label className="relative cursor-pointer">
                <input
                  type="radio"
                  name="campaignType"
                  value="scheduled"
                  checked={formData.type === 'scheduled'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'manual' | 'scheduled' }))}
                  className="sr-only"
                />
                <div className={`p-4 border-2 rounded-lg transition-all ${
                  formData.type === 'scheduled'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-4 h-4 rounded-full border-2 mr-3 ${
                      formData.type === 'scheduled'
                        ? 'border-blue-500 bg-blue-500'
                        : 'border-gray-300'
                    }`}>
                      {formData.type === 'scheduled' && (
                        <div className="w-2 h-2 bg-white rounded-full m-0.5"></div>
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">Scheduled</div>
                      <div className="text-sm text-gray-500">Automatically start calls at scheduled time with frequency</div>
                    </div>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {formData.type === 'scheduled' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">📅 Schedule Settings</h3>
                <p className="text-sm text-blue-600">
                  Configure when and how often the campaign should run automatically.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Frequency
                </label>
                <select
                  value={formData.schedule_settings.frequency}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    schedule_settings: { ...prev.schedule_settings, frequency: e.target.value as any }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Call Time (When to start calling)
                </label>
                <input
                  type="datetime-local"
                  value={formData.schedule_settings.start_time}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    schedule_settings: { ...prev.schedule_settings, start_time: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">
                  Set the specific time when AI calls should start. Campaign will run automatically at this time.
                </p>
              </div>

              {formData.schedule_settings.frequency === 'weekly' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Days of Week
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                      <label key={day} className="flex items-center justify-center p-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={formData.schedule_settings.days_of_week.includes(index)}
                          onChange={(e) => {
                            const days = formData.schedule_settings.days_of_week
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                schedule_settings: {
                                  ...prev.schedule_settings,
                                  days_of_week: [...days, index]
                                }
                              }))
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                schedule_settings: {
                                  ...prev.schedule_settings,
                                  days_of_week: days.filter(d => d !== index)
                                }
                              }))
                            }
                          }}
                          className="mr-1"
                        />
                        <span className="text-sm">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.schedule_settings.frequency === 'monthly' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Month
                    </label>
                    <select
                      value={formData.schedule_settings.month_of_year}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        schedule_settings: { ...prev.schedule_settings, month_of_year: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, index) => (
                        <option key={month} value={index + 1}>{month}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Day
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formData.schedule_settings.day_of_month}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        schedule_settings: { ...prev.schedule_settings, day_of_month: parseInt(e.target.value) }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.schedule_settings.end_time}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    schedule_settings: { ...prev.schedule_settings, end_time: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Optional: Set when the campaign should stop running automatically.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Timezone
                </label>
                <select
                  value={formData.schedule_settings.timezone}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    schedule_settings: { ...prev.schedule_settings, timezone: e.target.value }
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="UTC">UTC (Coordinated Universal Time)</option>
                  <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (Vietnam)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                  <option value="America/Los_Angeles">America/Los_Angeles (PST)</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="Europe/Rome">Europe/Rome (Italy)</option>
                  <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                </select>
                <p className="text-sm text-gray-500 mt-1">
                  Select the timezone for your call schedule.
                </p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call Script
            </label>
            <textarea
              value={formData.call_script}
              onChange={(e) => setFormData(prev => ({ ...prev, call_script: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter the script that AI will use when making calls..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Goal (Optional)
            </label>
            <select
              value={formData.campaign_goal_id}
              onChange={(e) => setFormData(prev => ({ ...prev, campaign_goal_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a campaign goal (optional)</option>
              {campaignGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Groups (Optional)
            </label>
            {groups.length === 0 ? (
              <div className="text-sm text-gray-500 p-4 border border-gray-200 rounded-lg bg-gray-50">
                No groups available. Create groups first.
              </div>
            ) : (
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded-lg p-3">
                {groups.map((group) => (
                  <label key={group.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.group_ids.includes(group.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            group_ids: [...prev.group_ids, group.id]
                          }))
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            group_ids: prev.group_ids.filter(id => id !== group.id)
                          }))
                        }
                      }}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700">{group.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Contacts
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={onSelectContacts}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div className="text-gray-600">
                  {selectedContactsCount > 0 || formData.group_ids.length > 0
                    ? `${selectedContactsCount} contacts + ${formData.group_ids.length} groups selected`
                    : 'Click to select contacts'
                  }
                </div>
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Contact Selector Modal Component
function ContactSelectorModal({ 
  contacts, 
  selectedContacts, 
  onToggle, 
  onClose, 
  onConfirm,
  searchTerm,
  onSearchChange,
  loading 
}: {
  contacts: Contact[]
  selectedContacts: string[]
  onToggle: (id: string) => void
  onClose: () => void
  onConfirm: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  loading: boolean
}) {
  const filteredContacts = contacts.filter(contact => 
    contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Select Contacts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No contacts found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={!!(contact.id && selectedContacts.includes(contact.id))}
                    onChange={() => {
                      if (contact.id) {
                        onToggle(contact.id);
                      }
                    }}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contact.email} • {contact.phone}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirm Selection ({selectedContacts.length} selected)
          </button>
        </div>
      </div>
    </div>
  )
}

export default Deals
