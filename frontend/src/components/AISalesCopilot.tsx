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
  Sparkles,
  ArrowRight,
  Copy,
  Check,
  Calendar,
  Bell,
  FileText,
  Zap,
  BarChart3,
  Bookmark,
  Send
} from 'lucide-react'
import { inboxAPI } from '../lib/api'
import { toast } from 'react-hot-toast'

interface AISalesCopilotProps {
  campaignId: string
  telegramUsername: string
  onUseSuggestion?: (suggestion: string) => void
  conversationHistory?: Array<{
    id: string
    type: 'incoming' | 'outgoing'
    content: string
    created_at: string
  }>
}

interface AIInsights {
  customer_needs?: string[]
  buying_intent?: 'high' | 'medium' | 'low'
  interest_level?: 'very_high' | 'high' | 'medium' | 'low' | 'very_low'
  pain_points?: string[]
  sentiment?: 'positive' | 'neutral' | 'negative'
  funnel_stage?: 'lead' | 'qualified' | 'negotiation' | 'close'
  key_topics?: string[]
  objections?: string[]
  recommended_actions?: Array<{
    action: string
    priority: 'high' | 'medium' | 'low'
    reason: string
  }>
  suggested_responses?: Array<{
    situation: string
    response: string
    tone: string
  }>
  next_best_questions?: string[]
  product_recommendations?: Array<{
    product: string
    reason: string
    fit_score: 'high' | 'medium' | 'low'
  }>
  summary?: string
}

