import React, { useState, useEffect } from 'react'
import { X, Save, User, DollarSign, Target, TrendingUp, AlertCircle, FileText, CheckCircle, XCircle } from 'lucide-react'
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

interface Deal {
  id: string
  name: string
  description?: string
  contact_id: string
  company_id?: string
  campaign_id?: string
  pipeline_id?: string
  stage_id?: string
  status: string
  priority?: string
  amount?: number
  cost: number
  revenue: number
  probability?: number
  expected_close_date?: string
  actual_close_date?: string
  start_date?: string
  end_date?: string
  next_step?: string
  loss_reason?: string
  win_reason?: string
  created_at: string
  updated_at: string
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  campaign_name?: string
}

interface DealEditModalProps {
  isOpen: boolean
  onClose: () => void
  deal: Deal | null
  onSuccess: () => void
}

const priorityOptions: { value: DealPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-700' },
  { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-700' },
  { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-700' },
  { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-700' },
]

const DealEditModal: React.FC<DealEditModalProps> = ({
  isOpen,
  onClose,
  deal,
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
    actual_close_date: '',
    start_date: '',
    end_date: '',
    next_step: '',
    loss_reason: '',
    win_reason: ''
  })
  
  const [contacts, setContacts] = useState<Contact[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipeline, setSelectedPipeline] = useState<Pipeline | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loadingData, setLoadingData] = useState(false)

  useEffect(() => {
    if (isOpen && deal) {
      // Populate form with deal data
      setFormData({
        name: deal.name,
        description: deal.description || '',
        contact_id: deal.contact_id,
        campaign_id: deal.campaign_id || '',
        pipeline_id: deal.pipeline_id || '',
        stage_id: deal.stage_id || deal.status || 'lead',
        status: (deal.status || 'lead') as DealStatus,
        priority: (deal.priority || 'medium') as DealPriority,
        amount: deal.amount || deal.revenue || 0,
        cost: deal.cost || 0,
        revenue: deal.revenue || 0,
        probability: deal.probability || 0,
        expected_close_date: deal.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
        actual_close_date: deal.actual_close_date ? deal.actual_close_date.split('T')[0] : '',
        start_date: deal.start_date ? deal.start_date.split('T')[0] : '',
        end_date: deal.end_date ? deal.end_date.split('T')[0] : '',
        next_step: deal.next_step || '',
        loss_reason: deal.loss_reason || '',
        win_reason: deal.win_reason || ''
      })
      
      fetchData()
    }
  }, [isOpen, deal])

  // Update selected pipeline when pipeline_id changes
  useEffect(() => {
    if (formData.pipeline_id) {
      const pipeline = pipelines.find(p => p.id === formData.pipeline_id)
      setSelectedPipeline(pipeline || null)
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
      
      // Only set selected pipeline if deal already has a pipeline_id
      // Don't auto-select pipeline to avoid showing wrong pipeline when viewing from different pipeline context
      if (deal?.pipeline_id) {
        const pipeline = pipelineList.find((p: Pipeline) => p.id === deal.pipeline_id)
        setSelectedPipeline(pipeline || null)
      }
      // Removed auto-selection of default pipeline to prevent confusion
    } catch (err: any) {
      setError('Failed to load data')
    } finally {
      setLoadingData(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim() || !formData.contact_id || !deal) {
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
        actual_close_date: formData.actual_close_date || undefined,
        start_date: formData.start_date || undefined,
        end_date: formData.end_date || undefined,
        next_step: formData.next_step || undefined,
        loss_reason: formData.loss_reason || undefined,
        win_reason: formData.win_reason || undefined
      }
      
      await dealsAPI.updateDeal(deal.id, submitData)
      onSuccess()
      onClose()
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update deal')
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

  const handleStageChange = (stageId: string) => {
    setFormData(prev => ({ ...prev, stage_id: stageId, status: stageId as DealStatus }))
    
    // Update probability based on stage
    if (selectedPipeline) {
      const stage = selectedPipeline.stages.find(s => s.id === stageId)
      if (stage) {
        setFormData(prev => ({ ...prev, probability: stage.probability }))
      }
    }
  }

  // Calculate weighted value
  const weightedValue = (formData.amount || formData.revenue) * (formData.probability / 100)
  const isClosed = formData.stage_id === 'closed_won' || formData.stage_id === 'closed_lost'
  const isWon = formData.stage_id === 'closed_won'
  if (!isOpen || !deal) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Edit Deal</h2>
            <p className="text-sm text-gray-500 mt-0.5">{deal.name}</p>
          </div>
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
                      onChange={(e) => handleStageChange(e.target.value)}
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

              {/* Closed Deal Fields */}
              {isClosed && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                    {isWon ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600" />
                    )}
                    {isWon ? 'Won Deal' : 'Lost Deal'}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Actual Close Date
                      </label>
                      <input
                        type="date"
                        name="actual_close_date"
                        value={formData.actual_close_date}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {isWon ? 'Win Reason' : 'Loss Reason'}
                      </label>
                      <input
                        type="text"
                        name={isWon ? 'win_reason' : 'loss_reason'}
                        value={isWon ? formData.win_reason : formData.loss_reason}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder={isWon ? 'Why did we win?' : 'Why did we lose?'}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Next Step */}
              {!isClosed && (
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
              )}
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
              Update Deal
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default DealEditModal
