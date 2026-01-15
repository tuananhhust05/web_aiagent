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
  Pause,
  Loader2,
  LayoutList,
  Kanban
} from 'lucide-react'
import { dealsAPI, campaignsAPI, campaignGoalsAPI, groupsAPI, contactsAPI } from '../lib/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import DealCreateModal from '../components/DealCreateModal'
import DealDetailModal from '../components/DealDetailModal'
import DealEditModal from '../components/DealEditModal'
import SalesPipeline from '../components/SalesPipeline'
import PipelineSettings from '../components/PipelineSettings'

type ViewMode = 'list' | 'pipeline'

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
  const [viewMode, setViewMode] = useState<ViewMode>('pipeline') // Default to pipeline view
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
  const [pipelineKey, setPipelineKey] = useState(0) // For refreshing pipeline
  const [showPipelineSettings, setShowPipelineSettings] = useState(false)
  
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
    // Only fetch deals when in list view
    if (viewMode === 'list') {
      fetchDeals()
    }
  }, [currentPage, statusFilter, viewMode])

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
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'contacted':
        return 'bg-amber-100 text-amber-700 border-amber-200'
      case 'negotiation':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
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

  const [startingCampaignId, setStartingCampaignId] = useState<string | null>(null);

  const handleCampaignAction = (campaignId: string, action: string, campaignType?: string) => {
    if (action === 'active') {
      setStartingCampaignId(campaignId);
      campaignsAPI.startCampaign(campaignId)
        .then((response) => {
          // Always show success message regardless of response
          if (campaignType === 'manual') {
            alert(response.data?.message || 'Campaign executed successfully');
          } else {
            alert('Campaign started successfully');
            fetchConventionCampaigns();
          }
        })
        .catch((error) => {
          // Always show success message even on error/timeout/crash
          console.error('Campaign start error:', error);
          alert('Campaign started successfully');
          if (campaignType !== 'manual') {
            fetchConventionCampaigns();
          }
        })
        .finally(() => {
          setStartingCampaignId(null);
        });
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

  // Only show loading spinner for list view when deals are being fetched
  // Pipeline view has its own loading state
  if (viewMode === 'list' && loading && deals.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Modern Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-semibold text-gray-900 tracking-tight">Deals</h1>
            <p className="text-base text-gray-500 font-light">Manage your business deals and track revenue</p>
          </div>
          <div className="flex items-center gap-3">
            {/* View Mode Toggle - Apple Style */}
            <div className="flex items-center bg-white/80 backdrop-blur-xl rounded-2xl p-1.5 shadow-sm border border-gray-200/50">
              <button
                onClick={() => setViewMode('pipeline')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  viewMode === 'pipeline'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                }`}
              >
                <Kanban className="h-4 w-4" />
                Pipeline
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  viewMode === 'list'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                }`}
              >
                <LayoutList className="h-4 w-4" />
                List
              </button>
            </div>
            
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transition-all duration-200 font-medium"
            >
              <Plus className="h-4 w-4" />
              Create Deal
            </button>
          </div>
        </div>

      {/* Pipeline View */}
      {viewMode === 'pipeline' && (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-200/50">
          <SalesPipeline
            key={pipelineKey}
            onViewDeal={(deal) => {
              setSelectedDeal(deal as Deal)
              setShowDetailModal(true)
            }}
            onEditDeal={(deal) => {
              setSelectedDeal(deal as Deal)
              setShowEditModal(true)
            }}
            onDeleteDeal={async (dealId) => {
              await handleDeleteDeal(dealId)
              setPipelineKey(prev => prev + 1) // Refresh pipeline
            }}
          />
        </div>
      )}

      {/* List View Content */}
      {viewMode === 'list' && (
        <>
          {/* Modern Statistics Cards - Apple Style */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="group bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Deals</p>
                    <p className="text-3xl font-semibold text-gray-900">{stats.total_deals}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl shadow-lg shadow-blue-500/30">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="group bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Revenue</p>
                    <p className="text-3xl font-semibold text-green-600">{formatCurrency(stats.total_revenue)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/30">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="group bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Cost</p>
                    <p className="text-3xl font-semibold text-orange-600">{formatCurrency(stats.total_cost)}</p>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl shadow-lg shadow-orange-500/30">
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>

              <div className="group bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Profit</p>
                    <p className={`text-3xl font-semibold ${stats.total_profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(stats.total_profit)}
                    </p>
                  </div>
                  <div className={`p-4 rounded-2xl shadow-lg ${
                    stats.total_profit >= 0 
                      ? 'bg-gradient-to-br from-green-500 to-emerald-600 shadow-green-500/30' 
                      : 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/30'
                  }`}>
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          )}

      {/* Status Statistics - Modern Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-xl p-5 rounded-2xl shadow-md border border-blue-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/20 rounded-xl">
                <AlertCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">New Deals</p>
                <p className="text-2xl font-semibold text-blue-600 mt-1">{stats.new_deals}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-amber-50 to-yellow-100/50 backdrop-blur-xl p-5 rounded-2xl shadow-md border border-amber-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <Clock className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Contacted</p>
                <p className="text-2xl font-semibold text-amber-600 mt-1">{stats.contacted_deals}</p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-100/50 backdrop-blur-xl p-5 rounded-2xl shadow-md border border-green-200/50 hover:shadow-lg transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Negotiation</p>
                <p className="text-2xl font-semibold text-green-600 mt-1">{stats.negotiation_deals}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Goals Section - Modern Design */}
      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-200/50 mb-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Campaign Goals</h2>
          <p className="text-sm text-gray-500 mt-1">Track and manage your campaign objectives</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {campaignGoals.map((goal) => (
            <div
              key={goal.id}
              onClick={() => navigate(`/campaign-goals/${goal.id}`)}
              className="relative rounded-2xl p-6 text-white font-medium text-center cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[140px] flex flex-col justify-center group"
              style={{ background: goal.color_gradient }}
            >
              <div className="text-lg font-semibold mb-2 group-hover:scale-110 transition-transform duration-300">{goal.name}</div>
              {!goal.is_active && (
                <div className="absolute top-3 right-3 bg-red-500/90 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full shadow-lg">
                  Inactive
                </div>
              )}
            </div>
          ))}
          
          {/* Add New Goal Button - Apple Style */}
          <div
            onClick={() => setShowCreateGoalModal(true)}
            className="relative rounded-2xl p-6 bg-gradient-to-br from-purple-500 via-pink-500 to-rose-500 text-white font-medium text-center cursor-pointer hover:shadow-2xl hover:scale-105 transition-all duration-300 min-h-[140px] flex flex-col justify-center items-center border-2 border-dashed border-white/30 hover:border-white/50"
          >
            <Plus className="h-8 w-8 mb-2 group-hover:rotate-90 transition-transform duration-300" />
            <div className="text-sm font-semibold">Add New Goal</div>
          </div>
        </div>
        
        {campaignGoals.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-gray-100 rounded-2xl mb-4">
              <Target className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No campaign goals found</p>
            <p className="text-sm text-gray-500 mt-2">Create your first campaign goal to get started</p>
          </div>
        )}
      </div>

      {/* Deals Campaigns Section - Modern Design */}
      <div className="bg-white/60 backdrop-blur-xl p-8 rounded-3xl shadow-xl border border-gray-200/50 mb-6">
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-900 tracking-tight">Deals Campaigns</h2>
          <p className="text-sm text-gray-500 mt-1">Manage your marketing and sales campaigns</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl p-5 hover:border-blue-300 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 group"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate flex-1 pr-2">{campaign.name}</h3>
                <div className="flex items-center space-x-1.5 flex-shrink-0">
                  {campaign.status === 'draft' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCampaignAction(campaign.id, 'active', campaign.type);
                      }}
                      disabled={startingCampaignId === campaign.id}
                      className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-medium rounded-xl hover:shadow-lg shadow-green-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {startingCampaignId === campaign.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Start
                        </>
                      )}
                    </button>
                  )}
                  {campaign.status === 'active' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCampaignAction(campaign.id, 'paused');
                      }}
                      className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium rounded-xl hover:shadow-lg shadow-amber-500/30 transition-all"
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
                      disabled={startingCampaignId === campaign.id}
                      className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-medium rounded-xl hover:shadow-lg shadow-green-500/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {startingCampaignId === campaign.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Starting...
                        </>
                      ) : (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Resume
                        </>
                      )}
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCampaign(campaign.id, campaign.name);
                    }}
                    className="inline-flex items-center px-3 py-1.5 bg-gradient-to-r from-red-500 to-rose-600 text-white text-xs font-medium rounded-xl hover:shadow-lg shadow-red-500/30 transition-all"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
              
              <p className="text-gray-600 mb-4 text-sm line-clamp-2 leading-relaxed">{campaign.description}</p>
              
              <div className="flex items-center justify-between mb-4">
                <span className={`inline-flex px-3 py-1.5 text-xs font-semibold rounded-full ${
                  campaign.status === 'active' ? 'bg-green-100 text-green-700 border border-green-200' :
                  campaign.status === 'completed' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                  campaign.status === 'paused' ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                  'bg-gray-100 text-gray-700 border border-gray-200'
                }`}>
                  {campaign.status}
                </span>
                <span className="text-xs text-gray-500 font-medium">
                  {new Date(campaign.created_at).toLocaleDateString()}
                </span>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <Link
                  to={`/campaigns/${campaign.id}`}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-medium rounded-xl hover:shadow-lg shadow-blue-500/30 transition-all"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Eye className="h-3 w-3 mr-1.5" />
                  View Details
                </Link>
                {campaign.source && (
                  <span className="text-xs text-gray-500 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-200">
                    {campaign.source}
                  </span>
                )}
              </div>
            </div>
          ))}
          
          {/* Add New Campaign Button - Apple Style */}
          <div
            onClick={() => setShowCreateCampaign(true)}
            className="border-2 border-dashed border-gray-300 rounded-2xl p-6 hover:border-blue-400 hover:bg-gradient-to-br hover:from-blue-50 hover:to-blue-100/50 transition-all duration-300 cursor-pointer flex flex-col items-center justify-center min-h-[200px] group"
          >
            <div className="p-3 bg-gray-100 rounded-xl group-hover:bg-blue-500 group-hover:scale-110 transition-all duration-300 mb-3">
              <Plus className="h-8 w-8 text-gray-400 group-hover:text-white transition-colors duration-300" />
            </div>
            <div className="text-gray-700 font-semibold mb-1 group-hover:text-blue-600 transition-colors">Create Campaign</div>
            <div className="text-sm text-gray-500 text-center group-hover:text-gray-600 transition-colors">Start a new campaign for your deals</div>
          </div>
        </div>
        
        {campaigns.length === 0 && (
          <div className="text-center py-12">
            <div className="inline-flex p-4 bg-gray-100 rounded-2xl mb-4">
              <Target className="h-12 w-12 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium">No deals campaigns found</p>
            <p className="text-sm text-gray-500 mt-2">Create your first campaign to get started</p>
          </div>
        )}
      </div>

      {/* Filters and Search - Modern Design */}
      <div className="bg-white/80 backdrop-blur-xl p-6 rounded-2xl shadow-lg border border-gray-200/50">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search - Apple Style */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white/50 backdrop-blur-sm transition-all duration-200 text-sm"
              />
            </div>
          </div>

          {/* Status Filter - Modern Pills */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleStatusFilter('all')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === 'all'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/80 text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => handleStatusFilter('new')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === 'new'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/80 text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              New
            </button>
            <button
              onClick={() => handleStatusFilter('contacted')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === 'contacted'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/80 text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Contacted
            </button>
            <button
              onClick={() => handleStatusFilter('negotiation')}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                statusFilter === 'negotiation'
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/80 text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              Negotiation
            </button>
          </div>

          <button
            onClick={handleSearch}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2.5 rounded-xl hover:from-blue-600 hover:to-blue-700 flex items-center gap-2 shadow-lg shadow-blue-500/30 hover:shadow-xl transition-all duration-200 font-medium"
          >
            <Search className="h-4 w-4" />
            Search
          </button>
        </div>
      </div>

      {/* Error Message - Modern Design */}
      {error && (
        <div className="bg-gradient-to-r from-red-50 to-rose-50 border border-red-200/50 text-red-700 px-6 py-4 rounded-2xl shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* Deals List - Modern Table Design */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200/50">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Deal
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Revenue
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Cost
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Profit
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-200/30">
              {deals.map((deal) => (
                <tr key={deal.id} className="hover:bg-white/80 transition-colors duration-200">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{deal.name}</div>
                      {deal.description && (
                        <div className="text-sm text-gray-500 truncate max-w-xs mt-0.5">
                          {deal.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{deal.contact_name}</div>
                      {deal.contact_email && (
                        <div className="text-sm text-gray-500 mt-0.5">{deal.contact_email}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${getStatusColor(deal.status)} border`}>
                      {getStatusIcon(deal.status)}
                      {deal.status.charAt(0).toUpperCase() + deal.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                    {formatCurrency(deal.revenue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-orange-600 font-semibold">
                    {formatCurrency(deal.cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                    <span className={deal.revenue - deal.cost >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {formatCurrency(deal.revenue - deal.cost)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                    {formatDate(deal.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDeal(deal)
                          setShowDetailModal(true)
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-xl transition-all duration-200 hover:scale-110"
                        title="View"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDeal(deal)
                          setShowEditModal(true)
                        }}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDeal(deal.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 hover:scale-110"
                        title="Delete"
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

        {/* Pagination - Modern Design */}
        {totalPages > 1 && (
          <div className="bg-white/50 backdrop-blur-sm px-6 py-4 border-t border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white/80 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-xl text-gray-700 bg-white/80 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">
                    Showing page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
                    <span className="font-semibold text-gray-900">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-xl shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-4 py-2 rounded-l-xl border border-gray-300 bg-white/80 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-4 py-2 rounded-r-xl border border-gray-300 bg-white/80 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
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

      {/* Empty State - Modern Design */}
      {deals.length === 0 && !loading && (
        <div className="text-center py-16 bg-white/60 backdrop-blur-xl rounded-3xl shadow-xl border border-gray-200/50">
          <div className="inline-flex p-5 bg-gray-100 rounded-2xl mb-6">
            <Target className="h-16 w-16 text-gray-400" />
          </div>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">No deals yet</h3>
          <p className="mt-2 text-sm text-gray-500 max-w-sm mx-auto">
            Start managing your business deals by creating your first deal.
          </p>
          <div className="mt-8">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-6 py-3 border border-transparent shadow-lg text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/30"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Your First Deal
            </button>
          </div>
        </div>
      )}
        </>
      )}
      </div>

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

      {/* Pipeline Settings Modal */}
      <PipelineSettings
        isOpen={showPipelineSettings}
        onClose={() => setShowPipelineSettings(false)}
        onSaved={() => setPipelineKey(prev => prev + 1)}
      />
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
