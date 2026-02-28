import { useState } from 'react'
import { Pencil, Sparkles, ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export type ExecutionState = 'ready' | 'opened' | 'sent'
export type SentimentType = 'positive' | 'neutral' | 'risk'

export interface IntelligenceTag {
  label: string
  type: 'objection' | 'competitor' | 'demo' | 'legal' | 'general'
}

export interface ExecutionCardProps {
  id: string
  title: string
  companyName: string
  strategy: string
  strategyTooltip?: string
  triggerContext: string
  sentiment: SentimentType
  intelligenceTags: IntelligenceTag[]
  preparedReplyPreview: string
  state: ExecutionState
  isSelected?: boolean
  onClick?: () => void
  onReviewExecute?: () => void
  onMarkSent?: () => void
  onImproveDraft?: () => void
}

const STRATEGY_COLORS: Record<string, string> = {
  'Reframing Objection': 'bg-orange-50 text-orange-700 border-orange-200',
  'Social Proof': 'bg-emerald-50 text-emerald-700 border-emerald-200',
  'Anchoring': 'bg-blue-50 text-blue-700 border-blue-200',
  'Clarification': 'bg-purple-50 text-purple-700 border-purple-200',
  'Value Proposition': 'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Urgency': 'bg-red-50 text-red-700 border-red-200',
  'default': 'bg-slate-50 text-slate-700 border-slate-200',
}

const TAG_COLORS: Record<IntelligenceTag['type'], string> = {
  objection: 'bg-orange-50 text-orange-700',
  competitor: 'bg-red-50 text-red-700',
  demo: 'bg-blue-50 text-blue-700',
  legal: 'bg-purple-50 text-purple-700',
  general: 'bg-slate-100 text-slate-600',
}

const SENTIMENT_COLORS: Record<SentimentType, { dot: string; label: string }> = {
  positive: { dot: 'bg-emerald-500', label: 'Positive' },
  neutral: { dot: 'bg-amber-400', label: 'Neutral' },
  risk: { dot: 'bg-red-500', label: 'At Risk' },
}

export default function ExecutionCard({
  title,
  companyName,
  strategy,
  strategyTooltip,
  triggerContext,
  sentiment,
  intelligenceTags,
  preparedReplyPreview,
  state,
  isSelected,
  onClick,
  onReviewExecute,
  onMarkSent,
  onImproveDraft,
}: ExecutionCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  
  const isSent = state === 'sent'
  const strategyColor = STRATEGY_COLORS[strategy] || STRATEGY_COLORS.default
  const sentimentInfo = SENTIMENT_COLORS[sentiment]

  return (
    <div
      className={cn(
        'relative rounded-xl border bg-white transition-all',
        isSent 
          ? 'opacity-60 border-slate-200' 
          : isSelected 
            ? 'border-blue-300 ring-2 ring-blue-100 shadow-md' 
            : 'border-slate-200 hover:border-slate-300 hover:shadow-sm',
        !isSent && 'cursor-pointer'
      )}
      onClick={!isSent ? onClick : undefined}
    >
      {/* Strategy Badge - Top Left */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-start justify-between gap-3">
          <div 
            className="relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <span className={cn(
              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border',
              strategyColor
            )}>
              <Sparkles className="h-3 w-3" />
              {strategy}
            </span>
            
            {/* Strategy Tooltip */}
            {showTooltip && strategyTooltip && (
              <div className="absolute left-0 top-full mt-2 z-20 w-64 p-3 rounded-lg bg-slate-900 text-white text-xs leading-relaxed shadow-xl">
                {strategyTooltip}
                <div className="absolute -top-1 left-4 w-2 h-2 bg-slate-900 rotate-45" />
              </div>
            )}
          </div>
          
          {/* Sentiment Indicator */}
          <div className="flex items-center gap-1.5">
            <span className={cn('w-2 h-2 rounded-full', sentimentInfo.dot)} />
            <span className="text-[10px] font-medium text-slate-500">{sentimentInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Title + Intelligence Badges */}
      <div className="px-4 pb-3">
        <h3 className={cn(
          'text-base font-semibold mb-2',
          isSent ? 'text-slate-500' : 'text-slate-900'
        )}>
          Reply to: {companyName}
        </h3>
        
        <p className={cn(
          'text-sm mb-3',
          isSent ? 'text-slate-400' : 'text-slate-700'
        )}>
          {title}
        </p>

        {/* Intelligence Badges */}
        {intelligenceTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {intelligenceTags.map((tag, idx) => (
              <span
                key={idx}
                className={cn(
                  'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium',
                  TAG_COLORS[tag.type]
                )}
              >
                {tag.label}
              </span>
            ))}
          </div>
        )}

        {/* Trigger Context Line */}
        <p className="text-xs text-slate-400 mb-4">
          {triggerContext}
        </p>

        {/* Prepared Reply Preview - MANDATORY */}
        <div className={cn(
          'rounded-lg p-3 mb-4',
          isSent ? 'bg-slate-50' : 'bg-slate-50/80'
        )}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Prepared Reply
            </span>
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
              <Sparkles className="h-2.5 w-2.5" />
              Prepared by Atlas
            </span>
          </div>
          <p className={cn(
            'text-sm leading-relaxed line-clamp-3',
            isSent ? 'text-slate-400' : 'text-slate-700'
          )}>
            {preparedReplyPreview}
          </p>
          {!isSent && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onImproveDraft?.() }}
              className="inline-flex items-center gap-1 mt-2 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <Pencil className="h-3 w-3" />
              Edit
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="px-4 pb-4" onClick={(e) => e.stopPropagation()}>
        {isSent ? (
          <button
            type="button"
            disabled
            className="w-full py-2.5 rounded-lg bg-slate-100 text-slate-400 text-sm font-medium cursor-not-allowed"
          >
            Sent
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onReviewExecute}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              Review & Execute
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onMarkSent}
              className="px-4 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Mark as Sent
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
