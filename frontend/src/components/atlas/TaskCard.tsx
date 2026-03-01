import { Edit3, Phone, Check } from 'lucide-react'
import type { TodoItem, TodoSource, IntentCategory } from '../../lib/api'
import { cn } from '../../lib/utils'

function formatDueDate(dueAt: string): string {
  const due = new Date(dueAt)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  if (diffHours < -24) return `${Math.abs(diffDays)}d overdue`
  if (diffHours < 0) return `${Math.abs(diffHours)}h overdue`
  if (diffHours < 1) return 'Due soon'
  if (diffHours < 24) return `Due in ${diffHours}h`
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays <= 7) return `Due in ${diffDays}d`
  return due.toLocaleDateString('en', { month: 'short', day: 'numeric' })
}

const SOURCE_LABELS: Record<TodoSource, string> = {
  email: 'Email',
  meeting: 'Meeting',
  manual: 'Manual',
}

const INTENT_LABELS: Record<IntentCategory, string> = {
  interested: 'Interested',
  not_interested: 'Not interested',
  do_not_contact: 'Do not contact',
  not_now: 'Not now',
  forwarded: 'Forwarded',
  meeting_intent: 'Meeting intent',
  non_in_target: 'Non in target',
}

const INTENT_TAG_COLORS: Record<IntentCategory, string> = {
  interested: 'bg-emerald-100 text-emerald-700',
  not_interested: 'bg-slate-100 text-slate-600',
  do_not_contact: 'bg-red-100 text-red-700',
  not_now: 'bg-sky-100 text-sky-600',
  forwarded: 'bg-violet-100 text-violet-700',
  meeting_intent: 'bg-violet-200 text-violet-800',
  non_in_target: 'bg-pink-100 text-pink-700',
}

export interface TaskCardProps {
  task: TodoItem
  onOpen: (task: TodoItem) => void
  onMarkDone: (task: TodoItem) => void
  onRegenerate?: (task: TodoItem) => void
  onSnooze?: (task: TodoItem) => void
}

export default function TaskCard({
  task,
  onOpen,
  onRegenerate,
}: TaskCardProps) {
  const isDone = task.status === 'done'
  const isEmail = task.source === 'email'
  const competitor = task.deal_intelligence?.competitor_mentioned
  const dealStage = task.deal_intelligence?.deal_stage
  const typeLabel = isEmail ? 'Email Response' : 'Call Follow-up'

  return (
    <article
      className={cn(
        'group rounded-xl border bg-white p-4 transition-all cursor-pointer shadow-sm hover:shadow-md',
        isDone && 'opacity-60'
      )}
      onClick={() => onOpen(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(task)}
    >
      {/* Decision vs Execution: recommended next step (PRD action-type differentiation) */}
      {task.task_strategy?.recommended_next_step_type && (
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
          <span className="font-medium text-slate-600">Decision:</span>
          <span>
            {task.task_strategy.recommended_next_step_label ??
              (task.task_strategy.recommended_next_step_type === 'send_email'
                ? 'Send email'
                : task.task_strategy.recommended_next_step_type === 'make_call'
                  ? 'Make call'
                  : task.task_strategy.recommended_next_step_type.replace(/_/g, ' '))}
          </span>
        </div>
      )}

      {/* Type header: Email Response (blue) / Call Follow-up (red) + Reviewed badge */}
      <div className="flex items-center gap-2 mb-2 flex-wrap">
        {isEmail ? (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            {typeLabel}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-[11px] font-medium text-red-600">
            <Phone className="h-3.5 w-3.5" />
            {typeLabel}
          </span>
        )}
        {task.reviewed_at && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600">
            <Check className="h-3 w-3" />
            Reviewed
          </span>
        )}
      </div>

      {/* Objective (PRD action objective framing) */}
      {task.task_strategy?.objective && (
        <p className="text-[10px] text-slate-600 mb-2 px-2 py-1 rounded bg-amber-50 border border-amber-100">
          <span className="font-medium text-slate-700">Objective:</span> {task.task_strategy.objective}
        </p>
      )}

      {/* Title - bold */}
      <h3 className={cn(
        'text-sm font-semibold text-slate-900 mb-2 leading-snug break-words',
        isDone && 'line-through text-slate-500'
      )}>
        {task.title}
      </h3>

      {/* Intent / tags: Pricing Objection, Competitor: X, etc. */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {task.task_type === 'handle_pricing_objection' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
            Pricing Objection
          </span>
        )}
        {task.task_type === 'schedule_demo' && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-700">
            Demo Requested
          </span>
        )}
        {task.intent_category && (
          <span className={cn(
            'inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium',
            INTENT_TAG_COLORS[task.intent_category]
          )}>
            {INTENT_LABELS[task.intent_category]}
          </span>
        )}
        {competitor && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-red-100 text-red-700 break-words">
            Competitor: {competitor}
          </span>
        )}
      </div>

      {/* Metadata: Triggered from • Due • Deal stage • Sentiment */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-500 mb-2">
        <span>Triggered from: {SOURCE_LABELS[task.source]}</span>
        {task.due_at && (
          <>
            <span>•</span>
            <span className={task.status === 'overdue' || new Date(task.due_at) < new Date() ? 'text-red-600 font-medium' : ''}>
              {formatDueDate(task.due_at)}
            </span>
          </>
        )}
        {dealStage && (
          <>
            <span>•</span>
            <span>Deal Stage: {dealStage}</span>
          </>
        )}
        <span>•</span>
        <span>Sentiment: Neutral</span>
      </div>

      {/* Preview snippet */}
      {task.prepared_action?.draft_text && !isDone && (
        <div className="bg-slate-50 rounded-lg p-2.5 mb-3 border border-slate-100">
          <p className="text-[11px] text-slate-600 leading-relaxed break-words whitespace-pre-wrap line-clamp-2">
            {task.prepared_action.draft_text}
          </p>
        </div>
      )}

      {/* Action buttons: Review & Send / Edit Draft */}
      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onOpen(task)}
          className="inline-flex items-center px-3 py-2 rounded-lg text-[11px] font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
        >
          {isEmail ? 'Review & Send' : 'Send Follow-up'}
        </button>
        {onRegenerate && !isDone && (
          <button
            type="button"
            onClick={() => onRegenerate(task)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            <Edit3 className="h-3 w-3" />
            {isEmail ? 'Edit Draft' : 'Schedule Demo'}
          </button>
        )}
      </div>
    </article>
  )
}
