import React, { useState, useEffect, useCallback } from 'react'
import { 
  DollarSign, 
  User, 
  Calendar,
  GripVertical,
  Eye,
  Edit,
  Trash2,
  TrendingUp,
  RefreshCw,
  Filter,
  ChevronDown,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BarChart3,
  Settings,
  Target,
  Percent,
  CalendarDays,
  Activity,
  Plus
} from 'lucide-react'
import { dealsAPI, pipelinesAPI, DealViewType } from '../lib/api'
import LoadingSpinner from './ui/LoadingSpinner'
import PipelineSettings from './PipelineSettings'

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
  priority: string
  amount: number
  cost: number
  revenue: number
  probability?: number
  expected_close_date?: string
  last_activity_date?: string
  created_at: string
  updated_at: string
  weighted_value?: number
  days_in_stage?: number
  is_stalled?: boolean
  contact_name?: string
  contact_email?: string
  contact_phone?: string
  campaign_name?: string
  pipeline_name?: string
  stage_name?: string
  next_step?: string
}

interface PipelineStage {
  id: string
  name: string
  probability: number
  color: string
  deals: Deal[]
  total_value: number
  weighted_value: number
  count: number
}

interface PipelineData {
  pipeline_id: string
  pipeline_name: string
  stages: PipelineStage[]
  total_deals: number
  total_value: number
  weighted_value: number
  forecast_this_month: number
  forecast_this_quarter: number
}

interface Pipeline {
  id: string
  name: string
  description?: string
  business_type?: string
  is_default: boolean
  stages: Array<{
    id: string
    name: string
    probability: number
    color: string
  }>
  deal_count: number
}

interface SalesPipelineProps {
  onViewDeal?: (deal: Deal) => void
  onEditDeal?: (deal: Deal) => void
  onDeleteDeal?: (dealId: string) => void
}

const viewTypeOptions: { value: DealViewType; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All Deals', icon: <Target className="h-4 w-4" /> },
  { value: 'open', label: 'Open Deals', icon: <Activity className="h-4 w-4" /> },
  { value: 'closed_won', label: 'Won', icon: <CheckCircle className="h-4 w-4" /> },
  { value: 'closed_lost', label: 'Lost', icon: <XCircle className="h-4 w-4" /> },
  { value: 'stalled', label: 'Stalled', icon: <AlertTriangle className="h-4 w-4" /> },
  { value: 'closing_this_month', label: 'Closing This Month', icon: <CalendarDays className="h-4 w-4" /> },
  { value: 'closing_this_quarter', label: 'Closing This Quarter', icon: <Calendar className="h-4 w-4" /> },
]

const priorityColors: Record<string, string> = {
  low: 'bg-gray-100 text-gray-700',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
}

