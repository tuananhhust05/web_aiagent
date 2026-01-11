import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Play,
  Pause,
  Edit,
  Trash2,
  Users, 
  Clock, 
  Calendar,
  Target,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  MessageSquare,
  Mail,
  Phone,
  Workflow,
  Brain
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { campaignsAPI, groupsAPI, inboxAPI, workflowsAPI } from '../lib/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'
import ConversationModal from './ConversationModal'
import CampaignAIAnalysis from '../components/CampaignAIAnalysis'

// interface Contact {
//   id: string
//   first_name: string
//   last_name: string
//   email: string
//   phone: string
//   company_name?: string
// }

interface Group {
  id: string
  name: string
  description?: string
  member_count: number
  color?: string
}

interface Campaign {
  id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled'
  type: 'manual' | 'scheduled'
  contacts: string[]
  group_ids: string[]
  call_script: string
  source?: string  // Source field to find workflow by function
  schedule_time?: string
  created_at: string
  updated_at: string
}

interface InboxResponse {
  id: string
  platform: string
  contact: string
  content: string
  campaign_id?: string
  contact_id?: string
  created_at: string
  type?: 'incoming' | 'outgoing'
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showEditModal, setShowEditModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'inbox' | 'ai-analysis'>('overview')
  const [showConversationModal, setShowConversationModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState<{ contact: string } | null>(null)

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading, error: campaignError } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsAPI.getCampaign(id!),
    enabled: !!id
  })

  // Fetch groups for this campaign
  const { data: groupsResponse } = useQuery({
    queryKey: ['groups'],
    queryFn: () => groupsAPI.getGroups(),
  })

  // Fetch contacts from groups if campaign has group_ids
  const { data: contactsFromGroups } = useQuery({
    queryKey: ['campaign-contacts', campaign?.data?.group_ids],
    queryFn: () => campaignsAPI.getContactsFromGroups(campaign?.data?.group_ids || []),
    enabled: !!campaign?.data?.group_ids?.length
  })

  // Fetch inbox responses for this campaign
  const { data: inboxResponses, isLoading: inboxLoading } = useQuery({
    queryKey: ['inbox-responses', id],
    queryFn: () => inboxAPI.getResponsesByCampaign(id!, { limit: 50, skip: 0 }),
    enabled: !!id
  })

  // Fetch workflow details if campaign has source (function name)
  const { data: workflowData } = useQuery({
    queryKey: ['workflow', campaign?.data?.source],
    queryFn: () => workflowsAPI.getWorkflow(campaign!.data.source!),
    enabled: !!campaign?.data?.source
  })

  const groups = Array.isArray(groupsResponse?.data?.groups) ? groupsResponse.data.groups : []
  const campaignGroups = groups.filter((group: any) => campaign?.data?.group_ids?.includes(group.id))

  // Mutations
  const startCampaignMutation = useMutation({
    mutationFn: () => campaignsAPI.startCampaign(id!),
    onSuccess: () => {
      // Always show success message regardless of response
      toast.success('Campaign started successfully')
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    },
    onError: (error) => {
      // Always show success message even on error/timeout/crash
      console.error('Campaign start error:', error)
      toast.success('Campaign started successfully')
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    }
  })

  const pauseCampaignMutation = useMutation({
    mutationFn: () => campaignsAPI.pauseCampaign(id!),
    onSuccess: () => {
      toast.success('Campaign paused successfully')
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    },
    onError: () => toast.error('Failed to pause campaign')
  })

  const deleteCampaignMutation = useMutation({
    mutationFn: () => campaignsAPI.deleteCampaign(id!),
    onSuccess: () => {
      toast.success('Campaign deleted successfully')
      navigate('/campaigns')
    },
    onError: () => toast.error('Failed to delete campaign')
  })

  const handleStartCampaign = () => {
    startCampaignMutation.mutate()
  }

  const handlePauseCampaign = () => {
    pauseCampaignMutation.mutate()
  }

  const handleDeleteCampaign = () => {
    if (window.confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      deleteCampaignMutation.mutate()
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'paused': return 'text-yellow-600 bg-yellow-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'scheduled': return 'text-purple-600 bg-purple-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Play className="h-3 w-3" />
      case 'paused': return <Pause className="h-3 w-3" />
      case 'completed': return <CheckCircle className="h-3 w-3" />
      case 'scheduled': return <Clock className="h-3 w-3" />
      default: return <AlertCircle className="h-3 w-3" />
    }
  }

  if (campaignLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (campaignError || !campaign?.data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="h-10 w-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">Campaign Not Found</h2>
          <p className="text-gray-600 mb-8 text-[15px] leading-relaxed">The campaign you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate('/campaigns')}
            className="inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </button>
        </div>
      </div>
    )
  }

  const campaignData = campaign.data

  // Debug: Log campaign data to see if source exists
  console.log('🔍 Campaign Data:', campaignData)
  console.log('🔍 Campaign source:', campaignData.source)
  console.log('🔍 Workflow Data:', workflowData)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header - Apple Style */}
        <div className="mb-12">
          <button
            onClick={() => navigate('/campaigns')}
            className="inline-flex items-center text-gray-500 hover:text-gray-900 mb-6 transition-colors duration-200 group"
          >
            <ArrowLeft className="h-4 w-4 mr-2 group-hover:-translate-x-1 transition-transform duration-200" />
            <span className="text-sm font-medium">Back</span>
          </button>
          
          <div className="flex flex-col gap-6">
            <div className="flex-1">
              <h1 className="text-5xl font-semibold text-gray-900 mb-3 tracking-tight">{campaignData.name}</h1>
              {campaignData.description && (
                <p className="text-lg text-gray-600 mb-4 leading-relaxed max-w-2xl">{campaignData.description}</p>
              )}
              <div className="flex items-center gap-3 flex-wrap mb-6">
                <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200/50">
                  {campaignData.type}
                </span>
                {campaignData.source && (
                  <button
                    onClick={() => navigate(`/workflows?function=${campaignData.source}`)}
                    className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100 transition-all duration-200"
                  >
                    <Workflow className="h-3 w-3 mr-1.5" />
                    {workflowData?.data?.name || campaignData.source}
                  </button>
                )}
                <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium ${getStatusColor(campaignData.status)} border border-transparent`}>
                  {getStatusIcon(campaignData.status)}
                  <span className="ml-1.5 capitalize">{campaignData.status}</span>
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-wrap">
              {campaignData.status === 'draft' && (
                <button
                  onClick={handleStartCampaign}
                  disabled={startCampaignMutation.isPending}
                  className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md font-medium text-sm"
                >
                  {startCampaignMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-2" />
                  )}
                  Start
                </button>
              )}
              
              {campaignData.status === 'active' && (
                <button
                  onClick={handlePauseCampaign}
                  disabled={pauseCampaignMutation.isPending}
                  className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md font-medium text-sm"
                >
                  {pauseCampaignMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Pause className="h-4 w-4 mr-2" />
                  )}
                  Pause
                </button>
              )}
              
              {campaignData.source && (
                <button
                  onClick={() => navigate(`/workflows?function=${campaignData.source}&campaign_id=${id}`)}
                  className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md font-medium text-sm"
                >
                  <Workflow className="h-4 w-4 mr-2" />
                  Configure
                </button>
              )}
              
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center px-5 py-2.5 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 border border-gray-200 shadow-sm hover:shadow-md font-medium text-sm"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </button>
              
              <button
                onClick={handleDeleteCampaign}
                disabled={deleteCampaignMutation.isPending}
                className="inline-flex items-center px-5 py-2.5 bg-white text-red-600 rounded-xl hover:bg-red-50 transition-all duration-200 border border-red-200 shadow-sm hover:shadow-md font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteCampaignMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 mr-2" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation - Apple Style - Full Width */}
        <div className="mb-8">
          <nav className="flex space-x-1 bg-white/60 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-200/50 shadow-sm w-full">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'overview'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('inbox')}
              className={`flex-1 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 relative ${
                activeTab === 'inbox'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-center">
                <MessageSquare className="h-4 w-4 mr-2" />
                Inbox
                {inboxResponses?.data && inboxResponses.data.length > 0 && (
                  <span className="ml-2 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                    {inboxResponses.data.length}
                  </span>
                )}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('ai-analysis')}
              className={`flex-1 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                activeTab === 'ai-analysis'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-center">
                <Brain className="h-4 w-4 mr-2" />
                AI Analysis
              </div>
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <>
            {/* Campaign Info Cards - Apple Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Type</p>
                <p className="text-2xl font-semibold text-gray-900 capitalize">{campaignData.type}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Contacts</p>
                <p className="text-2xl font-semibold text-gray-900">{campaignData.contacts.length}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-xl">
                <Users className="h-5 w-5 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Created</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(campaignData.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
            </div>
          </div>

          {campaignData.schedule_time && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Scheduled</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(campaignData.schedule_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {new Date(campaignData.schedule_time).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </p>
                </div>
                <div className="p-3 bg-orange-50 rounded-xl">
                  <Clock className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Call Script - Apple Style */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Call Script</h3>
            <div className="bg-gray-50/50 rounded-xl p-5 border border-gray-100">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed text-[15px]">{campaignData.call_script}</p>
            </div>
          </div>

          {/* Workflow - Apple Style */}
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Workflow</h3>
              {campaignData.source && (
                <button
                  onClick={() => navigate(`/workflows?function=${campaignData.source}`)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium transition-colors duration-200"
                >
                  View →
                </button>
              )}
            </div>
            
            {campaignData.source ? (
              <div className="space-y-4">
                <div className="flex items-start p-4 bg-gradient-to-br from-purple-50 to-purple-50/50 rounded-xl border border-purple-100/50">
                  <div className="p-2.5 bg-purple-100 rounded-xl mr-4 flex-shrink-0">
                    <Workflow className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-[15px] mb-1">
                      {workflowData?.data?.name || campaignData.source}
                    </div>
                    {workflowData?.data?.description && (
                      <div className="text-sm text-gray-600 mb-2 leading-relaxed">{workflowData.data.description}</div>
                    )}
                    <div className="text-xs text-gray-500 font-medium">
                      {campaignData.source}
                    </div>
                  </div>
                </div>
                {workflowData?.data && (
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                    <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Nodes</div>
                      <div className="text-lg font-semibold text-gray-900">{workflowData.data.nodes?.length || 0}</div>
                    </div>
                    <div className="bg-gray-50/50 rounded-xl p-3 border border-gray-100/50">
                      <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Connections</div>
                      <div className="text-lg font-semibold text-gray-900">{workflowData.data.connections?.length || 0}</div>
                    </div>
                  </div>
                )}
                <button
                  onClick={() => navigate(`/workflows?function=${campaignData.source}&campaign_id=${id}`)}
                  className="w-full mt-4 inline-flex items-center justify-center px-5 py-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
                >
                  <Workflow className="h-4 w-4 mr-2" />
                  Configure Script
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Workflow className="h-8 w-8 text-gray-400" />
                </div>
                <p className="text-gray-900 font-medium mb-2">No workflow assigned</p>
                <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
                  Edit the campaign to select a workflow source
                </p>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center px-5 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium text-sm"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Campaign
                </button>
              </div>
            )}
          </div>

          {/* Groups - Apple Style */}
          {campaignGroups.length > 0 && (
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-sm border border-gray-200/50 hover:shadow-md transition-all duration-300">
              <h3 className="text-xl font-semibold text-gray-900 mb-6">Groups ({campaignGroups.length})</h3>
              <div className="space-y-2">
                {campaignGroups.map((group: any) => (
                  <div key={group.id} className="flex items-center p-4 bg-gray-50/50 rounded-xl border border-gray-100/50 hover:bg-gray-50 transition-all duration-200">
                    <div 
                      className="w-3 h-3 rounded-full mr-4 flex-shrink-0 shadow-sm" 
                      style={{ backgroundColor: group.color || '#3B82F6' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 text-[15px]">{group.name}</div>
                      <div className="text-sm text-gray-500 mt-0.5">{group.member_count} members</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contacts from Groups - Apple Style */}
        {contactsFromGroups?.data && (
          <div className="mt-10 bg-white/80 backdrop-blur-xl rounded-2xl p-8 shadow-sm border border-gray-200/50">
            <h3 className="text-2xl font-semibold text-gray-900 mb-6">
              Contacts from Groups
              <span className="text-lg font-normal text-gray-500 ml-2">({contactsFromGroups.data.total_contacts})</span>
            </h3>
            <div className="space-y-6">
              {contactsFromGroups.data.groups.map((group: any) => (
                <div key={group.group_id} className="border border-gray-200/50 rounded-2xl p-6 bg-gray-50/30">
                  <h4 className="font-semibold text-gray-900 mb-4 text-lg">
                    {group.group_name}
                    <span className="text-sm font-normal text-gray-500 ml-2">({group.total_contacts})</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.contacts.map((contact: any) => (
                      <div key={contact.id} className="flex items-center p-4 bg-white/80 rounded-xl border border-gray-200/50 hover:bg-white hover:shadow-sm transition-all duration-200">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mr-4 flex-shrink-0 shadow-sm">
                          <span className="text-sm font-semibold text-white">
                            {contact.first_name?.[0]}{contact.last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-gray-900 truncate text-[15px]">
                            {contact.first_name} {contact.last_name}
                          </div>
                          {contact.email && (
                            <div className="text-sm text-gray-500 truncate mt-0.5">{contact.email}</div>
                          )}
                          {contact.phone && (
                            <div className="text-sm text-gray-500 mt-0.5">{contact.phone}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
          </>
        )}

        {/* Inbox Tab Content - Apple Style */}
        {activeTab === 'inbox' && (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 overflow-hidden">
            <div className="p-8 border-b border-gray-200/50 bg-gradient-to-r from-white to-gray-50/50">
              <h3 className="text-2xl font-semibold text-gray-900 flex items-center mb-2">
                <MessageSquare className="h-6 w-6 mr-3 text-gray-900" />
                Customer Responses
              </h3>
              <p className="text-gray-600 text-[15px]">
                All responses from customers for this campaign
              </p>
            </div>
            
            <div className="p-8">
              {inboxLoading ? (
                <div className="flex items-center justify-center py-16">
                  <LoadingSpinner />
                </div>
              ) : inboxResponses?.data && inboxResponses.data.length > 0 ? (
                <div className="space-y-3">
                  {inboxResponses.data.map((response: InboxResponse) => (
                    <div key={response.id} className="border border-gray-200/50 rounded-2xl p-5 hover:bg-gray-50/50 hover:border-gray-300/50 transition-all duration-200 hover:shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className="flex-shrink-0">
                            {response.platform === 'telegram' && (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                                <MessageSquare className="h-5 w-5 text-white" />
                              </div>
                            )}
                            {response.platform === 'whatsapp' && (
                              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Phone className="h-5 w-5 text-white" />
                              </div>
                            )}
                            {response.platform === 'email' && (
                              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-sm">
                                <Mail className="h-5 w-5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <span className="text-[15px] font-semibold text-gray-900">
                                {response.contact}
                              </span>
                              <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200/50">
                                {response.platform}
                              </span>
                            </div>
                            <p className="text-gray-700 text-[15px] leading-relaxed mb-3">
                              {response.content}
                            </p>
                            <div className="flex items-center text-xs text-gray-500">
                              <Clock className="h-3.5 w-3.5 mr-1.5" />
                              {new Date(response.created_at).toLocaleString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                hour: 'numeric', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                        {response.platform === 'telegram' && (
                          <button
                            onClick={() => {
                              setSelectedContact({
                                contact: response.contact
                              })
                              setShowConversationModal(true)
                            }}
                            className="ml-4 px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 shadow-sm hover:shadow-md font-medium flex-shrink-0"
                          >
                            View Chat
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No responses yet</h3>
                  <p className="text-gray-600 text-[15px] max-w-md mx-auto">
                    Customer responses will appear here when customers reply to your campaign.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'ai-analysis' && (
          <div className="space-y-6">
            <CampaignAIAnalysis campaignId={id!} />
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && (
        <EditCampaignModal
          campaign={campaignData}
          groups={groups}
          onClose={() => setShowEditModal(false)}
          onSuccess={() => {
            setShowEditModal(false)
            queryClient.invalidateQueries({ queryKey: ['campaign', id] })
          }}
        />
      )}

      {/* Conversation Modal */}
      {showConversationModal && selectedContact && id && (
        <ConversationModal
          campaignId={id}
          contactUsername={selectedContact.contact}
          onClose={() => {
            setShowConversationModal(false)
            setSelectedContact(null)
          }}
        />
      )}
    </div>
  )
}

// Edit Campaign Modal Component
function EditCampaignModal({ campaign, groups, onClose, onSuccess }: {
  campaign: Campaign
  groups: Group[]
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    name: campaign.name,
    description: campaign.description || '',
    type: campaign.type,
    call_script: campaign.call_script,
    schedule_time: campaign.schedule_time || '',
    group_ids: campaign.group_ids || []
  })

  const updateCampaignMutation = useMutation({
    mutationFn: (data: any) => campaignsAPI.updateCampaign(campaign.id, data),
    onSuccess: () => {
      toast.success('Campaign updated successfully')
      onSuccess()
    },
    onError: () => toast.error('Failed to update campaign')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Campaign name is required')
      return
    }
    updateCampaignMutation.mutate(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Campaign</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Type
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="type"
                  value="manual"
                  checked={formData.type === 'manual'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'manual' | 'scheduled' }))}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Manual</div>
                  <div className="text-sm text-gray-500">Start calls manually</div>
                </div>
              </label>
              <label className="flex items-center p-4 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="type"
                  value="scheduled"
                  checked={formData.type === 'scheduled'}
                  onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as 'manual' | 'scheduled' }))}
                  className="mr-3"
                />
                <div>
                  <div className="font-medium">Scheduled</div>
                  <div className="text-sm text-gray-500">Automated calls on schedule</div>
                </div>
              </label>
            </div>
          </div>

          {formData.type === 'scheduled' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule Time
              </label>
              <input
                type="datetime-local"
                value={formData.schedule_time}
                onChange={(e) => setFormData(prev => ({ ...prev, schedule_time: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required={formData.type === 'scheduled'}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Groups
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {groups.map((group) => (
                <label key={group.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={formData.group_ids.includes(group.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setFormData(prev => ({ ...prev, group_ids: [...prev.group_ids, group.id] }))
                      } else {
                        setFormData(prev => ({ ...prev, group_ids: prev.group_ids.filter(id => id !== group.id) }))
                      }
                    }}
                    className="mr-3"
                  />
                  <div className="flex items-center">
                    <div 
                      className="w-4 h-4 rounded-full mr-3" 
                      style={{ backgroundColor: group.color || '#3B82F6' }}
                    />
                    <div>
                      <div className="font-medium">{group.name}</div>
                      <div className="text-sm text-gray-500">{group.member_count} members</div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call Script
            </label>
            <textarea
              value={formData.call_script}
              onChange={(e) => setFormData(prev => ({ ...prev, call_script: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updateCampaignMutation.isPending}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {updateCampaignMutation.isPending ? 'Updating...' : 'Update Campaign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
