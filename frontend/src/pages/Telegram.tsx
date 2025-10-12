import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Users, Send, Plus, MessageSquare } from 'lucide-react'
import { telegramAPI } from '../lib/api'

export default function Telegram() {
  const navigate = useNavigate()
  const location = useLocation()
  const [activeTab, setActiveTab] = useState<'contacts' | 'campaigns'>('contacts')

  // Update active tab based on current route
  useEffect(() => {
    if (location.pathname === '/telegram/campaigns') {
      setActiveTab('campaigns')
    } else if (location.pathname === '/telegram/contacts') {
      setActiveTab('contacts')
    } else {
      setActiveTab('contacts')
    }
  }, [location.pathname])

  // Fetch data for stats
  const { data: contactsResponse } = useQuery({
    queryKey: ['telegram-contacts-stats'],
    queryFn: () => telegramAPI.getTelegramContacts({ limit: 1 }),
  })

  const { data: campaignsResponse } = useQuery({
    queryKey: ['telegram-campaigns-stats'],
    queryFn: () => telegramAPI.getTelegramCampaigns({ limit: 1 }),
  })

  const totalContacts = contactsResponse?.data?.total || 0
  const totalCampaigns = campaignsResponse?.data?.total || 0

  const tabs = [
    {
      id: 'contacts' as const,
      name: 'Contacts',
      icon: Users,
      description: 'Manage Telegram contacts'
    },
    {
      id: 'campaigns' as const,
      name: 'Campaigns',
      icon: MessageSquare,
      description: 'Create and manage Telegram campaigns'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/dashboard')}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Telegram</h1>
                <p className="text-sm text-gray-500">Manage contacts and send messages</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    if (tab.id === 'campaigns') {
                      navigate('/telegram/campaigns')
                    } else if (tab.id === 'contacts') {
                      navigate('/telegram/contacts')
                    }
                  }}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.name}</span>
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {activeTab === 'contacts' && (
          <div className="space-y-6">
            {/* Contacts Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Telegram Contacts</h2>
                <p className="text-gray-600">Manage your Telegram contact list</p>
              </div>
              <button
                onClick={() => navigate('/telegram/contacts/new')}
                className="btn btn-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Contact
              </button>
            </div>

            {/* Contacts Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mr-4">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Contacts</p>
                    <p className="text-2xl font-bold text-gray-900">{totalContacts}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mr-4">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Campaigns</p>
                    <p className="text-2xl font-bold text-gray-900">{totalCampaigns}</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mr-4">
                    <Send className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-600">Messages Sent</p>
                    <p className="text-2xl font-bold text-gray-900">0</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => navigate('/telegram/contacts')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Users className="h-8 w-8 text-blue-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">View All Contacts</h4>
                      <p className="text-sm text-gray-600">Browse and manage contacts</p>
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => navigate('/telegram/contacts/import')}
                  className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center space-x-3">
                    <Plus className="h-8 w-8 text-green-600" />
                    <div>
                      <h4 className="font-medium text-gray-900">Import Contacts</h4>
                      <p className="text-sm text-gray-600">Import from CSV or other sources</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        )}


      </div>
    </div>
  )
}
