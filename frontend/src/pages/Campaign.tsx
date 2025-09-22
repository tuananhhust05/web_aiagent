import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Users, 
  Clock, 
  Calendar,
  CheckCircle,
  Trash2,
  Edit,
  Search,
  Target,
  X
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { contactsAPI } from '../lib/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  company_name?: string
}

interface Campaign {
  id: string
  name: string
  description: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'scheduled'
  type: 'manual' | 'scheduled'
  contacts: string[]
  call_script: string
  schedule_time?: string
  created_at: string
  updated_at: string
}

export default function Campaign() {
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showContactSelector, setShowContactSelector] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // const queryClient = useQueryClient()

  // Fetch contacts
  const { data: contactsResponse, isLoading: contactsLoading } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getContacts(),
  })
  
  // Ensure contacts is always an array
  const contacts = Array.isArray(contactsResponse?.data) ? contactsResponse.data : 
                   Array.isArray(contactsResponse) ? contactsResponse : []

  // Mock campaigns data - in real app, this would come from API
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Q1 Lead Generation',
      description: 'Outbound calls to warm leads for Q1 sales',
      status: 'active',
      type: 'manual',
      contacts: ['1', '2', '3'],
      call_script: 'Hello, this is [Agent Name] from [Company]. I\'m calling to discuss how we can help your business grow...',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Follow-up Campaign',
      description: 'Automated follow-up calls for existing customers',
      status: 'scheduled',
      type: 'scheduled',
      contacts: ['4', '5'],
      call_script: 'Hi [Name], this is a follow-up call regarding your recent inquiry...',
      schedule_time: '2024-01-20T09:00:00Z',
      created_at: '2024-01-16T14:30:00Z',
      updated_at: '2024-01-16T14:30:00Z'
    }
  ])

  const filteredContacts = contacts.filter((contact: Contact) =>
    contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm)
  )

  const filteredCampaigns = campaigns.filter(campaign => 
    filterStatus === 'all' || campaign.status === filterStatus
  )

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const handleCreateCampaign = (campaignData: Partial<Campaign>) => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: campaignData.name || '',
      description: campaignData.description || '',
      status: 'draft',
      type: campaignData.type || 'manual',
      contacts: selectedContacts,
      call_script: campaignData.call_script || '',
      schedule_time: campaignData.schedule_time,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    setCampaigns(prev => [...prev, newCampaign])
    setShowCreateModal(false)
    setSelectedContacts([])
    toast.success('Campaign created successfully!')
  }

  const handleCampaignAction = (campaignId: string, action: string) => {
    setCampaigns(prev => prev.map(campaign => 
      campaign.id === campaignId 
        ? { ...campaign, status: action as Campaign['status'], updated_at: new Date().toISOString() }
        : campaign
    ))
    toast.success(`Campaign ${action} successfully!`)
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
      case 'active': return <Play className="h-4 w-4" />
      case 'paused': return <Pause className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'scheduled': return <Clock className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
              <p className="text-gray-600 mt-2">Manage your automated calling campaigns</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Campaign
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Campaigns</p>
                <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Play className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status === 'active').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.filter(c => c.status === 'scheduled').length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {campaigns.reduce((acc, c) => acc + c.contacts.length, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Campaigns List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Campaigns</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredCampaigns.map((campaign) => (
              <div key={campaign.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{campaign.name}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(campaign.status)}`}>
                        {getStatusIcon(campaign.status)}
                        <span className="ml-1 capitalize">{campaign.status}</span>
                      </span>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {campaign.type}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3">{campaign.description}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {campaign.contacts.length} contacts
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Created {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                      {campaign.schedule_time && (
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Scheduled {new Date(campaign.schedule_time).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {campaign.status === 'draft' && (
                      <button
                        onClick={() => handleCampaignAction(campaign.id, 'active')}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Start
                      </button>
                    )}
                    {campaign.status === 'active' && (
                      <button
                        onClick={() => handleCampaignAction(campaign.id, 'paused')}
                        className="inline-flex items-center px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-lg hover:bg-yellow-700 transition-colors"
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pause
                      </button>
                    )}
                    {campaign.status === 'paused' && (
                      <button
                        onClick={() => handleCampaignAction(campaign.id, 'active')}
                        className="inline-flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Resume
                      </button>
                    )}
                    <button className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </button>
                    <button className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors">
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Create Campaign Modal */}
        {showCreateModal && (
          <CreateCampaignModal
            onClose={() => setShowCreateModal(false)}
            onSubmit={handleCreateCampaign}
            onSelectContacts={() => setShowContactSelector(true)}
            selectedContactsCount={selectedContacts.length}
          />
        )}

        {/* Contact Selector Modal */}
        {showContactSelector && (
          <ContactSelectorModal
            contacts={filteredContacts}
            selectedContacts={selectedContacts}
            onToggle={handleContactToggle}
            onClose={() => setShowContactSelector(false)}
            onConfirm={() => setShowContactSelector(false)}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            loading={contactsLoading}
          />
        )}
      </div>
    </div>
  )
}

// Create Campaign Modal Component
function CreateCampaignModal({ onClose, onSubmit, onSelectContacts, selectedContactsCount }: {
  onClose: () => void
  onSubmit: (data: any) => void
  onSelectContacts: () => void
  selectedContactsCount: number
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'manual' as 'manual' | 'scheduled',
    call_script: '',
    schedule_time: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Campaign name is required')
      return
    }
    if (selectedContactsCount === 0) {
      toast.error('Please select at least one contact')
      return
    }
    onSubmit(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create New Campaign</h2>
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
              Call Script
            </label>
            <textarea
              value={formData.call_script}
              onChange={(e) => setFormData(prev => ({ ...prev, call_script: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter your call script..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Contacts
            </label>
            <button
              type="button"
              onClick={onSelectContacts}
              className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <div className="text-gray-600">
                {selectedContactsCount > 0 
                  ? `${selectedContactsCount} contacts selected`
                  : 'Click to select contacts'
                }
              </div>
            </button>
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

        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedContacts.includes(contact.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
                onClick={() => onToggle(contact.id)}
              >
                <input
                  type="checkbox"
                  checked={selectedContacts.includes(contact.id)}
                  onChange={() => onToggle(contact.id)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">
                    {contact.first_name} {contact.last_name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {contact.email} • {contact.phone}
                  </div>
                  {contact.company_name && (
                    <div className="text-sm text-gray-400">
                      {contact.company_name}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center pt-6 border-t border-gray-200 mt-6">
          <div className="text-sm text-gray-600">
            {selectedContacts.length} contacts selected
          </div>
          <div className="flex gap-3">
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
              Confirm Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
