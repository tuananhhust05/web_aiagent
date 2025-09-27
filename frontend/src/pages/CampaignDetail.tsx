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
  Phone,
  Mail,
  Building2,
  RefreshCw
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { campaignsAPI, groupsAPI } from '../lib/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company_name?: string
}

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
  schedule_time?: string
  created_at: string
  updated_at: string
}

export default function CampaignDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showEditModal, setShowEditModal] = useState(false)

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

  const groups = Array.isArray(groupsResponse?.data?.groups) ? groupsResponse.data.groups : []
  const campaignGroups = groups.filter(group => campaign?.data?.group_ids?.includes(group.id))

  // Mutations
  const startCampaignMutation = useMutation({
    mutationFn: () => campaignsAPI.startCampaign(id!),
    onSuccess: () => {
      toast.success('Campaign started successfully')
      queryClient.invalidateQueries({ queryKey: ['campaign', id] })
    },
    onError: () => toast.error('Failed to start campaign')
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (campaignError || !campaign?.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Campaign Not Found</h2>
          <p className="text-gray-600 mb-4">The campaign you're looking for doesn't exist or you don't have permission to view it.</p>
          <button
            onClick={() => navigate('/campaigns')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </button>
        </div>
      </div>
    )
  }

  const campaignData = campaign.data

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/campaigns')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Campaigns
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{campaignData.name}</h1>
              <p className="text-gray-600 mt-1">{campaignData.description}</p>
            </div>
            
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(campaignData.status)}`}>
                {getStatusIcon(campaignData.status)}
                <span className="ml-2 capitalize">{campaignData.status}</span>
              </span>
              
              <div className="flex items-center gap-2">
                {campaignData.status === 'draft' && (
                  <button
                    onClick={handleStartCampaign}
                    disabled={startCampaignMutation.isPending}
                    className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {startCampaignMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    Start Campaign
                  </button>
                )}
                
                {campaignData.status === 'active' && (
                  <button
                    onClick={handlePauseCampaign}
                    disabled={pauseCampaignMutation.isPending}
                    className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50"
                  >
                    {pauseCampaignMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Pause className="h-4 w-4 mr-2" />
                    )}
                    Pause Campaign
                  </button>
                )}
                
                <button
                  onClick={() => setShowEditModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </button>
                
                <button
                  onClick={handleDeleteCampaign}
                  disabled={deleteCampaignMutation.isPending}
                  className="inline-flex items-center px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
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
        </div>

        {/* Campaign Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Campaign Type</p>
                <p className="text-lg font-semibold text-gray-900 capitalize">{campaignData.type}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-lg font-semibold text-gray-900">{campaignData.contacts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Created</p>
                <p className="text-lg font-semibold text-gray-900">
                  {new Date(campaignData.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {campaignData.schedule_time && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Scheduled</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {new Date(campaignData.schedule_time).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Call Script */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Script</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 whitespace-pre-wrap">{campaignData.call_script}</p>
            </div>
          </div>

          {/* Groups */}
          {campaignGroups.length > 0 && (
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Groups ({campaignGroups.length})</h3>
              <div className="space-y-3">
                {campaignGroups.map((group) => (
                  <div key={group.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                    <div 
                      className="w-4 h-4 rounded-full mr-3" 
                      style={{ backgroundColor: group.color || '#3B82F6' }}
                    />
                    <div className="flex-1">
                      <div className="font-medium">{group.name}</div>
                      <div className="text-sm text-gray-500">{group.member_count} members</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Contacts from Groups */}
        {contactsFromGroups?.data && (
          <div className="mt-8 bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Contacts from Groups ({contactsFromGroups.data.total_contacts})
            </h3>
            <div className="space-y-4">
              {contactsFromGroups.data.groups.map((group) => (
                <div key={group.group_id} className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">{group.group_name} ({group.total_contacts} contacts)</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {group.contacts.map((contact) => (
                      <div key={contact.id} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium text-blue-600">
                            {contact.first_name?.[0]}{contact.last_name?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 truncate">
                            {contact.first_name} {contact.last_name}
                          </div>
                          <div className="text-sm text-gray-500 truncate">{contact.email}</div>
                          <div className="text-sm text-gray-500">{contact.phone}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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
