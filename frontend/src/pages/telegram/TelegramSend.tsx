import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import { ArrowLeft, Send, Users, Check, X } from 'lucide-react'
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

export default function TelegramSend() {
  const navigate = useNavigate()
  const [message, setMessage] = useState('')
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [sendImmediately, setSendImmediately] = useState(true)

  const { data: contactsResponse, isLoading } = useQuery({
    queryKey: ['telegram-contacts'],
    queryFn: () => telegramAPI.getTelegramContacts(),
  })

  const sendMutation = useMutation({
    mutationFn: (data: any) => telegramAPI.sendTelegramMessage(data),
    onSuccess: () => {
      toast.success('Messages sent successfully!')
      setMessage('')
      setSelectedContacts([])
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || 'Failed to send messages')
    },
  })

  const contacts = contactsResponse?.data?.contacts?.map((contact: any) => ({
    ...contact,
    id: contact._id || contact.id // Ensure we have an id field
  })) || []
  const activeContacts = contacts.filter((contact: TelegramContact) => contact.is_active)

  const handleContactToggle = (contactId: string) => {
    setSelectedContacts(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    )
  }

  const handleSelectAll = () => {
    if (selectedContacts.length === activeContacts.length) {
      setSelectedContacts([])
    } else {
      setSelectedContacts(activeContacts.map((contact: TelegramContact) => contact.id))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) {
      toast.error('Please enter a message')
      return
    }
    if (selectedContacts.length === 0) {
      toast.error('Please select at least one contact')
      return
    }

    sendMutation.mutate({
      message: message.trim(),
      contact_ids: selectedContacts,
      send_immediately: sendImmediately
    })
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
            <h1 className="text-2xl font-bold text-gray-900">Send Telegram Message</h1>
            <p className="text-gray-600">Send messages manually to selected contacts</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Compose Message</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Type your message here..."
                  required
                />
                <p className="mt-1 text-sm text-gray-500">
                  {message.length} characters
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="send_immediately"
                  checked={sendImmediately}
                  onChange={(e) => setSendImmediately(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="send_immediately" className="ml-2 block text-sm text-gray-700">
                  Send immediately
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  {selectedContacts.length} contact{selectedContacts.length !== 1 ? 's' : ''} selected
                </div>
                <button
                  type="submit"
                  disabled={sendMutation.isPending || !message.trim() || selectedContacts.length === 0}
                  className="btn btn-primary"
                >
                  {sendMutation.isPending ? (
                    <>
                      <LoadingSpinner size="sm" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Contacts Selection */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Select Contacts</h3>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                {selectedContacts.length === activeContacts.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {activeContacts.length > 0 ? (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {activeContacts.map((contact: TelegramContact) => (
                  <div
                    key={contact.id}
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedContacts.includes(contact.id)
                        ? 'border-blue-200 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleContactToggle(contact.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                          selectedContacts.includes(contact.id)
                            ? 'border-blue-600 bg-blue-600'
                            : 'border-gray-300'
                        }`}>
                          {selectedContacts.includes(contact.id) && (
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
                <p className="text-sm text-gray-500">No active contacts available</p>
                <button
                  onClick={() => navigate('/telegram/contacts/new')}
                  className="mt-2 text-sm text-blue-600 hover:text-blue-700"
                >
                  Add contacts
                </button>
              </div>
            )}
          </div>

          {/* Selected Contacts Summary */}
          {selectedContacts.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Selected Contacts</h4>
              <div className="space-y-1">
                {selectedContacts.map(contactId => {
                  const contact = activeContacts.find((c: TelegramContact) => c.id === contactId)
                  return contact ? (
                    <div key={contactId} className="flex items-center justify-between text-sm">
                      <span className="text-blue-800">
                        {contact.first_name} {contact.last_name || ''}
                      </span>
                      <button
                        onClick={() => handleContactToggle(contactId)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : null
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
