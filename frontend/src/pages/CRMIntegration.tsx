import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { 
  Link, 
  Database, 
  Settings, 
  Users, 
  Clock, 
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Search,
  ExternalLink,
  Plus,
  Trash2,
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
  created_at: string
  updated_at: string
}

interface Integration {
  id: string
  name: string
  type: 'hubspot' | 'salesforce' | 'pipedrive'
  status: 'connected' | 'disconnected' | 'error'
  last_sync: string
  total_contacts: number
  settings: {
    api_key?: string
    webhook_url?: string
    sync_frequency: 'realtime' | 'hourly' | 'daily'
    auto_sync: boolean
  }
}

export default function CRMIntegration() {
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [selectedIntegration, setSelectedIntegration] = useState<string>('hubspot')
  const [searchTerm, setSearchTerm] = useState('')
  // const [filterStatus, setFilterStatus] = useState<string>('all')
  const [isSyncing, setIsSyncing] = useState(false)
  
  // const queryClient = useQueryClient()

  // Fetch contacts
  const { data: contactsResponse, isLoading: contactsLoading, refetch: refetchContacts } = useQuery({
    queryKey: ['contacts'],
    queryFn: () => contactsAPI.getContacts(),
  })
  
  // Ensure contacts is always an array
  const contacts = Array.isArray(contactsResponse?.data) ? contactsResponse.data : 
                   Array.isArray(contactsResponse) ? contactsResponse : []

  // Mock integrations data - in real app, this would come from API
  const [integrations, setIntegrations] = useState<Integration[]>([
    {
      id: '1',
      name: 'HubSpot CRM',
      type: 'hubspot',
      status: 'connected',
      last_sync: '2024-01-15T10:30:00Z',
      total_contacts: 1250,
      settings: {
        api_key: 'hub_****_****_****',
        webhook_url: 'https://forskale.com/webhook/hubspot',
        sync_frequency: 'realtime',
        auto_sync: true
      }
    },
    {
      id: '2',
      name: 'Salesforce CRM',
      type: 'salesforce',
      status: 'disconnected',
      last_sync: '2024-01-10T15:45:00Z',
      total_contacts: 0,
      settings: {
        sync_frequency: 'daily',
        auto_sync: false
      }
    }
  ])

  const filteredContacts = contacts.filter((contact: Contact) =>
    contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.includes(searchTerm)
  )

  const handleConnectIntegration = (integrationData: any) => {
    const newIntegration: Integration = {
      id: Date.now().toString(),
      name: integrationData.name,
      type: integrationData.type,
      status: 'connected',
      last_sync: new Date().toISOString(),
      total_contacts: 0,
      settings: {
        api_key: integrationData.api_key,
        webhook_url: integrationData.webhook_url,
        sync_frequency: integrationData.sync_frequency,
        auto_sync: integrationData.auto_sync
      }
    }
    
    setIntegrations(prev => [...prev, newIntegration])
    setShowConnectModal(false)
    toast.success('Integration connected successfully!')
  }

  const handleSync = async (integrationId: string) => {
    setIsSyncing(true)
    try {
      // Simulate sync process
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIntegrations(prev => prev.map(integration => 
        integration.id === integrationId 
          ? { 
              ...integration, 
              last_sync: new Date().toISOString(),
              total_contacts: Math.floor(Math.random() * 1000) + 500
            }
          : integration
      ))
      
      await refetchContacts()
      toast.success('Sync completed successfully!')
    } catch (error) {
      toast.error('Sync failed. Please try again.')
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnect = (integrationId: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === integrationId 
        ? { ...integration, status: 'disconnected' as const }
        : integration
    ))
    toast.success('Integration disconnected')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'text-green-600 bg-green-100'
      case 'disconnected': return 'text-gray-600 bg-gray-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircle className="h-4 w-4" />
      case 'disconnected': return <AlertCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      default: return <AlertCircle className="h-4 w-4" />
    }
  }

  const getIntegrationIcon = (type: string) => {
    switch (type) {
      case 'hubspot': return 'H'
      case 'salesforce': return 'S'
      case 'pipedrive': return 'P'
      default: return '?'
    }
  }

  const getIntegrationColor = (type: string) => {
    switch (type) {
      case 'hubspot': return 'from-orange-500 to-red-500'
      case 'salesforce': return 'from-blue-500 to-cyan-500'
      case 'pipedrive': return 'from-green-500 to-emerald-500'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">CRM Integration</h1>
              <p className="text-gray-600 mt-2">Connect and sync your CRM data with AgentVoice</p>
            </div>
            <button
              onClick={() => setShowConnectModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Connect CRM
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Link className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Connected CRMs</p>
                <p className="text-2xl font-bold text-gray-900">
                  {integrations.filter(i => i.status === 'connected').length}
                </p>
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
                <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Last Sync</p>
                <p className="text-sm font-bold text-gray-900">
                  {integrations.find(i => i.status === 'connected')?.last_sync 
                    ? new Date(integrations.find(i => i.status === 'connected')!.last_sync).toLocaleDateString()
                    : 'Never'
                  }
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Database className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">CRM Contacts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {integrations.reduce((acc, i) => acc + i.total_contacts, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Integrations List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Connected Integrations</h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {integrations.map((integration) => (
              <div key={integration.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getIntegrationColor(integration.type)} flex items-center justify-center text-white text-lg font-bold`}>
                      {getIntegrationIcon(integration.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">{integration.name}</h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(integration.status)}`}>
                          {getStatusIcon(integration.status)}
                          <span className="ml-1 capitalize">{integration.status}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          {integration.total_contacts} contacts
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Last sync: {new Date(integration.last_sync).toLocaleString()}
                        </div>
                        <div className="flex items-center">
                          <RefreshCw className="h-4 w-4 mr-1" />
                          {integration.settings.sync_frequency} sync
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {integration.status === 'connected' && (
                      <button
                        onClick={() => handleSync(integration.id)}
                        disabled={isSyncing}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                      >
                        <RefreshCw className={`h-4 w-4 mr-1 ${isSyncing ? 'animate-spin' : ''}`} />
                        Sync
                      </button>
                    )}
                    <button className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                      <Settings className="h-4 w-4 mr-1" />
                      Settings
                    </button>
                    <button
                      onClick={() => handleDisconnect(integration.id)}
                      className="inline-flex items-center px-3 py-1.5 bg-red-100 text-red-700 text-sm rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Disconnect
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contacts from CRM */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Synced Contacts</h2>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <button
                  onClick={() => refetchContacts()}
                  className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  Refresh
                </button>
              </div>
            </div>
          </div>
          
          <div className="divide-y divide-gray-200">
            {contactsLoading ? (
              <div className="flex justify-center py-8">
                <LoadingSpinner size="lg" />
              </div>
            ) : filteredContacts.length > 0 ? (
              filteredContacts.map((contact: Contact) => (
                <div key={contact.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                        {contact.first_name[0]}{contact.last_name[0]}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </h3>
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
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Synced {new Date(contact.updated_at).toLocaleDateString()}
                      </span>
                      <button className="inline-flex items-center px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200 transition-colors">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View in CRM
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Database className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No contacts found. Connect a CRM to start syncing contacts.</p>
              </div>
            )}
          </div>
        </div>

        {/* Connect Integration Modal */}
        {showConnectModal && (
          <ConnectIntegrationModal
            onClose={() => setShowConnectModal(false)}
            onSubmit={handleConnectIntegration}
            selectedIntegration={selectedIntegration}
            onSelectIntegration={setSelectedIntegration}
          />
        )}
      </div>
    </div>
  )
}

// Connect Integration Modal Component
function ConnectIntegrationModal({ 
  onClose, 
  onSubmit, 
  selectedIntegration, 
  onSelectIntegration 
}: {
  onClose: () => void
  onSubmit: (data: any) => void
  selectedIntegration: string
  onSelectIntegration: (type: string) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    api_key: '',
    webhook_url: '',
    sync_frequency: 'realtime' as 'realtime' | 'hourly' | 'daily',
    auto_sync: true
  })

  const integrations = [
    {
      type: 'hubspot',
      name: 'HubSpot CRM',
      description: 'Connect your HubSpot CRM to sync contacts, deals, and activities',
      icon: 'H',
      color: 'from-orange-500 to-red-500'
    },
    {
      type: 'salesforce',
      name: 'Salesforce CRM',
      description: 'Sync leads, opportunities, and customer data from Salesforce',
      icon: 'S',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      type: 'pipedrive',
      name: 'Pipedrive CRM',
      description: 'Connect your Pipedrive sales pipeline and activities',
      icon: 'P',
      color: 'from-green-500 to-emerald-500'
    }
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      toast.error('Integration name is required')
      return
    }
    if (!formData.api_key.trim()) {
      toast.error('API key is required')
      return
    }
    onSubmit({
      ...formData,
      type: selectedIntegration
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Connect CRM Integration</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select CRM Platform
            </label>
            <div className="grid grid-cols-1 gap-3">
              {integrations.map((integration) => (
                <label
                  key={integration.type}
                  className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedIntegration === integration.type
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="integration"
                    value={integration.type}
                    checked={selectedIntegration === integration.type}
                    onChange={(e) => onSelectIntegration(e.target.value)}
                    className="mr-3"
                  />
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${integration.color} flex items-center justify-center text-white font-bold mr-3`}>
                    {integration.icon}
                  </div>
                  <div>
                    <div className="font-medium">{integration.name}</div>
                    <div className="text-sm text-gray-500">{integration.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Integration Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter integration name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              API Key
            </label>
            <input
              type="password"
              value={formData.api_key}
              onChange={(e) => setFormData(prev => ({ ...prev, api_key: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter your API key"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Webhook URL (Optional)
            </label>
            <input
              type="url"
              value={formData.webhook_url}
              onChange={(e) => setFormData(prev => ({ ...prev, webhook_url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="https://your-domain.com/webhook"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sync Frequency
            </label>
            <select
              value={formData.sync_frequency}
              onChange={(e) => setFormData(prev => ({ ...prev, sync_frequency: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="realtime">Real-time</option>
              <option value="hourly">Hourly</option>
              <option value="daily">Daily</option>
            </select>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto_sync"
              checked={formData.auto_sync}
              onChange={(e) => setFormData(prev => ({ ...prev, auto_sync: e.target.checked }))}
              className="mr-3"
            />
            <label htmlFor="auto_sync" className="text-sm text-gray-700">
              Enable automatic synchronization
            </label>
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
              Connect Integration
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
