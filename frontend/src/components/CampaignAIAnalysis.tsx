import React, { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Brain,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  MessageSquare,
  Target,
  Loader2,
  RefreshCw,
  BarChart3,
  Activity,
  TrendingDown,
  Send,
  Zap
} from 'lucide-react'
import { inboxAPI } from '../lib/api'
import { toast } from 'react-hot-toast'

interface CampaignAIAnalysisProps {
  campaignId: string
}

interface CampaignInsights {
  campaign_summary?: string
  total_conversations?: number
  total_messages?: number
  engagement_rate?: 'high' | 'medium' | 'low'
  response_rate?: 'high' | 'medium' | 'low'
  overall_sentiment?: 'positive' | 'neutral' | 'negative'
  common_customer_needs?: string[]
  common_pain_points?: string[]
  common_objections?: string[]
  key_topics_discussed?: string[]
  funnel_distribution?: {
    lead?: string
    qualified?: string
    negotiation?: string
    close?: string
  }
  buying_intent_distribution?: {
    high?: string
    medium?: string
    low?: string
  }
  campaign_strengths?: string[]
  campaign_weaknesses?: string[]
  recommended_improvements?: Array<{
    improvement: string
    priority: 'high' | 'medium' | 'low'
    reason: string
  }>
  top_performing_aspects?: string[]
  areas_for_optimization?: string[]
  call_script_effectiveness?: 'effective' | 'moderate' | 'needs_improvement'
  call_script_feedback?: string
  next_steps_recommendations?: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    reason: string
  }>
}