const AISalesCopilot: React.FC<AISalesCopilotProps> = ({
  campaignId,
  telegramUsername,
  onUseSuggestion,
  conversationHistory = []
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const [situation, setSituation] = useState('Continue the conversation naturally')
  const [isBookmarked, setIsBookmarked] = useState(false)
  const [followUpQuestion, setFollowUpQuestion] = useState('')
  const [followUpAnswer, setFollowUpAnswer] = useState<any>(null)

  // Fetch AI insights
  const {
    data: insights,
    isLoading: insightsLoading,
    refetch: refetchInsights,
    error: insightsError
  } = useQuery<{ data: AIInsights }>({
    queryKey: ['ai-insights', campaignId, telegramUsername],
    queryFn: () => inboxAPI.analyzeConversation(campaignId, telegramUsername),
    enabled: !!campaignId && !!telegramUsername,
    retry: 1
  })

  // Suggest response mutation
  const suggestResponseMutation = useMutation({
    mutationFn: (data: { campaign_id: string; telegram_username: string; situation?: string }) =>
      inboxAPI.suggestResponse(data),
    onSuccess: () => {
      toast.success('Response suggestion generated!')
    },
    onError: () => {
      toast.error('Failed to generate suggestion')
    }
  })

  // Follow-up question mutation
  const followUpMutation = useMutation({
    mutationFn: (data: { question: string; previous_analysis?: any }) =>
      inboxAPI.analyzeFollowup(campaignId, telegramUsername, data),
    onSuccess: (data) => {
      setFollowUpAnswer(data.data || data)
      toast.success('Follow-up analysis completed!')
    },
    onError: () => {
      toast.error('Failed to analyze follow-up question')
    }
  })

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    toast.success('Copied to clipboard!')
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const handleUseSuggestion = (suggestion: string) => {
    if (onUseSuggestion) {
      onUseSuggestion(suggestion)
    }
  }

  const handleSuggestResponse = () => {
    suggestResponseMutation.mutate({
      campaign_id: campaignId,
      telegram_username: telegramUsername,
      situation
    })
  }

  const getIntentColor = (intent?: string) => {
    switch (intent) {
      case 'high':
      case 'very_high':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'medium':
        return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'low':
      case 'very_low':
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

  const aiData = insights?.data

  if (insightsLoading) {
    return (
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
          <span className="ml-3 text-gray-600">Analyzing conversation...</span>
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
          <p className="text-gray-600 text-sm mb-4">Unable to analyze conversation at this time.</p>
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
              <h3 className="text-lg font-semibold text-gray-900">AI Sales Copilot</h3>
              <p className="text-xs text-gray-600">Intelligent analysis</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsBookmarked(!isBookmarked)}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked ? 'bg-amber-100 text-amber-600' : 'hover:bg-gray-100 text-gray-600'
              }`}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark conversation'}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={() => refetchInsights()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Refresh analysis"
            >
              <RefreshCw className="h-4 w-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Summary */}
        {aiData.summary && (
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-100/50">
            <p className="text-xs text-gray-700 leading-relaxed">{aiData.summary}</p>
          </div>
        )}
      </div>

      {/* Conversation Statistics */}
      {conversationHistory.length > 0 && (() => {
        const incomingCount = conversationHistory.filter(m => m.type === 'incoming').length
        const outgoingCount = conversationHistory.filter(m => m.type === 'outgoing').length
        return (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-5">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-gray-500" />
              Conversation Stats
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Total Messages</div>
                <div className="text-lg font-semibold text-gray-900">{conversationHistory.length}</div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <div className="text-xs text-gray-500 mb-1">Messages</div>
                <div className="text-lg font-semibold text-gray-900">
                  {conversationHistory.length} total
                </div>
              </div>
              <div className="bg-green-50 rounded-xl p-3">
                <div className="text-xs text-green-600 mb-1">Incoming</div>
                <div className="text-lg font-semibold text-green-700">{incomingCount}</div>
              </div>
              <div className="bg-blue-50 rounded-xl p-3">
                <div className="text-xs text-blue-600 mb-1">Outgoing</div>
                <div className="text-lg font-semibold text-blue-700">{outgoingCount}</div>
              </div>
            </div>
          </div>
        )
      })()}

      {/* Quick Actions */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-5">
        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="h-4 w-4 text-gray-500" />
          Quick Actions
        </h4>
        <div className="space-y-2">
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm text-gray-700">
            <Calendar className="h-4 w-4" />
            Schedule Follow-up
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm text-gray-700">
            <FileText className="h-4 w-4" />
            Add Note
          </button>
          <button className="w-full flex items-center gap-2 px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors text-sm text-gray-700">
            <Bell className="h-4 w-4" />
            Set Reminder
          </button>
        </div>
      </div>

      {/* Alerts & Notifications */}
      {aiData.objections && aiData.objections.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-amber-200/50 p-5">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            Objections Detected
          </h4>
          <div className="space-y-2">
            {aiData.objections.map((objection, index) => (
              <div key={index} className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100">
                <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-gray-700 flex-1">{objection}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Buying Intent */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Target className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Buying Intent</span>
          </div>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-semibold ${getIntentColor(aiData.buying_intent)}`}>
            {aiData.buying_intent || 'Unknown'}
          </div>
        </div>

        {/* Interest Level */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Interest Level</span>
          </div>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-semibold ${getIntentColor(aiData.interest_level)}`}>
            {aiData.interest_level?.replace('_', ' ') || 'Unknown'}
          </div>
        </div>

        {/* Sentiment */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-5">
          <div className="flex items-center gap-2 mb-3">
            <MessageSquare className="h-4 w-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Sentiment</span>
          </div>
          <div className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-semibold ${getSentimentColor(aiData.sentiment)}`}>
            {aiData.sentiment || 'Unknown'}
          </div>
        </div>
      </div>

      {/* Customer Needs */}
      {aiData.customer_needs && aiData.customer_needs.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Customer Needs
          </h4>
          <div className="space-y-2">
            {aiData.customer_needs.map((need, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-1.5 h-1.5 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 flex-1">{need}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pain Points */}
      {aiData.pain_points && aiData.pain_points.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            Pain Points
          </h4>
          <div className="space-y-2">
            {aiData.pain_points.map((pain, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-amber-50 rounded-xl border border-amber-100">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 flex-1">{pain}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Actions */}
      {aiData.recommended_actions && aiData.recommended_actions.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-blue-600" />
            Recommended Actions
          </h4>
          <div className="space-y-3">
            {aiData.recommended_actions.map((action, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-sm font-medium text-gray-900 flex-1">{action.action}</p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    action.priority === 'high' ? 'bg-red-100 text-red-700' :
                    action.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {action.priority}
                  </span>
                </div>
                <p className="text-xs text-gray-600">{action.reason}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggested Responses */}
      {aiData.suggested_responses && aiData.suggested_responses.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Suggested Responses
          </h4>
          <div className="space-y-3">
            {aiData.suggested_responses.map((suggestion, index) => (
              <div key={index} className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100/50">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{suggestion.situation}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700 font-medium">
                    {suggestion.tone}
                  </span>
                </div>
                <p className="text-sm text-gray-700 mb-3 leading-relaxed">{suggestion.response}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(suggestion.response, index)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleUseSuggestion(suggestion.response)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
                  >
                    Use
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Best Questions */}
      {aiData.next_best_questions && aiData.next_best_questions.length > 0 && (
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-indigo-600" />
            Next Best Questions
          </h4>
          <div className="space-y-2">
            {aiData.next_best_questions.map((question, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-2 flex-shrink-0" />
                <p className="text-sm text-gray-700 flex-1">{question}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Response Suggestion */}
      <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-200/50 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-amber-600" />
          Generate Custom Response
        </h4>
        <div className="space-y-3">
          <input
            type="text"
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="Describe the situation (e.g., 'Customer asked about pricing')"
            className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleSuggestResponse}
            disabled={suggestResponseMutation.isPending || !situation.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium text-sm"
          >
            {suggestResponseMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Generate Response
              </>
            )}
          </button>
          {suggestResponseMutation.data?.data?.suggested_response && (
            <div className="p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-100/50">
              <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                {suggestResponseMutation.data.data.suggested_response}
              </p>
              <button
                onClick={() => handleUseSuggestion(suggestResponseMutation.data.data.suggested_response)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-purple-600 text-white hover:bg-purple-700 rounded-lg transition-colors"
              >
                Use This Response
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

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
            placeholder="Ask a follow-up question about this conversation..."
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

export default AISalesCopilot
