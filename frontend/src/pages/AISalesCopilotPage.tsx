import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Brain, Search, MessageSquare, Loader2, AlertCircle, ArrowLeft, Sparkles, BarChart3 } from 'lucide-react'
import { FaTelegram, FaWhatsapp, FaEnvelope } from 'react-icons/fa'
import { HiOutlineChatBubbleLeftRight } from 'react-icons/hi2'
import { campaignsAPI, inboxAPI } from '../lib/api'
import AISalesCopilot from '../components/AISalesCopilot'
import CampaignAIAnalysis from '../components/CampaignAIAnalysis'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface Campaign {
  id: string
  name: string
  description?: string
  status: string
}

interface InboxResponse {
  id: string
  platform: string
  contact: string
  content: string
  campaign_id?: string
  created_at: string
  type?: 'incoming' | 'outgoing'
}

interface ContactInfo {
  username: string
  platform: string
  lastMessage?: InboxResponse
  messageCount: number
  hasConversation?: boolean
}

export default function AISalesCopilotPage() {
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [selectedContact, setSelectedContact] = useState<string | null>(null)
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null)
  const [showConversation, setShowConversation] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'campaign' | 'conversations'>('conversations') // 'campaign' for campaign analysis, 'conversations' for individual conversations

  // Fetch campaigns
  const { data: campaignsResponse, isLoading: campaignsLoading } = useQuery({
    queryKey: ['campaigns-for-copilot'],
    queryFn: () => campaignsAPI.getCampaigns({ limit: 100 }),
  })

  // Fetch campaign details when selected
  const { data: selectedCampaign, isLoading: campaignDetailLoading } = useQuery({
    queryKey: ['campaign-detail', selectedCampaignId],
    queryFn: () => campaignsAPI.getCampaign(selectedCampaignId!),
    enabled: !!selectedCampaignId,
  })

  // Fetch contacts from groups if campaign has group_ids
  const { data: contactsFromGroups } = useQuery({
    queryKey: ['campaign-contacts', selectedCampaign?.data?.group_ids],
    queryFn: () => campaignsAPI.getContactsFromGroups(selectedCampaign?.data?.group_ids || []),
    enabled: !!selectedCampaign?.data?.group_ids?.length,
  })

  // Fetch inbox responses for selected campaign (max limit is 500)
  const { data: inboxResponses, isLoading: inboxLoading } = useQuery({
    queryKey: ['inbox-responses', selectedCampaignId],
    queryFn: () => inboxAPI.getResponsesByCampaign(selectedCampaignId!, { limit: 500 }),
    enabled: !!selectedCampaignId,
  })

  // Fetch conversation history for selected contact
  const { data: conversationHistory, isLoading: conversationLoading } = useQuery({
    queryKey: ['conversation', selectedCampaignId, selectedContact],
    queryFn: () => inboxAPI.getConversationHistory(selectedCampaignId!, selectedContact!, { limit: 100, skip: 0 }),
    enabled: !!selectedCampaignId && !!selectedContact && showConversation,
  })

  // Get contacts from campaign (from groups or direct contacts) and combine with inbox_responses
  const contacts: ContactInfo[] = (() => {
    const contactMap = new Map<string, ContactInfo>()
    
    // First, add contacts from campaign groups
    if (contactsFromGroups?.data?.groups) {
      contactsFromGroups.data.groups.forEach((group: any) => {
        group.contacts?.forEach((contact: any) => {
          // Try to find platform info from contact
          const platforms = ['telegram', 'whatsapp', 'email']
          platforms.forEach(platform => {
            const username = contact[`${platform}_username`] || contact[`${platform}_contact`]
            if (username) {
              const key = `${username}_${platform}`
              if (!contactMap.has(key)) {
                contactMap.set(key, {
                  username: username,
                  platform: platform,
                  messageCount: 0,
                  lastMessage: undefined,
                  hasConversation: false
                })
              }
            }
          })
        })
      })
    }
    
    // Then, add/update with contacts from inbox_responses (those who have conversations)
    const responses = inboxResponses?.data || inboxResponses || []
    if (Array.isArray(responses) && responses.length > 0) {
      responses.forEach((r: InboxResponse) => {
        const key = `${r.contact}_${r.platform}`
        if (!contactMap.has(key)) {
          contactMap.set(key, {
            username: r.contact,
            platform: r.platform,
            messageCount: 0,
            lastMessage: r,
            hasConversation: true
          })
        }
        const contact = contactMap.get(key)!
        contact.messageCount++
        contact.hasConversation = true
        // Update last message if this one is newer
        if (!contact.lastMessage || new Date(r.created_at) > new Date(contact.lastMessage?.created_at || 0)) {
          contact.lastMessage = r
        }
      })
    }
    
    return Array.from(contactMap.values())
      .filter(contact => 
        !searchTerm || 
        contact.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contact.platform.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .sort((a, b) => {
        // Sort: contacts with conversation first, then by last message date
        if (a.hasConversation && !b.hasConversation) return -1
        if (!a.hasConversation && b.hasConversation) return 1
        return new Date(b.lastMessage?.created_at || 0).getTime() - 
               new Date(a.lastMessage?.created_at || 0).getTime()
      })
  })()

  const campaigns: Campaign[] = campaignsResponse?.data || []

  const handleSelectCampaign = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    setSelectedContact(null)
    setViewMode('conversations') // Default to conversations view
  }

  const handleSelectContact = (contact: string, platform: string) => {
    setSelectedContact(contact)
    setSelectedPlatform(platform)
    setShowConversation(true)
  }

  const handleBackToCampaigns = () => {
    setSelectedCampaignId(null)
    setSelectedContact(null)
    setSelectedPlatform(null)
    setShowConversation(false)
  }

  const handleBackToContacts = () => {
    setSelectedContact(null)
    setSelectedPlatform(null)
    setShowConversation(false)
  }

  const getPlatformIcon = (platform: string, className: string = 'h-6 w-6') => {
    switch (platform.toLowerCase()) {
      case 'telegram':
        return <FaTelegram className={className} />
      case 'whatsapp':
        return <FaWhatsapp className={className} />
      case 'email':
        return <FaEnvelope className={className} />
      default:
        return <HiOutlineChatBubbleLeftRight className={className} />
    }
  }

  const getPlatformColor = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'telegram':
        return 'bg-blue-50 text-blue-600 border-blue-100'
      case 'whatsapp':
        return 'bg-green-50 text-green-600 border-green-100'
      case 'email':
        return 'bg-purple-50 text-purple-600 border-purple-100'
      default:
        return 'bg-gray-50 text-gray-600 border-gray-100'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'paused':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'completed':
        return 'bg-gray-50 text-gray-700 border-gray-200'
      default:
        return 'bg-blue-50 text-blue-700 border-blue-200'
    }
  }

  if (selectedCampaignId && selectedContact && showConversation) {
    // Show conversation history and AI Sales Copilot
    const messages = conversationHistory?.data || []
    const campaign = campaigns.find(c => c.id === selectedCampaignId)
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToContacts}
              className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Contacts
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">Conversation</h1>
                <p className="text-sm text-gray-500">
                  {campaign?.name} • {selectedContact} • {selectedPlatform}
                </p>
              </div>
              <button
                onClick={() => setShowConversation(false)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-2xl hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg shadow-purple-500/20 hover:shadow-xl hover:shadow-purple-500/30 font-medium text-sm"
              >
                <Sparkles className="h-4 w-4" />
                AI Copilot
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Conversation Messages */}
            <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-900/5 border border-gray-200/50 overflow-hidden">
              <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-gray-50/50 to-transparent">
                <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
              </div>
              <div className="p-6 max-h-[700px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                {conversationLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No messages yet</p>
                    <p className="text-sm text-gray-400 mt-1">Start the conversation!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((msg: any) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.type === 'outgoing' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                      >
                        <div
                          className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                            msg.type === 'outgoing'
                              ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-blue-500/20'
                              : 'bg-gray-100 text-gray-900 border border-gray-200/50'
                          }`}
                        >
                          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                          <p
                            className={`text-xs mt-2 ${
                              msg.type === 'outgoing' ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Sales Copilot Sidebar */}
            <div className="lg:col-span-1">
              <AISalesCopilot
                campaignId={selectedCampaignId}
                telegramUsername={selectedContact}
                conversationHistory={messages.map((msg: any) => ({
                  id: msg.id,
                  type: msg.type || 'incoming',
                  content: msg.content,
                  created_at: msg.created_at
                }))}
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (selectedCampaignId && selectedContact && !showConversation) {
    // Show only AI Sales Copilot
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="mb-8">
            <button
              onClick={handleBackToContacts}
              className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Contacts
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">AI Sales Copilot</h1>
                <p className="text-sm text-gray-500">
                  {campaigns.find(c => c.id === selectedCampaignId)?.name} • {selectedContact} • {selectedPlatform}
                </p>
              </div>
              <button
                onClick={() => setShowConversation(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white rounded-2xl hover:bg-gray-800 transition-all duration-200 shadow-lg shadow-gray-900/20 hover:shadow-xl hover:shadow-gray-900/30 font-medium text-sm"
              >
                <MessageSquare className="h-4 w-4" />
                View Messages
              </button>
            </div>
          </div>
          <AISalesCopilot
            campaignId={selectedCampaignId}
            telegramUsername={selectedContact}
            conversationHistory={[]}
          />
        </div>
      </div>
    )
  }

  if (selectedCampaignId) {
    // Show campaign analysis or contacts list based on view mode
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
        <div className="max-w-7xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={handleBackToCampaigns}
              className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Campaigns
            </button>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-semibold text-gray-900 mb-2 tracking-tight">
                  {viewMode === 'campaign' ? 'Campaign Analysis' : 'Select Contact'}
                </h1>
                <p className="text-sm text-gray-500">
                  {campaigns.find(c => c.id === selectedCampaignId)?.name}
                </p>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="mb-8">
              <div className="inline-flex space-x-1 bg-white/60 backdrop-blur-xl rounded-2xl p-1.5 border border-gray-200/50 shadow-sm">
                <button
                  onClick={() => setViewMode('campaign')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    viewMode === 'campaign'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Campaign Analysis
                </button>
                <button
                  onClick={() => setViewMode('conversations')}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 ${
                    viewMode === 'conversations'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50/50'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  Individual Conversations
                </button>
              </div>
            </div>
          </div>

          {/* Campaign Analysis View */}
          {viewMode === 'campaign' && (
            <div className="space-y-6">
              <CampaignAIAnalysis campaignId={selectedCampaignId} />
            </div>
          )}

          {/* Conversations View */}
          {viewMode === 'conversations' && (
            <>

              {/* Search */}
              <div className="mb-8">
                <div className="relative max-w-md">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white/80 backdrop-blur-xl border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500/50 transition-all duration-200 shadow-sm hover:shadow-md text-sm placeholder:text-gray-400"
                  />
                </div>
              </div>

              {/* Contacts List */}
              {(inboxLoading || campaignDetailLoading) ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-4" />
                    <p className="text-sm text-gray-500">Loading contacts...</p>
                  </div>
                </div>
              ) : contacts.length === 0 ? (
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-900/5 border border-gray-200/50 p-12 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-10 w-10 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No Conversations Found</h3>
                  <p className="text-gray-500">
                    This campaign doesn't have any conversations yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {contacts.map((contact, index) => (
                    <button
                      key={`${contact.username}_${contact.platform}`}
                      onClick={() => {
                        if (contact.hasConversation) {
                          handleSelectContact(contact.username, contact.platform)
                        }
                      }}
                      className={`group relative bg-white/80 backdrop-blur-xl rounded-2xl p-5 transition-all duration-300 text-left border ${
                        contact.hasConversation 
                          ? 'border-gray-200/50 hover:border-purple-300 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1 cursor-pointer' 
                          : 'border-gray-100/50 opacity-60 cursor-not-allowed'
                      }`}
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 ${
                          contact.hasConversation ? 'group-hover:scale-110' : ''
                        } ${
                          contact.platform === 'telegram' ? 'bg-blue-50 text-blue-600' :
                          contact.platform === 'whatsapp' ? 'bg-green-50 text-green-600' :
                          'bg-purple-50 text-purple-600'
                        }`}>
                          {getPlatformIcon(contact.platform, 'h-6 w-6')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 truncate text-sm">{contact.username}</h3>
                            <span className={`px-2.5 py-1 text-xs rounded-xl border font-medium ${getPlatformColor(contact.platform)}`}>
                              {contact.platform}
                            </span>
                          </div>
                          {contact.hasConversation && contact.lastMessage ? (
                            <>
                              <p className="text-sm text-gray-600 mt-2 line-clamp-2 leading-relaxed">
                                {contact.lastMessage.content}
                              </p>
                              <p className="text-xs text-gray-400 mt-2.5">
                                {contact.messageCount} message{contact.messageCount !== 1 ? 's' : ''} • {new Date(contact.lastMessage.created_at).toLocaleDateString()}
                              </p>
                            </>
                          ) : (
                            <p className="text-xs text-gray-400 mt-2 italic">
                              No conversation yet
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Show campaigns list
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 via-indigo-500 to-purple-600 rounded-3xl shadow-2xl shadow-purple-500/30 mb-6">
            <Brain className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">AI Sales Copilot</h1>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Select a campaign to analyze conversations with AI-powered insights
          </p>
        </div>

        {campaignsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-gray-500 mt-4">Loading campaigns...</p>
            </div>
          </div>
        ) : campaigns.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-900/5 border border-gray-200/50 p-12 text-center max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Campaigns Found</h3>
            <p className="text-gray-500">
              Create a campaign first to use AI Sales Copilot.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {campaigns.map((campaign, index) => (
              <button
                key={campaign.id}
                onClick={() => handleSelectCampaign(campaign.id)}
                className="group relative bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/50 hover:border-purple-300 hover:shadow-2xl hover:shadow-purple-500/10 hover:-translate-y-1 transition-all duration-300 text-left"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Brain className="h-7 w-7 text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 mb-2 text-lg group-hover:text-purple-600 transition-colors">{campaign.name}</h3>
                    {campaign.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">{campaign.description}</p>
                    )}
                    <span className={`inline-flex items-center px-3 py-1.5 text-xs rounded-xl border font-medium ${getStatusColor(campaign.status)}`}>
                      {campaign.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
