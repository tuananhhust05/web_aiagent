import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Plus, Search, Filter, Upload, MoreHorizontal, Users, Building2, Calendar, Phone } from 'lucide-react'
import { contactsAPI, callsAPI } from '../../lib/api'
import { formatDate, generateInitials } from '../../lib/utils'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function Contacts() {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sourceFilter, setSourceFilter] = useState('')

  const { data: contactsResponse, isLoading, error } = useQuery({
    queryKey: ['contacts', { search, status: statusFilter, source: sourceFilter }],
    queryFn: () => contactsAPI.getContacts({
      search,
      status: statusFilter || undefined,
      source: sourceFilter || undefined,
    }),
  })

  const callMutation = useMutation({
    mutationFn: (callData: any) => callsAPI.createCall(callData),
    onSuccess: (response) => {
      if (response.data.twilio_call_sid) {
        toast.success('Call initiated via Twilio successfully!')
      } else {
        toast.success('Call recorded successfully')
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to record call')
    },
  })


  const handleCall = (contact: any) => {
    const callData = {
      phone_number: contact.phone,
      agent_name: 'Manual Call',
      call_type: 'outbound',
      duration: 0, // Will be updated later if needed
      status: 'completed', // Default status
      meeting_booked: false,
      notes: `Call to ${contact.first_name} ${contact.last_name}`
    }
    
    callMutation.mutate(callData)
  }


  const contacts = contactsResponse?.data || []

  // Ensure contacts is always an array and map _id to id
  const contactsList = Array.isArray(contacts) ? contacts.map(contact => ({
    ...contact,
    id: contact.id || contact._id
  })) : []

  const statusOptions = [
    { value: '', label: 'All Status' },
    { value: 'lead', label: 'Lead' },
    { value: 'prospect', label: 'Prospect' },
    { value: 'customer', label: 'Customer' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ]

  const sourceOptions = [
    { value: '', label: 'All Sources' },
    { value: 'manual', label: 'Manual' },
    { value: 'csv_import', label: 'CSV Import' },
    { value: 'hubspot', label: 'HubSpot' },
    { value: 'salesforce', label: 'Salesforce' },
    { value: 'pipedrive', label: 'Pipedrive' },
  ]

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
            <Search className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Unable to load contacts
          </h3>
          <p className="text-gray-600 leading-relaxed">
            {error.message || 'Something went wrong while loading your contacts. Please try again.'}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-6 btn btn-primary btn-md"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Header Section */}
      <div className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-8 lg:mb-0">
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight mb-3">
              Contacts
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed max-w-2xl">
              Manage your contact list and build meaningful relationships for your voice agent campaigns
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              to="/contacts/import"
              className="btn btn-outline btn-lg group"
            >
              <Upload className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
              Import Contacts
            </Link>
            <Link
              to="/contacts/new"
              className="btn btn-primary btn-lg group"
            >
              <Plus className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
              Add Contact
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Total Contacts</p>
              <p className="text-2xl font-bold text-gray-900">{contactsList.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mr-4">
              <Building2 className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Companies</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Set(contactsList.map(c => c.company).filter(Boolean)).size}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mr-4">
              <Calendar className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {contactsList.filter(c => {
                  const created = new Date(c.created_at)
                  const now = new Date()
                  return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear()
                }).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-8">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Filters & Search</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Contacts
              </label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Name, email, or company..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
              >
                {sourceOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button className="w-full btn btn-outline btn-lg group">
                <Filter className="mr-2 h-5 w-5 transition-transform group-hover:scale-110" />
                Advanced
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Contacts List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">
            Contact List ({contactsList.length})
          </h2>
        </div>
        
        {contactsList.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {contactsList.map((contact) => (
              <div key={contact.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-sm">
                      <span className="text-sm font-semibold text-white">
                        {generateInitials(contact.first_name, contact.last_name)}
                      </span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-1">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {contact.first_name} {contact.last_name}
                        </h3>
                        <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
                          contact.status === 'customer' ? 'bg-green-100 text-green-800' :
                          contact.status === 'lead' ? 'bg-blue-100 text-blue-800' :
                          contact.status === 'prospect' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {contact.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-6 text-sm text-gray-600">
                        {contact.email && (
                          <span className="flex items-center">
                            <span className="mr-1">📧</span>
                            {contact.email}
                          </span>
                        )}
                        {contact.phone && (
                          <span className="flex items-center">
                            <span className="mr-1">📞</span>
                            {contact.phone}
                          </span>
                        )}
                        {contact.company && (
                          <span className="flex items-center">
                            <span className="mr-1">🏢</span>
                            {contact.company}
                          </span>
                        )}
                        <span className="flex items-center">
                          <span className="mr-1">📅</span>
                          {formatDate(contact.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {contact.phone && (
                      <>
                        <button
                          onClick={() => handleCall(contact)}
                          disabled={callMutation.isPending}
                          className="text-green-600 hover:text-green-700 font-medium transition-colors flex items-center disabled:opacity-50"
                        >
                          {callMutation.isPending ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <Phone className="h-4 w-4 mr-1" />
                              Record
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleTwilioCall(contact)}
                          disabled={twilioCallMutation.isPending}
                          className="text-blue-600 hover:text-blue-700 font-medium transition-colors flex items-center disabled:opacity-50"
                        >
                          {twilioCallMutation.isPending ? (
                            <LoadingSpinner size="sm" />
                          ) : (
                            <>
                              <Phone className="h-4 w-4 mr-1" />
                              Call
                            </>
                          )}
                        </button>
                      </>
                    )}
                    <Link
                      to={`/contacts/${contact.id}`}
                      className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                    >
                      View Details
                    </Link>
                    <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all duration-200">
                      <MoreHorizontal className="h-5 w-5" />
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
              {search || statusFilter || sourceFilter ? 'No contacts found' : 'No contacts yet'}
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto leading-relaxed">
              {search || statusFilter || sourceFilter
                ? 'Try adjusting your search criteria or filters to find what you\'re looking for.'
                : 'Get started by adding your first contact to build your voice agent campaign list.'
              }
            </p>
            {!search && !statusFilter && !sourceFilter && (
              <Link
                to="/contacts/new"
                className="btn btn-primary btn-lg group"
              >
                <Plus className="mr-3 h-5 w-5 transition-transform group-hover:scale-110" />
                Add Your First Contact
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
} 