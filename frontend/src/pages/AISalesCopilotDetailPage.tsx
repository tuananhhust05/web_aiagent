import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, User, Check, ChevronRight, ThumbsUp, ThumbsDown, BarChart3, FileText, ExternalLink } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { prioritizedProspectsAPI } from '../lib/api'
import AIActionCard from '../components/AIActionCard'
import LoadingSpinner from '../components/ui/LoadingSpinner'

interface AITip {
  title: string
  content: string
  category?: string
}

interface UsedRule {
  content: string
  doc_id: string
  chunk_index: number
  similarity_score?: number
  document?: {
    id: string
    filename: string
    original_filename: string
    file_path?: string
    file_size?: number
    user_id?: string
    status?: string
    total_chunks?: number
    error_message?: string | null
    uploaded_at?: string
    processed_at?: string | null
  }
}

interface PrioritizedProspect {
  id: string
  prospect_id: string
  prospect_name: string
  what: string
  when: string
  channel: 'Gmail' | 'Telegram' | 'AI Call' | 'Linkedin' | 'Whatsapp'
  priority?: number
  confidence?: number
  reasoning?: string
  generated_content?: string
  ai_tips?: AITip[]
  contact_data?: any
  campaign_data?: any[]
  deal_data?: any[]
  rules_used?: UsedRule[]
}

