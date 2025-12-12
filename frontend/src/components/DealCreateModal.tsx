import React, { useState, useEffect } from 'react'
import { X, Save, User, Calendar, DollarSign, Target, TrendingUp, Flag, AlertCircle, FileText } from 'lucide-react'
import { dealsAPI, pipelinesAPI, DealStatus, DealPriority } from '../lib/api'
import LoadingSpinner from './ui/LoadingSpinner'

interface Contact {
  id: string
  name: string
  email: string
  phone: string
}

interface Campaign {
  id: string
  name: string
  status: string
}

interface Pipeline {
  id: string
  name: string
  stages: Array<{
    id: string
    name: string
    probability: number
    color: string
  }>
}

interface DealCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const statusOptions: { value: DealStatus; label: string; color: string }[] = [
  { value: 'lead', label: 'Lead', color: 'bg-blue-100 text-blue-800' },
  { value: 'qualified', label: 'Qualified', color: 'bg-purple-100 text-purple-800' },
  { value: 'demo', label: 'Demo/Meeting', color: 'bg-amber-100 text-amber-800' },
  { value: 'proposal', label: 'Proposal Sent', color: 'bg-orange-100 text-orange-800' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-red-100 text-red-800' },
  { value: 'closed_won', label: 'Closed Won', color: 'bg-green-100 text-green-800' },
  { value: 'closed_lost', label: 'Closed Lost', color: 'bg-gray-100 text-gray-800' },
]

const priorityOptions: { value: DealPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
]

const DealCreateModal: React.FC<DealCreateModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    contact_id: '',
    campaign_id: '',
    pipeline_id: '',
    stage_id: '',
    status: 'lead' as DealStatus,
    priority: 'medium' as DealPriority,
    amount: 0,
    cost: 0,
    revenue: 0,
    probability: 0,
    expected_close_date: '',
    start_date: '',
    end_date: '',
    next_step: ''
  })
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  // Update probability when stage changes
  useEffect(() => {
    if (selectedPipeline && formData.stage_id) {
      const stage = selectedPipeline.stages.find(s => s.id === formData.stage_id)
      if (stage) {
        setFormData(prev => ({ ...prev, probability: stage.probability, status: formData.stage_id as DealStatus }))
      }
    }
  }, [formData.stage_id, selectedPipeline])

  // Update selected pipeline when pipeline_id changes
  useEffect(() => {
    if (formData.pipeline_id) {
      const pipeline = pipelines.find(p => p.id === formData.pipeline_id)
      setSelectedPipeline(pipeline || null)
      if (pipeline && pipeline.stages.length > 0 && !formData.stage_id) {
        setFormData(prev => ({ ...prev, stage_id: pipeline.stages[0].id }))
      }
    }
  }, [formData.pipeline_id, pipelines])

  const fetchData = async () => {
    try {
      setLoadingData(true)
      const [contactsRes, campaignsRes, pipelinesRes] = await Promise.all([
        dealsAPI.getContacts(),
        dealsAPI.getCampaigns(),
        pipelinesAPI.getPipelines()
      ])
      
      // Transform contacts to include full name
      const transformedContacts = contactsRes.data.map((contact: any) => ({
        ...contact,
        id: contact._id,
        name: `${contact.first_name} ${contact.last_name}`.trim()
      }))
      setContacts(transformedContacts)
      setCampaigns(campaignsRes.data)
      
      const pipelineList = pipelinesRes.data.pipelines || []
      setPipelines(pipelineList)
      
      // Set default pipeline
      if (pipelineList.length > 0) {
        const defaultPipeline = pipelineList.find((p: Pipeline) => (p as any).is_default) || pipelineList[0]
        setFormData(prev => ({ 
          ...prev, 
          pipeline_id: defaultPipeline.id,
          stage_id: defaultPipeline.stages[0]?.id || ''
        }))
        setSelectedPipeline(defaultPipeline)
      }
    } catch (err: any) {
      setError('Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.contact_id) {
      setError('Name and contact are required')
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const submitData = {
        ...formData,
        amount: parseFloat(formData.amount.toString()) || 0,
        cost: parseFloat(formData.cost.toString()) || 0,
        revenue: parseFloat(formData.revenue.toString()) || formData.amount,
        probability: parseFloat(formData.probability.toString()) || 0,
        campaign_id: formData.campaign_id || undefined,
        pipeline_id: formData.pipeline_id || undefined,
        stage_id: formData.stage_id || undefined,
        expected_close_date: formData.expected_close_date || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        next_step: formData.next_step || undefined
      }
      
      await dealsAPI.createDeal(submitData)
      onSuccess()
      onClose()
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        contact_id: '',
        campaign_id: '',
        pipeline_id: '',
        stage_id: '',
        status: 'lead',
        priority: 'medium',
        amount: 0,
        cost: 0,
        revenue: 0,
        probability: 0,
        expected_close_date: '',
        start_date: '',
        end_date: '',
        next_step: ''
      })
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create deal')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // Calculate weighted value
  const weightedValue = (formData.amount || formData.revenue) * (formData.probability / 100)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Create New Deal</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loadingData ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Basic Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Deal Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="e.g., Enterprise License - Acme Corp"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Brief description of the deal..."
                    />
                  </div>
                </div>
              </div>

              {/* Contact and Campaign */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Contact & Campaign
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact *
                    </label>
                    <select
                      name="contact_id"
                      value={formData.contact_id}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a contact</option>
                      {contacts.map((contact) => (
                        <option key={contact.id} value={contact.id}>
                          {contact.name} ({contact.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Campaign (Optional)
                    </label>
                    <select
                      name="campaign_id"
                      value={formData.campaign_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a campaign</option>
                      {campaigns.map((campaign) => (
                        <option key={campaign.id} value={campaign.id}>
                          {campaign.name} ({campaign.status})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Pipeline & Stage */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Pipeline & Stage
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pipeline
                    </label>
                    <select
                      name="pipeline_id"
                      value={formData.pipeline_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {pipelines.map((pipeline) => (
                        <option key={pipeline.id} value={pipeline.id}>
                          {pipeline.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stage
                    </label>
                    <select
                      name="stage_id"
                      value={formData.stage_id}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {selectedPipeline?.stages.map((stage) => (
                        <option key={stage.id} value={stage.id}>
                          {stage.name} ({stage.probability}%)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priority
                    </label>
                    <select
                      name="priority"
                      value={formData.priority}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {priorityOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Win Probability (%)
                    </label>
                    <input
                      type="number"
                      name="probability"
                      value={formData.probability}
                      onChange={handleInputChange}
                      min="0"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Financial */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  Deal Value
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (USD)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={formData.amount}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cost (USD)
                    </label>
                    <input
                      type="number"
                      name="cost"
                      value={formData.cost}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Close Date
                    </label>
                    <input
                      type="date"
                      name="expected_close_date"
                      value={formData.expected_close_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Weighted Value Preview */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-sm font-medium text-blue-700">Weighted Value:</span>
                      <p className="text-xs text-blue-600 mt-0.5">Amount × Win Probability</p>
                    </div>
                    <span className="text-xl font-bold text-blue-700">
                      ${weightedValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Next Step */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Next Step
                </h3>
                
                <div>
                  <textarea
                    name="next_step"
                    value={formData.next_step}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="What's the next action for this deal?"
                  />
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <LoadingSpinner />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Create Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DealCreateModal
