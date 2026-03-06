/**
 * EnablementFeedbackSidebar Component
 * 
 * Displays cross-meeting, longitudinal feedback for skill improvement.
 * Shows observations, risk signals, and improvement suggestions based on
 * patterns detected across multiple calls.
 */

import { useState, useEffect } from 'react'
import {
  AlertTriangle,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Minus,
  Lightbulb,
  Eye,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  Loader2,
} from 'lucide-react'
import { enablementAPI, EnablementFeedbackResponse, EnablementFeedbackCard } from '../../lib/api'
import { toast } from 'react-hot-toast'

interface EnablementFeedbackSidebarProps {
  userId: string
  className?: string
}

export default function EnablementFeedbackSidebar({ userId, className = '' }: EnablementFeedbackSidebarProps) {
  const [feedback, setFeedback] = useState<EnablementFeedbackResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({})
  const [refreshing, setRefreshing] = useState(false)

  const loadFeedback = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)
      const response = await enablementAPI.getFeedback({
        days: 30,
        min_calls: 5,
        force_refresh: forceRefresh,
      })
      setFeedback(response.data)
    } catch (err: any) {
      console.error('Error loading enablement feedback:', err)
      setError(err.response?.data?.detail || 'Failed to load feedback')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeedback()
  }, [userId])

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await loadFeedback(true)
      toast.success('Feedback refreshed successfully')
    } catch (err) {
      toast.error('Failed to refresh feedback')
    } finally {
      setRefreshing(false)
    }
  }

  const toggleCard = (cardId: string) => {
    setExpandedCards((prev) => ({
      ...prev,
      [cardId]: !prev[cardId],
    }))
  }

  const getTypeIcon = (type: EnablementFeedbackCard['type']) => {
    switch (type) {
      case 'observation':
        return <Eye className="h-4 w-4" />
      case 'risk_signal':
        return <AlertTriangle className="h-4 w-4" />
      case 'improvement':
        return <Lightbulb className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: EnablementFeedbackCard['type']) => {
    switch (type) {
      case 'observation':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'risk_signal':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'improvement':
        return 'text-amber-600 bg-amber-50 border-amber-200'
    }
  }

  const getTrendIcon = (trend?: 'improving' | 'stable' | 'declining' | null) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      case 'stable':
        return <Minus className="h-4 w-4 text-gray-600" />
      default:
        return null
    }
  }

  const renderFeedbackCard = (card: EnablementFeedbackCard) => {
    const isExpanded = expandedCards[card.id]
    const typeColor = getTypeColor(card.type)

    return (
      <div key={card.id} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <button
          onClick={() => toggleCard(card.id)}
          className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
        >
          <div className={`p-1.5 rounded-lg ${typeColor} shrink-0 mt-0.5`}>
            {getTypeIcon(card.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="text-sm font-medium text-gray-900">{card.title}</h4>
              <span className="text-xs text-gray-500 px-2 py-0.5 rounded-full bg-gray-100">
                {Math.round(card.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-600 line-clamp-2">{card.description}</p>
          </div>
          <div className="shrink-0 ml-2">
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-gray-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-gray-400" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="border-t border-gray-100 bg-gray-50/50 px-4 py-3 space-y-3">
            {/* Evidence */}
            <div>
              <p className="text-xs font-medium text-gray-700 mb-1.5">Evidence</p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white rounded px-2 py-1.5 border border-gray-200">
                  <span className="text-gray-600">Calls analyzed:</span>{' '}
                  <span className="font-medium text-gray-900">{card.evidence.calls_analyzed}</span>
                </div>
                {card.evidence.calls_above_threshold !== undefined && (
                  <div className="bg-white rounded px-2 py-1.5 border border-gray-200">
                    <span className="text-gray-600">Pattern in:</span>{' '}
                    <span className="font-medium text-gray-900">
                      {card.evidence.calls_above_threshold} calls
                    </span>
                  </div>
                )}
                {card.evidence.metric_average !== undefined && (
                  <div className="bg-white rounded px-2 py-1.5 border border-gray-200">
                    <span className="text-gray-600">Average:</span>{' '}
                    <span className="font-medium text-gray-900">
                      {typeof card.evidence.metric_average === 'number'
                        ? card.evidence.metric_average.toFixed(2)
                        : card.evidence.metric_average}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Suggestions */}
            {card.suggestions.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-amber-500" />
                  Suggestions
                </p>
                <ul className="space-y-1.5">
                  {card.suggestions.map((suggestion, idx) => (
                    <li
                      key={idx}
                      className="text-xs text-gray-700 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-amber-500"
                    >
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 ${className}`}>
        <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
        <p className="text-sm text-gray-500">Loading feedback...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 ${className}`}>
        <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
        <p className="text-sm text-red-600 mb-2">{error}</p>
        <button
          onClick={() => loadFeedback()}
          className="text-xs text-blue-600 hover:text-blue-700 underline"
        >
          Try again
        </button>
      </div>
    )
  }

  if (!feedback || feedback.total_calls_analyzed === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-64 p-6 ${className}`}>
        <Info className="h-8 w-8 text-gray-400 mb-2" />
        <p className="text-sm text-gray-600 text-center mb-1">Not enough data yet</p>
        <p className="text-xs text-gray-500 text-center max-w-sm">
          Complete at least 5 calls to receive personalized coaching insights
        </p>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Coaching Insights
          </h3>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-50"
            title="Refresh feedback"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
        <div className="flex items-center gap-3 text-xs text-gray-600">
          <span>{feedback.total_calls_analyzed} calls analyzed</span>
          <span>•</span>
          <span>Last {feedback.analysis_window_days} days</span>
        </div>
      </div>

      {/* Overall Summary */}
      {(feedback.overall_quality_trend || feedback.top_strength || feedback.top_opportunity) && (
        <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
          {feedback.overall_quality_trend && (
            <div className="flex items-center gap-2 mb-2">
              {getTrendIcon(feedback.overall_quality_trend)}
              <span className="text-xs font-medium text-gray-700">
                Performance is{' '}
                <span className="capitalize">{feedback.overall_quality_trend}</span>
              </span>
            </div>
          )}
          {feedback.top_strength && (
            <p className="text-xs text-gray-700 mb-1">
              <span className="font-medium text-green-700">💪 Strength:</span> {feedback.top_strength}
            </p>
          )}
          {feedback.top_opportunity && (
            <p className="text-xs text-gray-700">
              <span className="font-medium text-amber-700">🎯 Opportunity:</span>{' '}
              {feedback.top_opportunity}
            </p>
          )}
        </div>
      )}

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Risk Signals */}
        {feedback.risk_signals.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5 text-red-600" />
              Risk Signals
            </h4>
            <div className="space-y-2">
              {feedback.risk_signals.map((card) => renderFeedbackCard(card))}
            </div>
          </div>
        )}

        {/* Improvement Opportunities */}
        {feedback.improvements.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Lightbulb className="h-3.5 w-3.5 text-amber-600" />
              Improvement Opportunities
            </h4>
            <div className="space-y-2">
              {feedback.improvements.map((card) => renderFeedbackCard(card))}
            </div>
          </div>
        )}

        {/* Observations */}
        {feedback.observations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-blue-600" />
              Observations
            </h4>
            <div className="space-y-2">
              {feedback.observations.map((card) => renderFeedbackCard(card))}
            </div>
          </div>
        )}

        {/* Empty state if no feedback cards */}
        {feedback.risk_signals.length === 0 &&
          feedback.improvements.length === 0 &&
          feedback.observations.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12">
              <Sparkles className="h-8 w-8 text-gray-300 mb-2" />
              <p className="text-sm text-gray-600 text-center">No patterns detected yet</p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Keep doing great work! We'll surface insights as patterns emerge.
              </p>
            </div>
          )}
      </div>
    </div>
  )
}
