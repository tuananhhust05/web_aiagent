import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Database, 
  ArrowRight,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface CRMProvider {
  id: string
  name: string
  description: string
  icon: string
  color: string
  isAvailable: boolean
}

export default function CRMIntegrationsList() {
  const navigate = useNavigate()
  const [providers] = useState<CRMProvider[]>([
    {
      id: 'hubspot',
      name: 'HubSpot',
      description: 'All-in-one CRM platform with marketing, sales, and service tools',
      icon: 'H',
      color: 'from-orange-500 to-red-500',
      isAvailable: true
    },
    {
      id: 'salesforce',
      name: 'Salesforce',
      description: 'Enterprise CRM solution for large organizations',
      icon: 'S',
      color: 'from-blue-500 to-cyan-500',
      isAvailable: false
    },
    {
      id: 'pipedrive',
      name: 'Pipedrive',
      description: 'Sales-focused CRM with pipeline management',
      icon: 'P',
      color: 'from-green-500 to-emerald-500',
      isAvailable: false
    }
  ])

  const handleProviderClick = (providerId: string) => {
    if (providerId === 'hubspot') {
      navigate('/crm-integrations/hubspot')
    } else {
      // Show coming soon message for other providers
      alert('This integration is coming soon!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">CRM Integration</h1>
          <p className="text-gray-600 mt-2">Connect and sync your CRM data with AgentVoice</p>
        </div>

        {/* CRM Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <div
              key={provider.id}
              onClick={() => handleProviderClick(provider.id)}
              className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 cursor-pointer transition-all hover:shadow-md hover:border-blue-300 ${
                !provider.isAvailable ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${provider.color} flex items-center justify-center text-white text-2xl font-bold`}>
                  {provider.icon}
                </div>
                {provider.isAvailable ? (
                  <CheckCircle className="h-6 w-6 text-green-500" />
                ) : (
                  <XCircle className="h-6 w-6 text-gray-400" />
                )}
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {provider.name}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {provider.description}
              </p>
              
              <div className="flex items-center justify-between">
                <span className={`text-sm font-medium ${
                  provider.isAvailable ? 'text-green-600' : 'text-gray-400'
                }`}>
                  {provider.isAvailable ? 'Available' : 'Coming Soon'}
                </span>
                {provider.isAvailable && (
                  <ArrowRight className="h-5 w-5 text-blue-600" />
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start">
            <Database className="h-6 w-6 text-blue-600 mr-3 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                About CRM Integration
              </h3>
              <p className="text-sm text-gray-600">
                Connect your CRM to automatically sync contacts, deals, and activities. 
                Keep your data up-to-date across all platforms and streamline your sales process.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
