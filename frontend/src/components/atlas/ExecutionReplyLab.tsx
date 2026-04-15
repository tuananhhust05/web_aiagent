import { useState } from 'react'
import { X, Sparkles, Pencil, Send, RefreshCw, Lock } from 'lucide-react'
import type { TodoItem } from '../../lib/api'
import { cn } from '../../lib/utils'

export type ToneType = 'professional' | 'assertive' | 'collaborative'

export interface ExecutionReplyLabProps {
  task: TodoItem | null
  isOpen: boolean
  onClose: () => void
  onMarkSent: (taskId: string) => void
  onImproveDraft: (taskId: string) => void
  planType?: 'free' | 'pro' | 'enterprise'
  executionCredits?: number
  maxCredits?: number
}

const TONE_OPTIONS: { id: ToneType; label: string }[] = [
  { id: 'professional', label: 'Professional' },
  { id: 'assertive', label: 'Assertive' },
  { id: 'collaborative', label: 'Collaborative' },
]

export default function ExecutionReplyLab({
  task,
  isOpen,
  onClose,
  onMarkSent,
  onImproveDraft,
  planType = 'enterprise',
  executionCredits = 5,
  maxCredits = 5,
}: ExecutionReplyLabProps) {
  const [draft, setDraft] = useState(task?.prepared_action?.draft_text ?? '')
  const [isEditing, setIsEditing] = useState(false)
  const [selectedTone, setSelectedTone] = useState<ToneType>('professional')

  const isEnterprise = planType === 'enterprise'
  const hasCredits = executionCredits > 0
  const canExecute = isEnterprise || hasCredits
  const isSent = task?.status === 'done'

  if (!isOpen || !task) return null

  const intel = task.deal_intelligence
  const action = task.prepared_action

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Panel */}
      <div className="relative ml-auto w-full max-w-xl bg-white shadow-2xl flex flex-col h-full">
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Reply to: {intel?.company_name ?? 'Unknown'}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {action?.strategy_label || 'Prepared Response'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className={cn(
          'flex-1 overflow-y-auto',
          !canExecute && 'relative'
        )}>
          {/* Plan Gating Overlay */}
          {!canExecute && (
            <div className="absolute inset-0 z-10 bg-white/90 backdrop-blur-sm flex items-center justify-center">
              <div className="text-center px-8 max-w-sm">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  {planType === 'free' 
                    ? 'To-Do Ready is available on Enterprise plan'
                    : 'Execution Credits Exhausted'
                  }
                </h3>
                <p className="text-sm text-slate-500 mb-6">
                  {planType === 'free'
                    ? 'Upgrade to unlock AI-prepared execution.'
                    : `You've used all ${maxCredits} execution credits this month.`
                  }
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
                >
                  Upgrade
                </button>
              </div>
            </div>
          )}

          <div className={cn(!canExecute && 'blur-sm pointer-events-none')}>
            {/* Confidence Frame */}
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
                  <Sparkles className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-blue-900">ForSkale Recommendation</p>
                  <p className="text-sm text-blue-700 mt-0.5">
                    Send within 6 hours to maintain momentum.
                  </p>
                </div>
              </div>
            </div>

            {/* Tone Indicator */}
            <div className="px-6 py-4 border-b border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700">Tone</span>
                <div className="inline-flex items-center rounded-lg border border-slate-200 overflow-hidden">
                  {TONE_OPTIONS.map((tone) => (
                    <button
                      key={tone.id}
                      type="button"
                      onClick={() => setSelectedTone(tone.id)}
                      className={cn(
                        'px-3 py-1.5 text-xs font-medium transition-colors border-r border-slate-200 last:border-r-0',
                        selectedTone === tone.id
                          ? 'bg-slate-900 text-white'
                          : 'bg-white text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {tone.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Intelligence Summary */}
            {(intel?.last_objection || intel?.competitor_mentioned || intel?.deal_stage) && (
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                  Deal Context
                </h3>
                <div className="flex flex-wrap gap-2">
                  {intel?.last_objection && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-orange-50 text-orange-700 text-xs font-medium">
                      Pricing Objection
                    </span>
                  )}
                  {intel?.competitor_mentioned && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-red-50 text-red-700 text-xs font-medium">
                      Competitor: {intel.competitor_mentioned}
                    </span>
                  )}
                  {intel?.deal_stage && (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-xs font-medium">
                      {intel.deal_stage}
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Editable Draft */}
            <div className="px-6 py-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-900">Prepared Reply</h3>
                <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                  <Sparkles className="h-3 w-3" />
                  Prepared by ForSkale
                </span>
              </div>
              
              <div className="relative">
                <textarea
                  value={isEditing ? draft : (task.prepared_action?.draft_text ?? '')}
                  onChange={(e) => setDraft(e.target.value)}
                  readOnly={!isEditing}
                  rows={10}
                  className={cn(
                    'w-full rounded-xl border px-4 py-3 text-sm text-slate-800 leading-relaxed resize-none transition-all',
                    isEditing 
                      ? 'border-blue-300 bg-white ring-2 ring-blue-100 focus:outline-none' 
                      : 'border-slate-200 bg-slate-50/50'
                  )}
                />
                
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => { setIsEditing(true); setDraft(task.prepared_action?.draft_text ?? '') }}
                    className="absolute top-3 right-3 p-2 rounded-lg bg-white border border-slate-200 text-slate-500 hover:text-slate-700 hover:border-slate-300 transition-colors"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isEditing && (
                <div className="flex justify-end gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800"
                  >
                    Save Changes
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        {canExecute && (
          <div className="shrink-0 px-6 py-4 border-t border-slate-200 bg-slate-50">
            {/* Credits indicator for non-enterprise */}
            {!isEnterprise && (
              <div className="flex items-center justify-center gap-2 mb-3 text-xs text-slate-500">
                <span>Execution Credits:</span>
                <span className="font-semibold text-slate-700">{executionCredits} / {maxCredits}</span>
                <span>remaining</span>
              </div>
            )}
            
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => onImproveDraft(task.id)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-white transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Improve Draft
              </button>
              
              <button
                type="button"
                onClick={() => onMarkSent(task.id)}
                disabled={isSent}
                className={cn(
                  'flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-colors',
                  isSent
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                )}
              >
                {isSent ? (
                  'Sent'
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Mark as Sent
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
