import React, { useState, useEffect } from 'react'
import { Send, Edit, Loader2, Brain, CheckCircle, X } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'react-hot-toast'
import { prioritizedProspectsAPI } from '../lib/api'

interface TodoAction {
  id: string
  what: string
  when: string
  channel: 'email' | 'whatsapp' | 'linkedin' | 'call' | 'video_call'
  priority: 'high' | 'medium' | 'low'
  message?: string
  call_script?: string
  topics?: string[]
  reason: string
  confidence?: number
}

interface ProspectInfo {
  prospect_id: string
  prospect_name: string
  prospect_company: string
}

interface AIActionCardProps {
  action: TodoAction | null
  prospect: ProspectInfo | null
  goalName?: string
}

const AIActionCard: React.FC<AIActionCardProps> = ({
  action,
  prospect
}) => {
  const [showReasoningModal, setShowReasoningModal] = useState(false)
  const [currentContent, setCurrentContent] = useState(action?.message || action?.call_script || '')
  const queryClient = useQueryClient()

  // Update currentContent when action changes
  useEffect(() => {
    setCurrentContent(action?.message || action?.call_script || '')
  }, [action?.message, action?.call_script])

  const sendMessageMutation = useMutation({
    mutationFn: async (_data: { action: TodoAction; prospect: ProspectInfo }) => {
      // TODO: Implement actual send message API
      await new Promise(resolve => setTimeout(resolve, 1000))
      return { success: true }
    },
    onSuccess: () => {
      toast.success('Message sent successfully!')
    },
    onError: () => {
      toast.error('Failed to send message')
    }
  })

  const shortenMutation = useMutation({
    mutationFn: () => prioritizedProspectsAPI.shortenContent(action!.id),
    onSuccess: (data) => {
      const newContent = data.data.shortened_content
      setCurrentContent(newContent)
      // Update action object to reflect new content
      if (action) {
        if (action.channel === 'call') {
          action.call_script = newContent
        } else {
          action.message = newContent
        }
      }
      toast.success('Content shortened successfully!')
    },
    onError: () => {
      toast.error('Failed to shorten content')
    }
  })

  const differentApproachMutation = useMutation({
    mutationFn: () => prioritizedProspectsAPI.generateDifferentApproach(action!.id),
    onSuccess: (data) => {
      const newContent = data.data.new_content
      setCurrentContent(newContent)
      // Update action object to reflect new content
      if (action) {
        if (action.channel === 'call') {
          action.call_script = newContent
        } else {
          action.message = newContent
        }
      }
      toast.success('New approach generated!')
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['prioritized-prospect-detail', action!.id] })
    },
    onError: () => {
      toast.error('Failed to generate different approach')
    }
  })

  if (!action || !prospect) {
    return (
      <div className="h-full flex items-center justify-center bg-white/80 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-sm">
        <div className="text-center text-slate-400">
          <Brain className="h-10 w-10 mx-auto mb-3" />
          <p className="text-sm">Select a prospect from the list to see Atlas&apos;s suggestion.</p>
        </div>
      </div>
    )
  }

  const handleSend = () => {
    sendMessageMutation.mutate({ action, prospect })
  }

  const getConfidenceScore = () => {
    // Use confidence from action if available, otherwise calculate based on priority
    if (action.confidence !== undefined) return Math.round(action.confidence)
    if (action.priority === 'high') return 85
    if (action.priority === 'medium') return 70
    return 60
  }

  const confidenceScore = getConfidenceScore()

  const getChannelLabel = (channel: string) => {
    switch (channel) {
      case 'email':
        return 'Now · Email'
      case 'whatsapp':
        return 'Now · WhatsApp'
      case 'linkedin':
        return 'Now · LinkedIn'
      case 'call':
        return 'Now · Call'
      case 'video_call':
        return 'Now · Video Call'
      default:
        return channel
    }
  }

  const getWhenLabel = (when: string) => {
    const lower = when.toLowerCase()
    if (lower.includes('now')) return 'Now'
    if (lower.includes('today')) return 'Today'
    return when
  }

  return (
    <div className="h-full flex flex-col bg-white/90 backdrop-blur-xl rounded-3xl border border-slate-100 shadow-xl shadow-sky-100/70">
      {/* Top breadcumb + prospect header */}
      <div className="px-6 pt-5 pb-4 border-b border-slate-100">
        <div className="text-xs text-slate-400 mb-3">
          Prioritized Prospects <span className="mx-1">/</span>
          <span className="text-slate-500 font-medium">{action.what}</span>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-sm font-semibold">
              {prospect.prospect_name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-slate-900">{prospect.prospect_name}</h3>
              </div>
              <p className="text-xs text-slate-400">
                {getChannelLabel(action.channel)} • {getWhenLabel(action.when)}
              </p>
            </div>
          </div>
          <button className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors">
            <span className="sr-only">More options</span>
            <span className="inline-block h-1 w-1 rounded-full bg-slate-400 mr-0.5" />
            <span className="inline-block h-1 w-1 rounded-full bg-slate-400 mr-0.5" />
            <span className="inline-block h-1 w-1 rounded-full bg-slate-400" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 pb-6 pt-4 space-y-4 overflow-y-auto">
        {/* Suggested label */}
        <div className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-sky-50 text-sky-700 text-xs font-medium border border-sky-100">
          <Brain className="h-3.5 w-3.5 text-sky-500" />
          <span>
            Suggested follow-up {action.channel === 'email' ? 'email' : 'message'} for{' '}
            <span className="font-semibold text-slate-900">{prospect.prospect_name}</span>
          </span>
        </div>

        {/* Main message body */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <p className="text-sm text-slate-900 whitespace-pre-wrap leading-relaxed">
            {currentContent ||
              action.call_script || 
              action.message ||
              `Hi ${prospect.prospect_name.split(' ')[0] || ''},

I wanted to follow up regarding our recent discussion.

Best regards,
[Your Name]`}
          </p>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle className="h-3.5 w-3.5" />
            AI‑generated {action.channel === 'email' ? 'email' : 'message'}
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-50 text-slate-500 border border-slate-100">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Recommended time: <span className="font-medium text-slate-700">{getWhenLabel(action.when)}</span>
          </span>
          <span className="ml-auto text-[11px] uppercase tracking-[0.16em] text-slate-400">
            Confidence {confidenceScore}%
          </span>
        </div>

        {/* Why / Shorter / Different approach chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => setShowReasoningModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <span role="img" aria-label="thinking">
              🤔
            </span>
            Why this {action.channel === 'email' ? 'email' : 'message'}?
          </button>
          <button
            onClick={() => shortenMutation.mutate()}
            disabled={shortenMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {shortenMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Edit className="h-3 w-3" />
            )}
            Make it shorter
          </button>
          <button
            onClick={() => differentApproachMutation.mutate()}
            disabled={differentApproachMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 border border-slate-100 text-xs text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {differentApproachMutation.isPending ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Brain className="h-3 w-3" />
            )}
            Try a different approach
          </button>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex gap-3">
          <button
            onClick={handleSend}
            disabled={sendMessageMutation.isPending}
            className="inline-flex flex-1 items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 text-white text-sm font-semibold shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {sendMessageMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send
              </>
            )}
          </button>
          <button
            type="button"
            className="inline-flex flex-[0.6] items-center justify-center px-5 py-3 rounded-2xl bg-slate-50 text-slate-400 text-sm font-medium border border-slate-100 cursor-not-allowed"
          >
            Modify
          </button>
        </div>
      </div>

      {/* Reasoning Modal */}
      {showReasoningModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowReasoningModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Why this {action.channel === 'email' ? 'email' : 'message'}?</h3>
              <button
                onClick={() => setShowReasoningModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="bg-sky-50 rounded-xl p-4 border border-sky-100">
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {action.reason || 'No reasoning provided for this message.'}
              </p>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowReasoningModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AIActionCard
