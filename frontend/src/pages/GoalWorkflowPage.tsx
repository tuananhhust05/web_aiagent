import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronRight, Loader2, Plus, X } from 'lucide-react'
import { campaignsAPI, campaignGoalsAPI, contactsAPI, groupsAPI } from '../lib/api'
import { CreateConventionCampaignModal, ContactSelectorModal } from './ConventionActivities'

interface Contact {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  whatsapp_number?: string
  telegram_username?: string
  linkedin_profile?: string
}

interface CampaignGoal {
  id: string
  name: string
  description?: string
  color_gradient: string
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Group {
  id: string
  name: string
  description?: string
  member_count: number
  color?: string
}

interface GoalWorkflowPageProps {
  title: string
  subtitle: string
  sourceKey: string
  workflowFunction: string
}


const GoalWorkflowPage: React.FC<GoalWorkflowPageProps> = ({ title, subtitle, sourceKey }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const [campaignGoals, setCampaignGoals] = useState<CampaignGoal[]>([])
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [loadingGoals, setLoadingGoals] = useState(false)
  const [showCreateGoalModal, setShowCreateGoalModal] = useState(false)
  const [showCreateCampaign, setShowCreateCampaign] = useState(false)
  const [showContactSelector, setShowContactSelector] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [contactSearchTerm, setContactSearchTerm] = useState('')
  const [loadingContacts, setLoadingContacts] = useState(false)

  const selectedGoal = useMemo(
    () => campaignGoals.find(goal => goal.id === selectedGoalId) || null,
    [campaignGoals, selectedGoalId]
  )

  useEffect(() => {
    fetchCampaignGoals()
    fetchGroups()
    fetchAllContacts()
  }, [])

  // Handle query params to auto-select goal and open campaign modal
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const goalId = params.get('goalId')
    const createCampaign = params.get('createCampaign') === 'true'
    if (goalId) {
      setSelectedGoalId(goalId)
    }
    if (createCampaign) {
      setShowCreateCampaign(true)
    }
  }, [location.search])

  const fetchCampaignGoals = async () => {
    try {
      setLoadingGoals(true)
      const response = await campaignGoalsAPI.getGoals(sourceKey)
      const goals = response.data || []
      setCampaignGoals(goals)
      if (!selectedGoalId && goals.length > 0) {
        setSelectedGoalId(goals[0].id)
      }
    } catch (error) {
      console.error('Error fetching campaign goals:', error)
    } finally {
      setLoadingGoals(false)
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await groupsAPI.getGroups()
      setGroups(response.data?.groups || [])
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

  const fetchAllContacts = async () => {
    try {
      setLoadingContacts(true)
      const response = await contactsAPI.getContacts({
        limit: 1000,
        offset: 0,
      })
      setAllContacts(response.data || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoadingContacts(false)
    }
  }

  const createCampaignGoal = (goalData: { name: string; description?: string }) => {
    const payload = { ...goalData, source: sourceKey }
    campaignGoalsAPI.createGoal(payload)
      .then(() => {
        setShowCreateGoalModal(false)
        fetchCampaignGoals()
      })
      .catch((error) => {
        console.error('Campaign goal creation error:', error)
        alert('Failed to create campaign goal')
      })
  }

  const createCampaign = (campaignData: any) => {
    const newCampaign = {
      name: campaignData.name || '',
      description: campaignData.description || '',
      status: 'draft',
      type: campaignData.type || 'manual',
      source: sourceKey,
      campaign_goal_id: campaignData.campaign_goal_id || selectedGoalId || null,
      contacts: selectedContacts.filter(Boolean),
      group_ids: campaignData.group_ids || [],
      call_script: campaignData.call_script || '',
      schedule_time: campaignData.type === 'scheduled' && campaignData.schedule_time ? campaignData.schedule_time : null,
      schedule_settings: campaignData.type === 'scheduled' ? campaignData.schedule_settings : null,
      settings: {},
    }

    campaignsAPI.createCampaign(newCampaign)
      .then(() => {
        setShowCreateCampaign(false)
        setSelectedContacts([])
      })
      .catch((error) => {
        console.error('Campaign creation error:', error)
        alert('Failed to create campaign')
      })
  }

  const handleContactToggle = (contactId: string) => {
    if (!contactId) return
    setSelectedContacts(prev => prev.includes(contactId) ? prev.filter(id => id !== contactId) : [...prev, contactId])
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>
        <button
          onClick={() => setShowCreateGoalModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Goal
        </button>
      </div>

      <div className="bg-white border rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Goals</h2>
          {loadingGoals && (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {campaignGoals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => navigate(`/campaign-goals/${goal.id}`)}
              className={`flex items-center justify-between w-full rounded-lg border px-4 py-3 text-left transition-all ${
                selectedGoalId === goal.id ? 'border-blue-500 bg-blue-50 shadow-sm' : 'hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-8 w-8 rounded-full border shadow-sm"
                  style={{ background: (goal as any).color_gradient || '#3B82F6' }}
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900">{goal.name}</div>
                  {goal.description && <div className="text-xs text-gray-500 line-clamp-2 mt-1">{goal.description}</div>}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-400" />
            </button>
          ))}

          <button
            onClick={() => setShowCreateGoalModal(true)}
            className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm font-semibold text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
          >
            <Plus className="h-5 w-5 mb-2" />
            Add Goal
          </button>
        </div>

        {campaignGoals.length === 0 && !loadingGoals && (
          <div className="text-center py-10">
            <p className="text-gray-600">No goals yet. Add your first goal to get started.</p>
          </div>
        )}
      </div>

      {selectedGoal ? (
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-8 text-center text-gray-600">
            Select a goal to see KPIs and contact campaigns. Template workflows are now available in the goal detail page.
          </div>
        </div>
      ) : (
        <div className="bg-white border rounded-xl p-8 text-center text-gray-600">
          Select a goal to see KPIs and contact campaigns.
        </div>
      )}

      {showCreateCampaign && (
        <CreateConventionCampaignModal
          onClose={() => {
            setShowCreateCampaign(false)
            setShowContactSelector(false)
          }}
          onSubmit={createCampaign}
          onSelectContacts={() => setShowContactSelector(true)}
          selectedContactsCount={selectedContacts.length}
          groups={groups}
          allContacts={allContacts}
          selectedContacts={selectedContacts}
          campaignGoals={campaignGoals}
          defaultGoalId={selectedGoalId || ''}
        />
      )}

      {showCreateGoalModal && (
        <CreateCampaignGoalModal
          onClose={() => setShowCreateGoalModal(false)}
          onSubmit={createCampaignGoal}
        />
      )}

      {showContactSelector && (
        <ContactSelectorModal
          contacts={allContacts}
          selectedContacts={selectedContacts}
          onToggle={handleContactToggle}
          onClose={() => {
            setShowContactSelector(false)
            setContactSearchTerm('')
          }}
          onConfirm={() => setShowContactSelector(false)}
          searchTerm={contactSearchTerm}
          onSearchChange={setContactSearchTerm}
          loading={loadingContacts}
        />
      )}
    </div>
  )
}

function CreateCampaignGoalModal({
  onClose,
  onSubmit
}: {
  onClose: () => void
  onSubmit: (data: { name: string; description?: string }) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Please enter a goal name')
      return
    }
    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined
    })
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Create Campaign Goal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Goal Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="e.g., Book a Meeting, Lead Nurturing"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              placeholder="Describe what this goal aims to achieve..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Create Goal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default GoalWorkflowPage