export default function SalesPipeline({ onViewDeal, onEditDeal, onDeleteDeal }: SalesPipelineProps) {
  const [pipelineData, setPipelineData] = useState<PipelineData | null>(null)
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null)
  const [viewType, setViewType] = useState<DealViewType>('all')
  const [loading, setLoading] = useState(true)
  const [pipelinesLoading, setPipelinesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [draggedDeal, setDraggedDeal] = useState<Deal | null>(null)
  const [dragOverStage, setDragOverStage] = useState<string | null>(null)
  const [updatingDeal, setUpdatingDeal] = useState<string | null>(null)
  const [showPipelineSelector, setShowPipelineSelector] = useState(false)
  const [showViewFilter, setShowViewFilter] = useState(false)
  const [showForecast, setShowForecast] = useState(true)
  const [showPipelineSettingsModal, setShowPipelineSettingsModal] = useState(false)
  const [editingPipelineId, setEditingPipelineId] = useState<string | null>(null)

  // Fetch pipelines
  const fetchPipelines = useCallback(async () => {
    try {
      setPipelinesLoading(true)
      const response = await pipelinesAPI.getPipelines()
      const pipelineList = response.data.pipelines || []
      
      // If no pipelines exist, automatically create a default one
      if (pipelineList.length === 0) {
        try {
          console.log('No pipelines found, creating default pipeline...')
          await pipelinesAPI.getDefaultPipeline()
          
          // Refresh pipelines list
          const refreshResponse = await pipelinesAPI.getPipelines()
          const refreshedList = refreshResponse.data.pipelines || []
          setPipelines(refreshedList)
          
          if (refreshedList.length > 0 && !selectedPipelineId) {
            const defaultPipeline = refreshedList.find((p: Pipeline) => p.is_default) || refreshedList[0]
            setSelectedPipelineId(defaultPipeline.id)
          }
        } catch (createErr: any) {
          console.error('Failed to create default pipeline:', createErr)
          setLoading(false)
          setError('Failed to create default pipeline. Please try creating one manually.')
        }
      } else {
        setPipelines(pipelineList)
        
        // Select default pipeline if not selected
        if (!selectedPipelineId && pipelineList.length > 0) {
          const defaultPipeline = pipelineList.find((p: Pipeline) => p.is_default) || pipelineList[0]
          setSelectedPipelineId(defaultPipeline.id)
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch pipelines:', err)
      setLoading(false)
      setError(err.response?.data?.detail || 'Failed to load pipelines')
    } finally {
      setPipelinesLoading(false)
    }
  }, [selectedPipelineId])

  // Fetch pipeline view
  const fetchPipelineView = useCallback(async () => {
    if (!selectedPipelineId) return
    
    try {
      setLoading(true)
      setError(null)
      const response = await pipelinesAPI.getPipelineView(selectedPipelineId, viewType)
      setPipelineData(response.data)
    } catch (err: any) {
      // Fallback to legacy API
      try {
        const response = await dealsAPI.getPipeline(selectedPipelineId, viewType)
        // Transform legacy response
        const legacyData = response.data
        setPipelineData({
          pipeline_id: selectedPipelineId,
          pipeline_name: 'Sales Pipeline',
          stages: legacyData.stages.map((s: any) => ({
            ...s,
            probability: 0,
            color: '#3B82F6',
            weighted_value: 0
          })),
          total_deals: legacyData.total_deals,
          total_value: legacyData.total_value,
          weighted_value: 0,
          forecast_this_month: 0,
          forecast_this_quarter: 0
        })
      } catch (fallbackErr: any) {
        setError(fallbackErr.response?.data?.detail || 'Failed to load pipeline')
      }
    } finally {
      setLoading(false)
    }
  }, [selectedPipelineId, viewType])

  useEffect(() => {
    fetchPipelines()
  }, [fetchPipelines])

  useEffect(() => {
    if (selectedPipelineId) {
      fetchPipelineView()
    } else if (!pipelinesLoading && pipelines.length === 0) {
      // If pipelines are loaded and no pipelines exist, stop loading
      setLoading(false)
    }
  }, [selectedPipelineId, viewType, fetchPipelineView, pipelines.length, pipelinesLoading])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }

  const handleDragStart = (e: React.DragEvent, deal: Deal) => {
    setDraggedDeal(deal)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', deal.id)
  }

  const handleDragEnd = () => {
    setDraggedDeal(null)
    setDragOverStage(null)
  }

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverStage(stageId)
  }

  const handleDragLeave = () => {
    setDragOverStage(null)
  }

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault()
    setDragOverStage(null)

    if (!draggedDeal || !selectedPipelineId) {
      setDraggedDeal(null)
      return
    }

    // Check if already in target stage
    if (draggedDeal.stage_id === targetStageId || draggedDeal.status === targetStageId) {
      setDraggedDeal(null)
      return
    }

    try {
      setUpdatingDeal(draggedDeal.id)
      
      // Determine which API to use:
      // - If this is a deal (has deal_id, amount, revenue), use deal-based API
      // - If this is a lead (no deal amount, has contact info), use lead-based API
      // - If contact_id exists AND contact actually exists, use lead-based API
      const hasDealAmount = draggedDeal.amount || draggedDeal.revenue
      const hasContactInfo = draggedDeal.contact_email || draggedDeal.contact_phone || draggedDeal.contact_name
      
      // If it has deal amount/revenue, it's definitely a deal - use deal API
      if (hasDealAmount) {
        await dealsAPI.updateDealStage(draggedDeal.id, targetStageId, selectedPipelineId || undefined)
      } 
      // If it has contact_id and looks like a lead (no deal amount), try lead API
      else if (draggedDeal.contact_id && hasContactInfo) {
        try {
          await pipelinesAPI.updatePipelineLeadStage(selectedPipelineId, draggedDeal.contact_id, targetStageId)
        } catch (leadErr: any) {
          // If contact not found, fallback to deal API (maybe it's actually a deal)
          if (leadErr.response?.status === 404) {
            console.log('Lead-based API returned 404 (contact not found), trying deal-based API...')
            await dealsAPI.updateDealStage(draggedDeal.id, targetStageId, selectedPipelineId || undefined)
          } else {
            throw leadErr
          }
        }
      }
      // Default: try deal API first (most common case)
      else {
        await dealsAPI.updateDealStage(draggedDeal.id, targetStageId, selectedPipelineId || undefined)
      }
      
      // Optimistically update the UI
      if (pipelineData) {
        const newStages = pipelineData.stages.map(stage => {
          // Remove from old stage - check both by id and contact_id for lead-based pipelines
          const isInOldStage = stage.id === draggedDeal.stage_id || stage.id === draggedDeal.status
          const shouldRemove = isInOldStage && (
            stage.deals.some(d => 
              d.id === draggedDeal.id || 
              d.contact_id === draggedDeal.contact_id ||
              (draggedDeal.contact_id && d.id === draggedDeal.contact_id)
            )
          )
          
          if (shouldRemove) {
            return {
              ...stage,
              deals: stage.deals.filter(d => 
                d.id !== draggedDeal.id && 
                d.contact_id !== draggedDeal.contact_id &&
                !(draggedDeal.contact_id && d.id === draggedDeal.contact_id)
              ),
              count: Math.max(0, stage.count - 1),
              total_value: Math.max(0, stage.total_value - (draggedDeal.amount || draggedDeal.revenue || 0))
            }
          }
          // Add to new stage
          if (stage.id === targetStageId) {
            // Check if already in this stage to avoid duplicates
            const alreadyInStage = stage.deals.some(d => 
              d.id === draggedDeal.id || 
              d.contact_id === draggedDeal.contact_id ||
              (draggedDeal.contact_id && d.id === draggedDeal.contact_id)
            )
            if (!alreadyInStage) {
              const updatedDeal = { ...draggedDeal, status: targetStageId, stage_id: targetStageId }
              return {
                ...stage,
                deals: [updatedDeal, ...stage.deals],
                count: stage.count + 1,
                total_value: stage.total_value + (draggedDeal.amount || draggedDeal.revenue || 0)
              }
            }
          }
          return stage
        })
        setPipelineData({ ...pipelineData, stages: newStages })
      }
      
      // Refresh pipeline view to ensure data is in sync
      await fetchPipelineView()
    } catch (err: any) {
      console.error('Error updating stage:', err)
      console.error('Dragged deal:', draggedDeal)
      console.error('Target stage:', targetStageId)
      console.error('Pipeline ID:', selectedPipelineId)
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to update stage'
      setError(errorMessage)
      // Refresh to get correct state
      fetchPipelineView()
    } finally {
      setUpdatingDeal(null)
      setDraggedDeal(null)
    }
  }

  const getStageColor = (stage: PipelineStage) => {
    // Default colors if not provided
    const defaultColors: Record<string, string> = {
      lead: '#3B82F6',
      qualified: '#8B5CF6',
      demo: '#F59E0B',
      demo_meeting: '#F59E0B',
      proposal: '#F97316',
      proposal_sent: '#F97316',
      negotiation: '#EF4444',
      closed_won: '#22C55E',
      closed_lost: '#6B7280',
    }
    return stage.color || defaultColors[stage.id] || '#3B82F6'
  }

  if ((loading || pipelinesLoading) && !pipelineData && !error) {
    return (
      <div className="flex items-center justify-center h-96">
        <LoadingSpinner />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
        <button 
          onClick={fetchPipelineView}
          className="ml-4 text-red-800 underline hover:no-underline"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!pipelineData) return null

  return (
    <div className="space-y-4">
      {/* Pipeline Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Pipeline Selector */}
          <div className="relative">
            <button
              onClick={() => setShowPipelineSelector(!showPipelineSelector)}
              className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span className="font-semibold text-gray-900">{pipelineData.pipeline_name}</span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            
            {showPipelineSelector && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-white border rounded-lg shadow-lg z-10">
                {pipelines.map(pipeline => (
                  <button
                    key={pipeline.id}
                    onClick={() => {
                      setSelectedPipelineId(pipeline.id)
                      setShowPipelineSelector(false)
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${
                      selectedPipelineId === pipeline.id ? 'bg-blue-50 text-blue-700' : ''
                    }`}
                  >
                    <div>
                      <div className="font-medium">{pipeline.name}</div>
                      <div className="text-xs text-gray-500">{pipeline.deal_count} deals</div>
                    </div>
                    {pipeline.is_default && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Default</span>
                    )}
                  </button>
                ))}
                <div className="border-t">
                  <button
                    onClick={() => {
                      setEditingPipelineId(null)
                      setShowPipelineSelector(false)
                      setShowPipelineSettingsModal(true)
                    }}
                    className="w-full text-left px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-b-lg flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Create Pipeline
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingPipelineId(null)
                setShowPipelineSettingsModal(true)
              }}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New Pipeline
            </button>
            <button
              onClick={() => {
                setEditingPipelineId(selectedPipelineId)
                setShowPipelineSettingsModal(true)
              }}
              className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Settings className="h-4 w-4 text-gray-600" />
              Edit Pipeline
            </button>
          </div>

          {/* View Filter */}
          <div className="relative">
            <button
              onClick={() => setShowViewFilter(!showViewFilter)}
              className="flex items-center gap-2 px-3 py-2 bg-white border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {viewTypeOptions.find(v => v.value === viewType)?.label || 'All Deals'}
              </span>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>
            
            {showViewFilter && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border rounded-lg shadow-lg z-10">
                {viewTypeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setViewType(option.value)
                      setShowViewFilter(false)
                    }}
                    className={`w-full text-left px-4 py-2 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg flex items-center gap-2 ${
                      viewType === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                    }`}
                  >
                    {option.icon}
                    <span className="text-sm">{option.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowForecast(!showForecast)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-lg transition-colors ${
              showForecast ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            Forecast
          </button>
          <button
            onClick={fetchPipelineView}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Forecast Cards */}
      {showForecast && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Target className="h-4 w-4" />
              <span className="text-xs font-medium">Total Pipeline</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">{formatCurrency(pipelineData.total_value)}</div>
            <div className="text-xs text-gray-500">{pipelineData.total_deals} deals</div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Percent className="h-4 w-4" />
              <span className="text-xs font-medium">Weighted Value</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(pipelineData.weighted_value)}</div>
            <div className="text-xs text-gray-500">Based on probability</div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <CalendarDays className="h-4 w-4" />
              <span className="text-xs font-medium">This Month</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(pipelineData.forecast_this_month)}</div>
            <div className="text-xs text-gray-500">Expected to close</div>
          </div>
          
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center gap-2 text-gray-500 mb-1">
              <Calendar className="h-4 w-4" />
              <span className="text-xs font-medium">This Quarter</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(pipelineData.forecast_this_quarter)}</div>
            <div className="text-xs text-gray-500">Expected to close</div>
          </div>
        </div>
      )}

      {/* Pipeline Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {pipelineData.stages.map((stage) => {
          const stageColor = getStageColor(stage)
          const isDropTarget = dragOverStage === stage.id && draggedDeal?.status !== stage.id

          return (
            <div
              key={stage.id}
              className={`flex-shrink-0 w-72 rounded-lg border-2 bg-gray-50 transition-all ${
                isDropTarget ? 'border-blue-400 ring-2 ring-blue-200' : 'border-gray-200'
              }`}
              onDragOver={(e) => handleDragOver(e, stage.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage Header */}
              <div 
                className="text-white px-4 py-3 rounded-t-md"
                style={{ backgroundColor: stageColor }}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{stage.name}</h3>
                  <div className="flex items-center gap-2">
                    {stage.probability > 0 && (
                      <span className="bg-white/20 px-2 py-0.5 rounded text-xs">
                        {stage.probability}%
                      </span>
                    )}
                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm font-medium">
                      {stage.count}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-1 text-sm opacity-90">
                  <span>{formatCurrency(stage.total_value)}</span>
                  {stage.weighted_value > 0 && (
                    <span className="text-xs">≈ {formatCurrency(stage.weighted_value)}</span>
                  )}
                </div>
              </div>

              {/* Deal Cards */}
              <div className="p-2 space-y-2 min-h-[200px] max-h-[500px] overflow-y-auto">
                {stage.deals.length === 0 ? (
                  <div className="text-center py-8 text-gray-400">
                    <p className="text-sm">No deals</p>
                    <p className="text-xs">Drag deals here</p>
                  </div>
                ) : (
                  stage.deals.map((deal) => (
                    <div
                      key={deal.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, deal)}
                      onDragEnd={handleDragEnd}
                      className={`bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md transition-all ${
                        draggedDeal?.id === deal.id ? 'opacity-50 scale-95' : ''
                      } ${updatingDeal === deal.id ? 'opacity-70 pointer-events-none' : ''}`}
                    >
                      {/* Drag Handle & Content */}
                      <div className="flex items-start gap-2">
                        <GripVertical className="h-4 w-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          {/* Deal Name & Priority */}
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-medium text-gray-900 truncate">
                              {deal.name}
                            </h4>
                            {deal.is_stalled && (
                              <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
                            )}
                          </div>
                          
                          {/* Deal Value & Probability */}
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-green-600" />
                              <span className="text-sm font-semibold text-green-600">
                                {formatCurrency(deal.amount || deal.revenue)}
                              </span>
                            </div>
                            {deal.probability !== undefined && deal.probability > 0 && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                                {deal.probability}%
                              </span>
                            )}
                          </div>

                          {/* Priority Badge */}
                          {deal.priority && deal.priority !== 'medium' && (
                            <div className="mt-1">
                              <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColors[deal.priority]}`}>
                                {deal.priority.charAt(0).toUpperCase() + deal.priority.slice(1)}
                              </span>
                            </div>
                          )}

                          {/* Expected Close Date */}
                          {deal.expected_close_date && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <Calendar className="h-3 w-3" />
                              <span>Close: {formatDate(deal.expected_close_date)}</span>
                            </div>
                          )}

                          {/* Contact Info */}
                          {deal.contact_name && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                              <User className="h-3 w-3" />
                              <span className="truncate">{deal.contact_name}</span>
                            </div>
                          )}

                          {/* Next Step */}
                          {deal.next_step && (
                            <div className="mt-2 text-xs text-gray-600 bg-gray-50 p-2 rounded">
                              <strong>Next:</strong> {deal.next_step}
                            </div>
                          )}

                          {/* Days in Stage */}
                          {deal.days_in_stage !== undefined && deal.days_in_stage > 0 && (
                            <div className="flex items-center gap-1 mt-2 text-xs text-gray-400">
                              <Clock className="h-3 w-3" />
                              <span>{deal.days_in_stage} days in stage</span>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100">
                            {onViewDeal && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onViewDeal(deal)
                                }}
                                className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                title="View"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {onEditDeal && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEditDeal(deal)
                                }}
                                className="p-1 text-amber-600 hover:bg-amber-50 rounded"
                                title="Edit"
                              >
                                <Edit className="h-3.5 w-3.5" />
                              </button>
                            )}
                            {onDeleteDeal && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  if (window.confirm('Delete this deal?')) {
                                    onDeleteDeal(deal.id)
                                  }
                                }}
                                className="p-1 text-red-600 hover:bg-red-50 rounded"
                                title="Delete"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Loading overlay */}
                      {updatingDeal === deal.id && (
                        <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
                          <LoadingSpinner />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-2 border-t">
        <div className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          <span>Stalled (no activity 14+ days)</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">%</span>
          <span>Win probability</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-gray-400">≈</span>
          <span>Weighted value (amount × probability)</span>
        </div>
      </div>

      {/* Pipeline Settings Modal */}
      {showPipelineSettingsModal && (
        <PipelineSettings
          isOpen={showPipelineSettingsModal}
          onClose={() => {
            setShowPipelineSettingsModal(false)
            setEditingPipelineId(null)
          }}
          pipelineId={editingPipelineId || undefined}
          onSaved={(newPipelineId) => {
            fetchPipelines()
            if (newPipelineId) {
              setSelectedPipelineId(newPipelineId)
            }
          }}
        />
      )}
    </div>
  )
}
