import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Edit, Trash2, Users, ArrowLeft } from 'lucide-react'
import { telegramAPI } from '../../lib/api'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

interface TelegramContact {
  id: string
  username: string
  first_name: string
  last_name?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function TelegramContacts() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')

  const { data: contactsResponse, isLoading, error } = useQuery({
    queryKey: ['telegram-contacts', search],
    queryFn: () => telegramAPI.getTelegramContacts({ search }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => telegramAPI.deleteTelegramContact(id),
    onSuccess: () => {
      toast.success('Contact deleted successfully')
      queryClient.invalidateQueries({ queryKey: ['telegram-contacts'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete contact')
    },
  })

  const contacts = contactsResponse?.data?.contacts?.map((contact: any) => ({
    ...contact,
    id: contact._id || contact.id // Ensure we have an id field
  })) || []

  // Debug log
  console.log('🔍 Telegram contacts response:', contactsResponse)
  console.log('🔍 Contacts array:', contacts)
  if (contacts.length > 0) {
    console.log('🔍 First contact structure:', contacts[0])
  }

  const handleDelete = (contact: TelegramContact) => {
    if (!contact.id) {
      toast.error('Contact ID is missing')
      return
    }
    
    if (window.confirm(`Are you sure you want to delete ${contact.first_name} ${contact.last_name || ''}?`)) {
      deleteMutation.mutate(contact.id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 font-medium">Loading contacts...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Users className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to load contacts
          </h3>
          <p className="text-gray-600 leading-relaxed">
            There was an error loading your Telegram contacts. Please try again.
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 btn btn-primary"
          >
            Try Again
          </button>
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
            <h1 className="text-2xl font-bold text-gray-900">Telegram Contacts</h1>
            <p className="text-gray-600">Manage your Telegram contact list</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/telegram/contacts/new')}
          className="btn btn-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Contact
        </button>
      </div>

      {/* Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search contacts by name or username..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Contacts ({contacts.length})
          </h2>
        </div>
        
        {contacts.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {contacts.map((contact: TelegramContact) => (
              <div key={contact.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-white">
                        {contact.first_name.charAt(0).toUpperCase()}
                        {contact.last_name?.charAt(0).toUpperCase() || ''}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contact.first_name} {contact.last_name || ''}
                        </h3>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          contact.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {contact.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        {contact.username && (
                          <span className="flex items-center">
                            <span className="mr-1">@</span>
                            {contact.username}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/telegram/contacts/${contact.id}/edit`)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact)}
                      disabled={deleteMutation.isPending}
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
              <Users className="h-10 w-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {search ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              {search
                ? 'Try adjusting your search criteria to find what you\'re looking for.'
                : 'Get started by adding your first Telegram contact.'
              }
            </p>
            {!search && (
              <button
                onClick={() => navigate('/telegram/contacts/new')}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Contact
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
