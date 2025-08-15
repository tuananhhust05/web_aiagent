import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Building2, 
  Link, 
  Unlink, 
  RefreshCw, 
  Download, 
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ExternalLink,
  Settings,
  BarChart3
} from 'lucide-react'
import { crmAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function CRM() {
  const [selectedProvider, setSelectedProvider] = useState('')
  const queryClient = useQueryClient()

  const { data: providers, isLoading: providersLoading } = useQuery({
    queryKey: ['crm-providers'],
    queryFn: () => crmAPI.getProviders(),
  })

  const { data: connections, isLoading: connectionsLoading } = useQuery({
    queryKey: ['crm-connections'],
    queryFn: () => crmAPI.getConnections(),
  })

  const connectMutation = useMutation({
    mutationFn: (provider: string) => crmAPI.connect(provider, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-connections'] })
      toast.success('CRM connected successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to connect CRM')
    },
  })

  const disconnectMutation = useMutation({
    mutationFn: (provider: string) => crmAPI.disconnect(provider),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-connections'] })
      toast.success('CRM disconnected successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to disconnect CRM')
    },
  })

  const syncMutation = useMutation({
    mutationFn: (provider: string) => crmAPI.sync(provider),
    onSuccess: () => {
      toast.success('Contacts synced successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to sync contacts')
    },
  })

  const exportMutation = useMutation({
    mutationFn: ({ provider, contactIds }: { provider: string; contactIds: string[] }) =>
      crmAPI.export(provider, contactIds),
    onSuccess: () => {
      toast.success('Contacts exported successfully!')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to export contacts')
    },
  })

  const crmProviders = [
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'All-in-one CRM platform for growing businesses',
      logo: '🟠',
      features: ['Contact Management', 'Deal Tracking', 'Email Marketing'],
      status: 'connected'
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'World\'s #1 CRM platform for sales, service, and marketing',
      logo: '🔵',
      features: ['Lead Management', 'Opportunity Tracking', 'Analytics'],
      status: 'available'
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      description: 'Sales CRM and pipeline management software',
      logo: '🟢',
      features: ['Pipeline Management', 'Activity Tracking', 'Reporting'],
      status: 'available'
    }
  ]

  const connectedProviders = Array.isArray(connections?.data) ? connections.data : []
  const isLoading = providersLoading || connectionsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 font-medium">Loading CRM integrations...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-8 lg:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">
              CRM Integrations
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
              Connect your existing CRM systems to sync contacts and streamline your sales process
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-600">Connected CRMs</p>
              <p className="text-2xl font-bold text-gray-900">{Array.isArray(connectedProviders) ? connectedProviders.length : 0}</p>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-4">
              <Link className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Connected CRMs</p>
              <p className="text-2xl font-bold text-gray-900">{Array.isArray(connectedProviders) ? connectedProviders.length : 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mr-4">
              <RefreshCw className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Last Sync</p>
              <p className="text-2xl font-bold text-gray-900">2h ago</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mr-4">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Synced Contacts</p>
              <p className="text-2xl font-bold text-gray-900">1,247</p>
            </div>
          </div>
        </div>
      </div>

      {/* CRM Providers */}
      <div className="space-y-6">
        {crmProviders.map((provider) => {
          const isConnected = Array.isArray(connectedProviders) && connectedProviders.some(conn => conn.provider === provider.id)
          
          return (
            <div key={provider.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl">
                    {provider.logo}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">{provider.name}</h3>
                      {isConnected ? (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Connected
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          Available
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-4">{provider.description}</p>
                    
                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                      {provider.features.map((feature, index) => (
                        <span key={index} className="flex items-center">
                          <CheckCircle className="w-4 h-4 mr-1 text-green-500" />
                          {feature}
                        </span>
                      ))}
                    </div>

                    {isConnected && (
                      <div className="flex items-center space-x-4">
                        <button
                          onClick={() => syncMutation.mutate(provider.id)}
                          disabled={syncMutation.isPending}
                          className="btn btn-outline btn-sm group"
                        >
                          <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? 'animate-spin' : 'group-hover:rotate-180 transition-transform'}`} />
                          Sync Contacts
                        </button>
                        <button
                          onClick={() => exportMutation.mutate({ provider: provider.id, contactIds: [] })}
                          disabled={exportMutation.isPending}
                          className="btn btn-outline btn-sm group"
                        >
                          <Upload className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                          Export
                        </button>
                        <button
                          onClick={() => disconnectMutation.mutate(provider.id)}
                          disabled={disconnectMutation.isPending}
                          className="btn btn-outline border-red-200 text-red-600 hover:bg-red-50 btn-sm"
                        >
                          <Unlink className="mr-2 h-4 w-4" />
                          Disconnect
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end space-y-3">
                  {!isConnected && (
                    <button
                      onClick={() => connectMutation.mutate(provider.id)}
                      disabled={connectMutation.isPending}
                      className="btn btn-primary btn-md group"
                    >
                      <Link className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                      Connect
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  )}
                  
                  <button className="text-gray-400 hover:text-gray-600 transition-colors">
                    <Settings className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Sync Status */}
      <div className="mt-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-center space-x-4 mb-6">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
              <RefreshCw className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Sync Status</h2>
              <p className="text-gray-600">Monitor your CRM synchronization status</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-gray-900">HubSpot</p>
                    <p className="text-sm text-gray-600">Last synced 2 hours ago</p>
                  </div>
                </div>
                <span className="text-sm text-green-600 font-medium">Active</span>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center space-x-3">
                  <AlertCircle className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">Salesforce</p>
                    <p className="text-sm text-gray-600">Not connected</p>
                  </div>
                </div>
                <span className="text-sm text-gray-500 font-medium">Inactive</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-xl">
                <h4 className="font-medium text-gray-900 mb-2">Recent Activity</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Contacts synced</span>
                    <span className="font-medium">+45</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Deals updated</span>
                    <span className="font-medium">+12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Leads created</span>
                    <span className="font-medium">+8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="mt-12">
        <div className="bg-gradient-to-r from-primary-50 to-blue-50 rounded-2xl p-8">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Need help with CRM integration?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our team is here to help you set up and optimize your CRM integrations for maximum efficiency.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="btn btn-primary btn-md group">
                <ExternalLink className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform" />
                View Documentation
              </button>
              <button className="btn btn-outline btn-md">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 