export default function AISalesCopilotDetailPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { actionId } = useParams<{ prospectId: string; actionId: string }>()
  const [coachChoice, setCoachChoice] = useState<'yes' | 'later' | null>(null)

  // Fetch prioritized prospect detail
  const { data: prospectDetail, isLoading: prospectLoading } = useQuery({
    queryKey: ['prioritized-prospect-detail', actionId],
    queryFn: () => prioritizedProspectsAPI.getPrioritizedProspect(actionId!),
    enabled: !!actionId,
  })

  // Also fetch all prospects to find matching one
  const { data: prospectsResponse } = useQuery({
    queryKey: ['prioritized-prospects'],
    queryFn: () => prioritizedProspectsAPI.getPrioritizedProspects({ page: 1, limit: 100 }),
  })

  const prioritizedProspects: PrioritizedProspect[] = prospectsResponse?.data?.prospects || []
  const selectedProspect = prospectDetail?.data || prioritizedProspects.find((p: any) => p.id === actionId) || null

  // Convert prioritized prospect to action format for AIActionCard
  const selectedAction = useMemo(() => {
    if (!selectedProspect) return null
    
    // Map channel names
    const channelMap: Record<string, 'email' | 'whatsapp' | 'linkedin' | 'call' | 'video_call'> = {
      'Gmail': 'email',
      'Linkedin': 'linkedin',
      'Whatsapp': 'whatsapp',
      'Telegram': 'whatsapp', // Telegram uses similar format to WhatsApp
      'AI Call': 'call'
    }
    
    const priority: 'high' | 'medium' | 'low' = selectedProspect.priority 
      ? (selectedProspect.priority >= 8 ? 'high' : selectedProspect.priority >= 5 ? 'medium' : 'low')
      : 'medium'
    
    return {
      id: selectedProspect.id,
      what: selectedProspect.what,
      when: selectedProspect.when,
      channel: channelMap[selectedProspect.channel] || 'email',
      priority,
      reason: selectedProspect.reasoning || '',
      message: selectedProspect.generated_content || undefined, // Pass generated content as message
      call_script: selectedProspect.channel === 'AI Call' ? selectedProspect.generated_content : undefined,
      confidence: selectedProspect.confidence // Pass confidence score
    }
  }, [selectedProspect])

  const getUserAvatar = () => {
    if (user?.avatar_url) {
      return (
        <img
          src={user.avatar_url}
          alt={`${user.first_name} ${user.last_name}`}
          className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
        />
      )
    }
    const initials = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`.toUpperCase()
    return (
      <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-base font-semibold border-2 border-white shadow-md">
        {initials || <User className="h-6 w-6" />}
      </div>
    )
  }

  if (prospectLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-50 via-white to-sky-50">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!selectedProspect || !selectedAction) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <button
            onClick={() => navigate('/ai-sales-copilot')}
            className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to prioritized prospects
          </button>
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-sky-100 p-10 text-center shadow-lg shadow-sky-100/60">
            <p className="text-base text-gray-700">
              Cannot find this action. It may have been updated. Please go back to the list and try again.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-sky-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Top bar: back + avatar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/ai-sales-copilot')}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to prioritized prospects
            </button>
          </div>
          {getUserAvatar()}
        </div>

        {/* Main layout: left email card, right coach panel */}
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2">
            <AIActionCard
              action={selectedAction}
              prospect={{
                prospect_id: selectedProspect.prospect_id,
                prospect_name: selectedProspect.prospect_name,
                prospect_company: selectedProspect.contact_data?.company || '',
              }}
              goalName={selectedProspect.campaign_data?.[0]?.campaign_goal?.name}
            />
          </div>
          <div className="col-span-1">
            {/* Atlas coach side panel – closer to reference design */}
            <div className="h-full bg-white/90 backdrop-blur-xl rounded-3xl border border-sky-100 shadow-xl shadow-sky-100/70 flex flex-col">
              {/* Header bar */}
              <div className="px-4 py-3 border-b border-sky-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-blue-50">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="leading-tight">
                    <p className="text-xs font-semibold text-gray-900">Atlas</p>
                    <p className="text-[11px] text-slate-500">AI Sales Coach</p>
                  </div>
                </div>
              </div>

              {/* Tips list - Dynamic from AI */}
              <div className="px-4 py-4 space-y-4 max-h-[400px] overflow-y-auto">
                {selectedProspect?.ai_tips && selectedProspect.ai_tips.length > 0 ? (
                  selectedProspect.ai_tips.map((tip: AITip, index: number) => (
                    <div key={index} className="flex gap-3">
                      <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-900 mb-1">
                          {tip.title}
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {tip.content}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback tips if AI tips not available
                  <>
                    <div className="flex gap-3">
                      <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-900 mb-1">
                          Use Personalization
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          Research shows that personalized messages have a 26% higher open rate. Use their name, reference their company, and mention specific details from previous interactions to create a genuine connection that demonstrates you've done your homework.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-900 mb-1">
                          Timing Matters
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          Strike while it's fresh in mind by following up shortly after your last interaction. Neuroscience research indicates that memory consolidation happens within 24-48 hours, making this the optimal window for maximum recall and engagement.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Check className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-gray-900 mb-1">
                          Spark Curiosity
                        </p>
                        <p className="text-xs text-slate-700 leading-relaxed">
                          Ask a thoughtful question that sparks curiosity and makes it easy to reply. Questions trigger the brain's reward system, creating anticipation and increasing the likelihood of a response by up to 50% compared to statements.
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Rules Used Section */}
              {selectedProspect?.rules_used && selectedProspect.rules_used.length > 0 && (
                <>
                  <div className="mx-4 h-px bg-sky-100" />
                  <div className="px-4 py-4">
                    <p className="text-xs font-semibold text-gray-900 mb-3">
                      Rules Used from Knowledge Base ({selectedProspect.rules_used.length})
                    </p>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                      {selectedProspect.rules_used.map((rule: UsedRule, index: number) => (
                        <div key={index} className="bg-sky-50 rounded-lg p-3 border border-sky-100">
                          <p className="text-xs text-slate-700 leading-relaxed mb-2">
                            {rule.content}
                          </p>
                          {rule.document && (
                            <div className="mt-2 pt-2 border-t border-sky-200 space-y-1.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                  <FileText className="h-3 w-3 text-sky-500 flex-shrink-0" />
                                  <span className="text-[10px] font-semibold text-slate-700 truncate" title={rule.document.original_filename || rule.document.filename}>
                                    {rule.document.original_filename || rule.document.filename}
                                  </span>
                                  {rule.similarity_score && (
                                    <span className="ml-1.5 text-[10px] text-sky-600 font-medium flex-shrink-0">
                                      ({(rule.similarity_score * 100).toFixed(0)}% match)
                                    </span>
                                  )}
                                </div>
                                <button
                                  onClick={() => navigate(`/rag-sales-coach`)}
                                  className="text-[10px] text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors flex-shrink-0"
                                  title="View document in RAG Sales Coach"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                </button>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                {rule.document.status && (
                                  <span className={`px-1.5 py-0.5 rounded ${
                                    rule.document.status === 'processed' ? 'bg-green-100 text-green-700' :
                                    rule.document.status === 'processing' ? 'bg-yellow-100 text-yellow-700' :
                                    rule.document.status === 'failed' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {rule.document.status}
                                  </span>
                                )}
                                {rule.document.total_chunks !== undefined && rule.document.total_chunks > 0 && (
                                  <span>Chunks: {rule.document.total_chunks}</span>
                                )}
                                {rule.document.file_size && rule.document.file_size > 0 && (
                                  <span>• Size: {(rule.document.file_size / 1024).toFixed(1)} KB</span>
                                )}
                                {rule.document.uploaded_at && (
                                  <span>• Uploaded: {new Date(rule.document.uploaded_at).toLocaleDateString()}</span>
                                )}
                                {rule.document.processed_at && (
                                  <span>• Processed: {new Date(rule.document.processed_at).toLocaleDateString()}</span>
                                )}
                              </div>
                              {rule.chunk_index !== undefined && (
                                <div className="text-[10px] text-slate-400">
                                  Chunk #{rule.chunk_index + 1} of {rule.document.total_chunks || '?'}
                                </div>
                              )}
                              {rule.document.error_message && (
                                <div className="text-[10px] text-red-600 bg-red-50 px-2 py-1 rounded">
                                  Error: {rule.document.error_message}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Divider */}
              <div className="mx-4 h-px bg-sky-100" />

              {/* Bottom question & CTA */}
              <div className="px-4 py-4 mt-auto">
                <p className="text-xs font-semibold text-gray-900 mb-3">
                  Would you like to dive deeper into neuroscience applied to sales?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setCoachChoice('yes')}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border ${
                      coachChoice === 'yes'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    } transition-colors`}
                  >
                    <ThumbsUp className="h-3.5 w-3.5" />
                    Yes
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoachChoice('later')}
                    className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border ${
                      coachChoice === 'later'
                        ? 'bg-slate-200 text-slate-800 border-slate-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    } transition-colors`}
                  >
                    <ThumbsDown className="h-3.5 w-3.5" />
                    Not now
                  </button>
                </div>

                {coachChoice === 'yes' && (
                  <div className="mt-3 flex items-start gap-2 text-[11px] text-slate-500">
                    <ChevronRight className="h-3 w-3 text-blue-500 mt-0.5" />
                    <span>Great choice. Atlas will keep surfacing follow‑ups that tap into curiosity and emotional memory.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

