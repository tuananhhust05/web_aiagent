import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, Play, Users, MessageSquare, Check, Trash2 } from 'lucide-react'
import { telegramAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

interface TelegramContact {
  id: string
  username: string
  first_name: string
  last_name?: string
  is_active: boolean
}

interface CampaignConfig {
  name: string
  message: string
  selectedContacts: string[]
  campaignType: 'manual'
}

export default function TelegramCampaign() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [campaignConfig, setCampaignConfig] = useState<CampaignConfig>({
    name: '',
    message: '',
    selectedContacts: [],
    campaignType: 'manual'
  })
  // const [editingCampaign, setEditingCampaign] = useState<any>(null)

  const { data: contactsResponse, isLoading } = useQuery({
    queryKey: ['telegram-contacts'],
    queryFn: () => telegramAPI.getTelegramContacts(),
  })

  const { data: campaignsResponse } = useQuery({
    queryKey: ['telegram-campaigns'],
    queryFn: () => telegramAPI.getTelegramCampaigns(),
  })

  const createCampaignMutation = useMutation({
    mutationFn: (data: any) => telegramAPI.createTelegramCampaign(data),
    onSuccess: () => {
      toast.success('Campaign created successfully!')
      setShowCreateForm(false)
      setCampaignConfig({
        name: '',
        message: '',
        selectedContacts: [],
        campaignType: 'manual'
      })
      queryClient.invalidateQueries({ queryKey: ['telegram-campaigns'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to create campaign')
    },
  })

  const deleteCampaignMutation = useMutation({
    mutationFn: (id: string) => telegramAPI.deleteTelegramCampaign(id),
    onSuccess: () => {
      toast.success('Campaign deleted successfully!')
      queryClient.invalidateQueries({ queryKey: ['telegram-campaigns'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete campaign')
    },
  })

  const startCampaignMutation = useMutation({
    mutationFn: (data: any) => telegramAPI.startTelegramCampaign(data),
    onSuccess: (response) => {
      const data = response.data
      if (data.telegram_response?.error) {
        toast.error(`Campaign sent but external API error: ${data.telegram_response.error}`)
      } else {
        toast.success(`Campaign sent successfully! Delivered to ${data.urls_count} contacts.`)
      }
      queryClient.invalidateQueries({ queryKey: ['telegram-campaigns'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to send campaign')
    },
  })

  const contacts = contactsResponse?.data?.contacts?.map((contact: any) => ({
    ...contact,
    id: contact._id || contact.id
  })) || []

  const campaigns = campaignsResponse?.data?.campaigns?.map((campaign: any) => ({
    ...campaign,
    id: campaign._id || campaign.id // Ensure we have an id field
  })) || []
  const activeContacts = contacts.filter((contact: TelegramContact) => contact.is_active && contact.username)

  // Debug log
  console.log('🔍 Campaigns response:', campaignsResponse)
  console.log('🔍 Campaigns array:', campaigns)
  if (campaigns.length > 0) {
    console.log('🔍 First campaign structure:', campaigns[0])
  }

  const handleContactToggle = (contactId: string) => {
    setCampaignConfig(prev => ({
      ...prev,
      selectedContacts: prev.selectedContacts.includes(contactId)
        ? prev.selectedContacts.filter(id => id !== contactId)
        : [...prev.selectedContacts, contactId]
    }))
  }

  const handleSelectAll = () => {
    if (campaignConfig.selectedContacts.length === activeContacts.length) {
      setCampaignConfig(prev => ({
        ...prev,
        selectedContacts: []
      }))
    } else {
      setCampaignConfig(prev => ({
        ...prev,
        selectedContacts: activeContacts.map((contact: TelegramContact) => contact.id)
      }))
    }
  }

  const handleCreateCampaign = () => {
    if (!campaignConfig.name.trim()) {
      toast.error('Please enter campaign name')
      return
    }
    if (!campaignConfig.message.trim()) {
      toast.error('Please enter campaign message')
      return
    }
    if (campaignConfig.selectedContacts.length === 0) {
      toast.error('Please select at least one contact')
      return
    }

    const campaignData = {
      name: campaignConfig.name,
      message: campaignConfig.message,
      status: 'draft',
      campaignType: campaignConfig.campaignType
    }

    createCampaignMutation.mutate(campaignData)
  }

  const handleDeleteCampaign = (campaign: any) => {
    if (!campaign.id) {
      toast.error('Campaign ID is missing')
      return
    }
    
    if (window.confirm(`Are you sure you want to delete "${campaign.name}"?`)) {
      deleteCampaignMutation.mutate(campaign.id)
    }
  }

  const handleStartCampaign = (campaign: any) => {
    if (!campaign.id) {
      toast.error('Campaign ID is missing')
      return
    }
    
    // Get all active contacts with usernames for this campaign
    const urls = activeContacts
      .filter((contact: TelegramContact) => contact.username)
      .map((contact: TelegramContact) => `https://web.telegram.org/k/#@${contact.username}`)

    if (urls.length === 0) {
      toast.error('No valid usernames found in contacts')
      return
    }

    const campaignData = {
      campaignId: campaign.id,
      name: campaign.name,
      message: campaign.message,
      urls: urls,
      campaignType: campaign.campaignType || 'manual'
    }

    startCampaignMutation.mutate(campaignData)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 font-medium">Loading campaigns...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/telegram')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Telegram Campaigns</h1>
            <p className="text-gray-600">Create and manage Telegram campaigns</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </button>
      </div>

      {/* Campaigns List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Campaigns ({campaigns.length})
          </h2>
        </div>
        
        {campaigns.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {campaigns.map((campaign: any) => (
              <div key={campaign.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        campaign.status === 'sent' ? 'bg-green-100 text-green-800' :
                        campaign.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                        campaign.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {campaign.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{campaign.message}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Type: {campaign.campaignType || 'manual'}</span>
                      <span>Created: {new Date(campaign.created_at).toLocaleDateString()}</span>
                      {campaign.sent_at && (
                        <span>First Sent: {new Date(campaign.sent_at).toLocaleDateString()}</span>
                      )}
                      {campaign.last_sent_at && (
                        <span>Last Sent: {new Date(campaign.last_sent_at).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleStartCampaign(campaign)}
                      disabled={startCampaignMutation.isPending}
                      className="btn btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {startCampaignMutation.isPending ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-1 text-white" />
                          {campaign.status === 'sent' ? 'Restarting...' : 'Starting...'}
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-1" />
                          {campaign.status === 'sent' ? 'Restart' : 'Start'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleDeleteCampaign(campaign)}
                      disabled={deleteCampaignMutation.isPending}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">No campaigns yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              Create your first Telegram campaign to start sending messages to your contacts.
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn btn-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Campaign
            </button>
          </div>
        )}
      </div>

      {/* Create Campaign Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Create Telegram Campaign</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="sr-only">Close</span>
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-6">
                {/* Campaign Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Campaign Name *
                  </label>
                  <input
                    type="text"
                    value={campaignConfig.name}
                    onChange={(e) => setCampaignConfig(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter campaign name"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    value={campaignConfig.message}
                    onChange={(e) => setCampaignConfig(prev => ({ ...prev, message: e.target.value }))}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter your message..."
                  />
                </div>

                {/* Contact Selection */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Select Contacts *
                    </label>
                    <button
                      onClick={handleSelectAll}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      {campaignConfig.selectedContacts.length === activeContacts.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="border border-gray-200 rounded-lg p-4 max-h-64 overflow-y-auto">
                    {activeContacts.length > 0 ? (
                      <div className="space-y-2">
                        {activeContacts.map((contact: TelegramContact) => (
                          <div
                            key={contact.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              campaignConfig.selectedContacts.includes(contact.id)
                                ? 'border-blue-200 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleContactToggle(contact.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  campaignConfig.selectedContacts.includes(contact.id)
                                    ? 'border-blue-600 bg-blue-600'
                                    : 'border-gray-300'
                                }`}>
                                  {campaignConfig.selectedContacts.includes(contact.id) && (
                                    <Check className="h-3 w-3 text-white" />
                                  )}
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {contact.first_name} {contact.last_name || ''}
                                  </p>
                                  {contact.username && (
                                    <p className="text-sm text-gray-500">@{contact.username}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No active contacts with usernames available</p>
                        <button
                          onClick={() => navigate('/telegram/contacts/new')}
                          className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                        >
                          Add contacts
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Preview */}
                {campaignConfig.selectedContacts.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Campaign Preview</h4>
                    <p className="text-sm text-gray-600 mb-2">
                      Will send to {campaignConfig.selectedContacts.length} contact(s):
                    </p>
                    <div className="space-y-1">
                      {activeContacts
                        .filter((contact: TelegramContact) => campaignConfig.selectedContacts.includes(contact.id))
                        .filter((contact: TelegramContact) => contact.username)
                        .map((contact: TelegramContact) => (
                          <p key={contact.id} className="text-xs text-gray-500">
                            https://web.telegram.org/k/#@{contact.username}
                          </p>
                        ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowCreateForm(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateCampaign}
                    disabled={createCampaignMutation.isPending}
                    className="btn btn-primary"
                  >
                    {createCampaignMutation.isPending ? (
                      <>
                        <LoadingSpinner size="sm" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Campaign
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
