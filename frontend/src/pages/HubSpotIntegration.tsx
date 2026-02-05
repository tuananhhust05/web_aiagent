import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Loader2,
  Database,
  Edit,
  X,
  Eye,
  EyeOff
} from 'lucide-react'
import { toast } from 'react-hot-toast'
import { crmAPI } from '../lib/api'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface HubSpotContact {
  id: string
  properties: {
    createdate?: string
    email?: string
    firstname?: string
    hs_object_id?: string
    lastmodifieddate?: string
    lastname?: string | null
  }
  createdAt: string
  updatedAt: string
  archived: boolean
  url?: string
}

interface HubSpotSyncResponse {
  results: HubSpotContact[]
  paging?: {
    next?: {
      after: string
    }
  }
}

export default function HubSpotIntegration() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [token, setToken] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [syncedContacts, setSyncedContacts] = useState<HubSpotContact[]>([])
  const [isUpdatingToken, setIsUpdatingToken] = useState(false)
  const [showCurrentToken, setShowCurrentToken] = useState(false)

  // Check if token exists
  const { data: connectionData, isLoading: isLoadingConnection } = useQuery({
    queryKey: ['hubspot-connection'],
    queryFn: async () => {
      try {
        const response = await crmAPI.getHubSpotToken()
        return response.data
      } catch (error: any) {
        if (error.response?.status === 404) {
          return null // No token found
        }
        throw error
      }
    },
    retry: false
  })

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      const response = await crmAPI.syncHubSpotContacts()
      return response.data
    },
    onSuccess: (data: HubSpotSyncResponse) => {
      setSyncedContacts(data.results || [])
      toast.success(`Successfully synced ${data.results?.length || 0} contacts from HubSpot!`)
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to sync contacts from HubSpot')
    }
  })

  // Save token mutation
  const saveTokenMutation = useMutation({
    mutationFn: async (tokenValue: string) => {
      const response = await crmAPI.saveHubSpotToken(tokenValue)
      return response.data
    },
    onSuccess: () => {
      toast.success('HubSpot token saved successfully!')
      queryClient.invalidateQueries({ queryKey: ['hubspot-connection'] })
      setIsUpdatingToken(false) // Close update form after successful save
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to save token')
    }
  })

  useEffect(() => {
    if (connectionData?.token) {
      setToken(connectionData.token)
    } else if (connectionData === null) {
      // No token found, clear the local token state
      setToken('')
    }
  }, [connectionData])

  const handleSaveToken = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token.trim()) {
      toast.error('Please enter a valid HubSpot token')
      return
    }

    setIsSubmitting(true)
    try {
      await saveTokenMutation.mutateAsync(token)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSync = async () => {
    syncMutation.mutate()
  }

  const handleCancelUpdate = () => {
    setIsUpdatingToken(false)
    // Reset token to current saved token
    if (connectionData?.token) {
      setToken(connectionData.token)
    } else {
      setToken('')
    }
  }

  const handleStartUpdate = () => {
    setIsUpdatingToken(true)
    // Clear token input for new entry
    setToken('')
  }

  const hasToken = connectionData?.token || token.trim().length > 0
  const showUpdateForm = isUpdatingToken || !hasToken

  if (isLoadingConnection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/crm-integrations')}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to CRM Integrations
          </button>
          
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white text-2xl font-bold">
              H
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">HubSpot Integration</h1>
              <p className="text-gray-600 mt-2">Connect and sync your HubSpot CRM data</p>
            </div>
          </div>
        </div>

        {/* Token Form or Sync Button */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          {showUpdateForm ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  {!hasToken ? (
                    <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
                  ) : (
                    <Edit className="h-5 w-5 text-blue-500 mr-2" />
                  )}
                  <h2 className="text-lg font-semibold text-gray-900">
                    {!hasToken ? 'HubSpot Token Required' : 'Update HubSpot Token'}
                  </h2>
                </div>
                {hasToken && (
                  <button
                    onClick={handleCancelUpdate}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {hasToken && connectionData?.token && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Current Token</p>
                      <p className="text-sm font-mono text-gray-700">
                        {showCurrentToken 
                          ? connectionData.token 
                          : connectionData.token.substring(0, 12) + '••••••••••••••••••••'
                        }
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowCurrentToken(!showCurrentToken)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {showCurrentToken ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              <p className="text-sm text-gray-600 mb-6">
                {!hasToken 
                  ? 'Please enter your HubSpot Private App Access Token to connect your account. You can create a token in your HubSpot account settings.'
                  : 'Enter a new HubSpot Private App Access Token to update your connection.'
                }
              </p>
              
              <form onSubmit={handleSaveToken}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    HubSpot Private App Access Token
                  </label>
                  <input
                    type="password"
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="pat-na2-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Your token will be securely stored and encrypted.
                  </p>
                </div>
                
                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !token.trim()}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        {hasToken ? 'Updating...' : 'Saving...'}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {hasToken ? 'Update Token' : 'Save Token'}
                      </>
                    )}
                  </button>
                  {hasToken && (
                    <button
                      type="button"
                      onClick={handleCancelUpdate}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    HubSpot Connected
                  </h2>
                </div>
                <button
                  onClick={handleStartUpdate}
                  className="flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4 mr-1.5" />
                  Update Token
                </button>
              </div>
              
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Current Token</p>
                    <p className="text-sm font-mono text-gray-700">
                      {showCurrentToken && connectionData?.token
                        ? connectionData.token 
                        : connectionData?.token 
                          ? connectionData.token.substring(0, 12) + '••••••••••••••••••••'
                          : '••••••••••••••••••••'
                      }
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCurrentToken(!showCurrentToken)}
                    className="text-gray-500 hover:text-gray-700"
                    title={showCurrentToken ? 'Hide token' : 'Show token'}
                  >
                    {showCurrentToken ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
              
              <p className="text-sm text-gray-600 mb-6">
                Your HubSpot account is connected. Click the sync button below to fetch contacts from HubSpot.
              </p>
              
              <button
                onClick={handleSync}
                disabled={syncMutation.isPending}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {syncMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync Contacts
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Synced Contacts Table */}
        {syncedContacts.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Database className="h-5 w-5 text-blue-600 mr-2" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Synced Contacts ({syncedContacts.length})
                  </h2>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      First Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Modified
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {syncedContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contact.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contact.properties.firstname || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {contact.properties.lastname || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.properties.email || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.properties.createdate 
                          ? new Date(contact.properties.createdate).toLocaleDateString()
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {contact.properties.lastmodifieddate
                          ? new Date(contact.properties.lastmodifieddate).toLocaleDateString()
                          : '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
