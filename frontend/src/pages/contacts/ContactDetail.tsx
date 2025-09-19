import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Edit, Trash2, Phone, Mail, Building2, User } from 'lucide-react'
import { contactsAPI, callsAPI } from '../../lib/api'
import { formatDate, generateInitials } from '../../lib/utils'
import { toast } from 'react-hot-toast'
import LoadingSpinner from '../../components/ui/LoadingSpinner'

export default function ContactDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: contactResponse, isLoading } = useQuery({
    queryKey: ['contact', id],
    queryFn: () => contactsAPI.getContact(id!),
    enabled: !!id,
  })

  const contact = contactResponse?.data

  const deleteMutation = useMutation({
    mutationFn: () => contactsAPI.deleteContact(id!),
    onSuccess: () => {
      toast.success('Contact deleted successfully')
      navigate('/contacts')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to delete contact')
    },
  })

  const callMutation = useMutation({
    mutationFn: (callData: any) => callsAPI.createCall(callData),
    onSuccess: () => {
      toast.success('Call recorded successfully')
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


  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!contact) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Contact not found</h3>
        <p className="text-gray-600">The contact you're looking for doesn't exist.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/contacts')}
            className="btn btn-outline btn-sm"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {contact.first_name} {contact.last_name}
            </h1>
            <p className="text-gray-600">Contact Details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <button className="btn btn-outline btn-md">
            <Edit className="h-4 w-4" />
            <span className="ml-2">Edit</span>
          </button>
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this contact?')) {
                deleteMutation.mutate()
              }
            }}
            disabled={deleteMutation.isPending}
            className="btn btn-outline btn-md text-red-600 hover:text-red-700"
          >
            {deleteMutation.isPending ? (
              <LoadingSpinner className="h-4 w-4" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            <span className="ml-2">Delete</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Contact Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Contact Information</h3>
            </div>
            <div className="card-content">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-xl font-medium text-primary-600">
                      {generateInitials(contact.first_name, contact.last_name)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">First Name</label>
                      <p className="mt-1 text-sm text-gray-900">{contact.first_name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Last Name</label>
                      <p className="mt-1 text-sm text-gray-900">{contact.last_name}</p>
                    </div>
                  </div>
                  
                  {contact.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{contact.email}</span>
                    </div>
                  )}
                  
                  {contact.phone && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{contact.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          {(contact.company || contact.job_title) && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Company Information</h3>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {contact.company && (
                    <div className="flex items-center space-x-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{contact.company}</span>
                    </div>
                  )}
                  {contact.job_title && (
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="text-sm text-gray-900">{contact.job_title}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          {contact.notes && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Notes</h3>
              </div>
              <div className="card-content">
                <p className="text-sm text-gray-900 whitespace-pre-wrap">{contact.notes}</p>
              </div>
            </div>
          )}

          {/* Custom Fields */}
          {contact.custom_fields && Object.keys(contact.custom_fields).length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Custom Fields</h3>
              </div>
              <div className="card-content">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Object.entries(contact.custom_fields).map(([key, value]) => (
                    <div key={key}>
                      <label className="block text-sm font-medium text-gray-700 capitalize">
                        {key.replace('_', ' ')}
                      </label>
                      <p className="mt-1 text-sm text-gray-900">{String(value) || '-'}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Source */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Status & Source</h3>
            </div>
            <div className="card-content space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Status</label>
                <span className={`inline-flex mt-1 px-2 py-1 text-xs font-semibold rounded-full ${
                  contact.status === 'customer' ? 'bg-green-100 text-green-800' :
                  contact.status === 'lead' ? 'bg-blue-100 text-blue-800' :
                  contact.status === 'prospect' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {contact.status}
                </span>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Source</label>
                <p className="mt-1 text-sm text-gray-900 capitalize">{contact.source}</p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {contact.tags && contact.tags.length > 0 && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">Tags</h3>
              </div>
              <div className="card-content">
                <div className="flex flex-wrap gap-2">
                  {contact.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Timestamps</h3>
            </div>
            <div className="card-content space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700">Created</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(contact.created_at)}</p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Updated</label>
                <p className="mt-1 text-sm text-gray-900">{formatDate(contact.updated_at)}</p>
              </div>
              
              {contact.last_contacted && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Contacted</label>
                  <p className="mt-1 text-sm text-gray-900">{formatDate(contact.last_contacted)}</p>
                </div>
              )}
            </div>
          </div>

          {/* CRM Integration */}
          {(contact.crm_id || contact.crm_source) && (
            <div className="card">
              <div className="card-header">
                <h3 className="card-title">CRM Integration</h3>
              </div>
              <div className="card-content space-y-3">
                {contact.crm_source && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CRM Source</label>
                    <p className="mt-1 text-sm text-gray-900 capitalize">{contact.crm_source}</p>
                  </div>
                )}
                
                {contact.crm_id && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CRM ID</label>
                    <p className="mt-1 text-sm text-gray-900">{contact.crm_id}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-8 flex items-center justify-end space-x-4">
        <button
          onClick={() => handleCall(contact)}
          disabled={!contact?.phone || callMutation.isPending}
          className="btn btn-primary btn-lg"
        >
          {callMutation.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Phone className="h-5 w-5 mr-2" />
              Call {contact?.first_name}
            </>
          )}
        </button>
        <button className="btn btn-outline btn-lg">
          <Edit className="h-5 w-5 mr-2" />
          Edit Contact
        </button>
        <button
          onClick={() => deleteMutation.mutate()}
          disabled={deleteMutation.isPending}
          className="btn btn-outline btn-lg text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          {deleteMutation.isPending ? (
            <LoadingSpinner size="sm" />
          ) : (
            <>
              <Trash2 className="h-5 w-5 mr-2" />
              Delete
            </>
          )}
        </button>
      </div>

    </div>
  )
} 