const CampaignAIAnalysis: React.FC<CampaignAIAnalysisProps> = ({
  campaignId
}) => {
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const [followUpAnswer, setFollowUpAnswer] = useState<any>(null)

  // Fetch campaign insights
  const {
    data: insights,
    isLoading: insightsLoading,
    refetch: refetchInsights,
    error: insightsError
  } = useQuery<{ data: CampaignInsights }>({
    queryKey: ['campaign-ai-insights', campaignId],
    queryFn: () => inboxAPI.analyzeCampaign(campaignId),
    enabled: !!campaignId,
    retry: 1
  })

  // Follow-up question mutation for campaign analysis
  const followUpMutation = useMutation({
    mutationFn: (data: { question: string; previous_analysis?: any }) =>
      inboxAPI.analyzeCampaignFollowup(campaignId, data),
    onSuccess: (data) => {
      setFollowUpAnswer(data.data || data)
      toast.success('Follow-up analysis completed!')
    },
    onError: () => {
      toast.error('Failed to analyze follow-up question')
    }
  })

  const getRateColor = (rate?: string) => {
    switch (rate) {
      case 'high':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'neutral':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      case 'negative':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getEffectivenessColor = (effectiveness?: string) => {
    switch (effectiveness) {
      case 'effective':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'moderate':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'needs_improvement':
        return 'text-red-600 bg-red-50 border-red-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const aiData = insights?.data

  if (insightsLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Analyzing campaign...</span>
        </div>
      </div>
    )
  }

  if (insightsError) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Analysis Failed</h3>
          <p className="text-gray-600 text-sm mb-4">Unable to analyze campaign at this time.</p>
          <button
            onClick={() => refetchInsights()}
            className="inline-flex items-center px-4 py-2 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-all duration-200 text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </button>
        </div>
      </div>
    )
  }

  if (!aiData) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Campaign Analysis</h3>
              <p className="text-xs text-gray-600">Macro-level insights</p>
            </div>
          </div>
          <button
            onClick={() => refetchInsights()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Refresh analysis"
          >
            <RefreshCw className="h-4 w-4 text-gray-600" />
          </button>
        </div>

        {/* Summary */}
        {aiData.campaign_summary && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-100/50">
            <p className="text-xs text-gray-700 leading-relaxed">{aiData.campaign_summary}</p>
          </div>
        )}
      </div>

      {/* Campaign Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Conversations</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{aiData.total_conversations || 0}</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Activity className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Messages</span>
          </div>
          <div className="text-2xl font-semibold text-gray-900">{aiData.total_messages || 0}</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Engagement Rate</span>
          </div>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-semibold ${getRateColor(aiData.engagement_rate)}`}>
            {aiData.engagement_rate || 'Unknown'}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Response Rate */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Response Rate</span>
          </div>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-semibold ${getRateColor(aiData.response_rate)}`}>
            {aiData.response_rate || 'Unknown'}
          </div>
        </div>

        {/* Overall Sentiment */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Overall Sentiment</span>
          </div>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-semibold ${getSentimentColor(aiData.overall_sentiment)}`}>
            {aiData.overall_sentiment || 'Unknown'}
          </div>
        </div>
      </div>

      {/* Common Customer Needs */}
      {aiData.common_customer_needs && aiData.common_customer_needs.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Common Customer Needs
          </h4>
          <div className="space-y-2">
            {aiData.common_customer_needs.map((need, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 flex-1">{need}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Pain Points */}
      {aiData.common_pain_points && aiData.common_pain_points.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Common Pain Points
          </h4>
          <div className="space-y-2">
            {aiData.common_pain_points.map((pain, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 flex-1">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Common Objections */}
      {aiData.common_objections && aiData.common_objections.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-amber-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Common Objections
          </h4>
          <div className="space-y-2">
            {aiData.common_objections.map((objection, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 flex-1">{objection}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Topics Discussed */}
      {aiData.key_topics_discussed && aiData.key_topics_discussed.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            Key Topics Discussed
          </h4>
          <div className="flex flex-wrap gap-2">
            {aiData.key_topics_discussed.map((topic, index) => (
              <span key={index} className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg border border-blue-100 text-sm font-medium">
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Funnel Distribution */}
      {aiData.funnel_distribution && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Funnel Distribution
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {aiData.funnel_distribution.lead && (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="text-xs text-gray-500 mb-1">Lead</div>
                <div className="text-lg font-semibold text-gray-900">{aiData.funnel_distribution.lead}</div>
              </div>
            )}
            {aiData.funnel_distribution.qualified && (
              <div className="bg-blue-50 rounded-xl p-3 border border-blue-100">
                <div className="text-xs text-blue-600 mb-1">Qualified</div>
                <div className="text-lg font-semibold text-blue-700">{aiData.funnel_distribution.qualified}</div>
              </div>
            )}
            {aiData.funnel_distribution.negotiation && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <div className="text-xs text-amber-600 mb-1">Negotiation</div>
                <div className="text-lg font-semibold text-amber-700">{aiData.funnel_distribution.negotiation}</div>
              </div>
            )}
            {aiData.funnel_distribution.close && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <div className="text-xs text-green-600 mb-1">Close</div>
                <div className="text-lg font-semibold text-green-700">{aiData.funnel_distribution.close}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Buying Intent Distribution */}
      {aiData.buying_intent_distribution && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Buying Intent Distribution
          </h4>
          <div className="grid grid-cols-3 gap-3">
            {aiData.buying_intent_distribution.high && (
              <div className="bg-green-50 rounded-xl p-3 border border-green-100">
                <div className="text-xs text-green-600 mb-1">High</div>
                <div className="text-lg font-semibold text-green-700">{aiData.buying_intent_distribution.high}</div>
              </div>
            )}
            {aiData.buying_intent_distribution.medium && (
              <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                <div className="text-xs text-amber-600 mb-1">Medium</div>
                <div className="text-lg font-semibold text-amber-700">{aiData.buying_intent_distribution.medium}</div>
              </div>
            )}
            {aiData.buying_intent_distribution.low && (
              <div className="bg-red-50 rounded-xl p-3 border border-red-100">
                <div className="text-xs text-red-600 mb-1">Low</div>
                <div className="text-lg font-semibold text-red-700">{aiData.buying_intent_distribution.low}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Performing Aspects */}
      {aiData.top_performing_aspects && aiData.top_performing_aspects.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-green-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Top Performing Aspects
          </h4>
          <div className="space-y-2">
            {aiData.top_performing_aspects.map((aspect, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <CheckCircle className="h-3.5 w-3.5 text-green-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-gray-700 flex-1">{aspect}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Areas for Optimization */}
      {aiData.areas_for_optimization && aiData.areas_for_optimization.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-amber-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-600" />
            Areas for Optimization
          </h4>
          <div className="space-y-2">
            {aiData.areas_for_optimization.map((area, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 flex-1">{area}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Strengths */}
      {aiData.campaign_strengths && aiData.campaign_strengths.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-green-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Campaign Strengths
          </h4>
          <div className="space-y-2">
            {aiData.campaign_strengths.map((strength, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 flex-1">{strength}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Campaign Weaknesses */}
      {aiData.campaign_weaknesses && aiData.campaign_weaknesses.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-amber-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-amber-600" />
            Areas for Improvement
          </h4>
          <div className="space-y-2">
            {aiData.campaign_weaknesses.map((weakness, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 flex-1">{weakness}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Improvements */}
      {aiData.recommended_improvements && aiData.recommended_improvements.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            Recommended Improvements
          </h4>
          <div className="space-y-3">
            {aiData.recommended_improvements.map((improvement, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-gray-900 flex-1">{improvement.improvement}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    improvement.priority === 'high' ? 'bg-red-100 text-red-700' :
                    improvement.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {improvement.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{improvement.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Call Script Effectiveness */}
      {aiData.call_script_effectiveness && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="h-5 w-5 text-purple-600" />
            Call Script Effectiveness
          </h4>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-semibold mb-3 ${getEffectivenessColor(aiData.call_script_effectiveness)}`}>
            {aiData.call_script_effectiveness.replace('_', ' ')}
          </div>
          {aiData.call_script_feedback && (
            <p className="text-sm text-gray-700 leading-relaxed">{aiData.call_script_feedback}</p>
          )}
        </div>
      )}

      {/* Next Steps Recommendations */}
      {aiData.next_steps_recommendations && aiData.next_steps_recommendations.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-indigo-600" />
            Next Steps Recommendations
          </h4>
          <div className="space-y-3">
            {aiData.next_steps_recommendations.map((rec, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-gray-900 flex-1">{rec.action}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                    rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {rec.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{rec.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up Questions Section */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-indigo-600" />
          Ask Follow-up Question
        </h4>
        <div className="space-y-3">
          <textarea
            value={followUpQuestion}
            onChange={(e) => setFollowUpQuestion(e.target.value)}
            placeholder="Ask a follow-up question about this campaign..."
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm min-h-[100px] resize-none"
            rows={3}
          />
          <button
            onClick={() => {
              if (followUpQuestion.trim()) {
                followUpMutation.mutate({
                  question: followUpQuestion,
                  previous_analysis: insights?.data
                })
              }
            }}
            disabled={followUpMutation.isPending || !followUpQuestion.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {followUpMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Ask Question
              </>
            )}
          </button>
          
          {followUpAnswer && (
            <div className="mt-4 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100/50">
              <h5 className="text-sm font-semibold text-gray-900 mb-2">Answer:</h5>
              <p className="text-sm text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap">
                {followUpAnswer.answer || followUpAnswer.summary || JSON.stringify(followUpAnswer, null, 2)}
              </p>
              
              {followUpAnswer.key_insights && followUpAnswer.key_insights.length > 0 && (
                <div className="mt-3">
                  <h6 className="text-xs font-semibold text-gray-700 mb-2">Key Insights:</h6>
                  <ul className="space-y-1">
                    {followUpAnswer.key_insights.map((insight: string, index: number) => (
                      <li key={index} className="text-xs text-gray-600 flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" />
                        <span>{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {followUpAnswer.recommendations && followUpAnswer.recommendations.length > 0 && (
                <div className="mt-3">
                  <h6 className="text-xs font-semibold text-gray-700 mb-2">Recommendations:</h6>
                  <div className="space-y-2">
                    {followUpAnswer.recommendations.map((rec: any, index: number) => (
                      <div key={index} className="p-2 bg-white/60 rounded-lg">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-medium text-gray-900 flex-1">{rec.action}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                            rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {rec.priority}
                          </span>
                        </div>
                        {rec.reason && (
                          <p className="text-xs text-gray-600">{rec.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <button
                onClick={() => {
                  setFollowUpQuestion('')
                  setFollowUpAnswer(null)
                }}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Ask Another Question
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CampaignAIAnalysis
