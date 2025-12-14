import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  ChevronRight,
  Loader2,
  Plus,
  Search,
  Users,
  X
} from 'lucide-react'
import { campaignsAPI, campaignGoalsAPI, conventionActivitiesAPI, groupsAPI } from '../lib/api'

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


const ConventionActivities: React.FC = () => {
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
      const response = await campaignGoalsAPI.getGoals('convention-activities')
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
      const response = await conventionActivitiesAPI.getActivities({
        limit: 100,
        offset: 0,
      })
      setAllContacts(response.data?.contacts || [])
    } catch (error) {
      console.error('Error fetching contacts:', error)
    } finally {
      setLoadingContacts(false)
    }
  }

  const createCampaignGoal = (goalData: { name: string; description?: string }) => {
    const payload = { ...goalData, source: 'convention-activities' }
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
      source: 'convention-activities',
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Conversion Activities</h1>
          <p className="text-gray-600">Convert your leads into clients</p>
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

// Create Convention Campaign Modal Component
function CreateConventionCampaignModal({ onClose, onSubmit, onSelectContacts, selectedContactsCount, groups, allContacts, selectedContacts, campaignGoals, defaultGoalId, workflows = [] }: {
  onClose: () => void
  onSubmit: (data: any) => void
  onSelectContacts: () => void
  selectedContactsCount: number
  groups: Group[]
  allContacts: any[]
  selectedContacts: string[]
  campaignGoals: CampaignGoal[]
  defaultGoalId?: string
  workflows?: any[]
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'manual' as 'manual',
    call_script: '',
    schedule_time: '',
    group_ids: [] as string[],
    campaign_goal_id: defaultGoalId || '',
    workflow_id: '',
    schedule_settings: undefined as any
  })

  useEffect(() => {
    if (defaultGoalId) {
      setFormData(prev => ({ ...prev, campaign_goal_id: defaultGoalId }))
    }
  }, [defaultGoalId])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('Campaign name is required')
      return
    }
    if (!formData.call_script.trim()) {
      alert('Call script is required')
      return
    }
    if (formData.group_ids.length === 0 && selectedContactsCount === 0) {
      alert('Please select at least one group or contact')
      return
    }
    onSubmit({ ...formData, type: 'manual', schedule_settings: undefined, schedule_time: undefined })
  }

  return (
    <div style={{ marginTop: 0 }} className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Create Convention Campaign</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter campaign name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Describe your campaign"
            />
          </div>

          {/* Campaign type removed; default manual. Scheduling hidden. */}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Groups (Optional)
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {groups.length === 0 ? (
                <p className="text-gray-500 text-sm">No groups available. Create groups first.</p>
              ) : (
                groups.map((group) => (
                  <label key={group.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.group_ids.includes(group.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, group_ids: [...prev.group_ids, group.id] }))
                        } else {
                          setFormData(prev => ({ ...prev, group_ids: prev.group_ids.filter(id => id !== group.id) }))
                        }
                      }}
                      className="mr-3"
                    />
                    <div className="flex items-center">
                      <div 
                        className="w-4 h-4 rounded-full mr-3" 
                        style={{ backgroundColor: group.color || '#3B82F6' }}
                      />
                      <div>
                        <div className="font-medium">{group.name}</div>
                        <div className="text-sm text-gray-500">{group.member_count} members</div>
                      </div>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Call Script
            </label>
            <textarea
              value={formData.call_script}
              onChange={(e) => setFormData(prev => ({ ...prev, call_script: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={4}
              placeholder="Enter the script that AI will use when making calls..."
              required
            />
            <p className="text-sm text-gray-500 mt-1">
              This script will guide the AI during phone calls. Be specific about your goals and key talking points.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Campaign Goal (Optional)
            </label>
            <select
              value={formData.campaign_goal_id}
              onChange={(e) => setFormData(prev => ({ ...prev, campaign_goal_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a campaign goal (optional)</option>
              {campaignGoals.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.name}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-1">
              Choose a campaign goal to associate with this campaign.
            </p>
          </div>

          {workflows.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workflow Template
              </label>
              <select
                value={formData.workflow_id}
                onChange={(e) => setFormData(prev => ({ ...prev, workflow_id: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a workflow template</option>
                {workflows.map((workflow) => (
                  <option key={workflow.id} value={workflow.id}>
                    {workflow.name || (workflow.template_type === 'forskale' ? 'ForSkale Template' : 'Personal Template')}
                  </option>
                ))}
              </select>
              <p className="text-sm text-gray-500 mt-1">
                Choose a workflow template to use for this campaign.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Contacts
            </label>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  console.log('Opening contact selector...');
                  console.log('Current allContacts:', allContacts);
                  console.log('Current selectedContacts:', selectedContacts);
                  onSelectContacts();
                }}
                className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
              >
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <div className="text-gray-600">
                  {selectedContactsCount > 0 || formData.group_ids.length > 0
                    ? `${selectedContactsCount} contacts + ${formData.group_ids.length} groups selected`
                    : 'Click to select contacts'
                  }
                </div>
              </button>
              
              {/* Debug info */}
              <div className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                Debug: {allContacts?.length || 0} contacts loaded, {selectedContacts.length} selected
              </div>
            </div>
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
              Create Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Contact Selector Modal Component
function ContactSelectorModal({ 
  contacts, 
  selectedContacts, 
  onToggle, 
  onClose, 
  onConfirm,
  searchTerm,
  onSearchChange,
  loading 
}: {
  contacts: Contact[]
  selectedContacts: string[]
  onToggle: (id: string) => void
  onClose: () => void
  onConfirm: () => void
  searchTerm: string
  onSearchChange: (term: string) => void
  loading: boolean
}) {
  console.log('ContactSelectorModal - contacts:', contacts);
  console.log('ContactSelectorModal - searchTerm:', searchTerm);
  console.log('ContactSelectorModal - selectedContacts:', selectedContacts);
  
  const filteredContacts = contacts.filter(contact => 
    contact.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  console.log('ContactSelectorModal - filteredContacts:', filteredContacts);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Select Contacts</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredContacts.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No contacts found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredContacts.map((contact) => (
                <label
                  key={contact.id}
                  className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    checked={!!(contact.id && selectedContacts.includes(contact.id))}
                    onChange={() => {
                      console.log('=== Checkbox clicked ===');
                      console.log('Contact object:', contact);
                      console.log('Contact ID:', contact.id);
                      console.log('Contact ID type:', typeof contact.id);
                      console.log('Contact first_name:', contact.first_name);
                      console.log('Contact last_name:', contact.last_name);
                      
                      if (contact.id) {
                        console.log('Calling onToggle with contact.id:', contact.id);
                        onToggle(contact.id);
                      } else {
                        console.log('Contact ID is missing or falsy:', contact);
                      }
                    }}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium">
                      {contact.first_name} {contact.last_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {contact.email} • {contact.phone}
                    </div>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Confirm Selection ({selectedContacts.length} selected)
          </button>
        </div>
      </div>
    </div>
  )
}

// Create Campaign Goal Modal Component
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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Please enter a goal name');
      return;
    }
    onSubmit({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined
    });
  };

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
  );
}

export { CreateConventionCampaignModal, ContactSelectorModal };
export default ConventionActivities;
