import {
  Edit3,
} from 'lucide-react'
import type { TodoItem, TodoSource, TodoTaskType } from '../../lib/api'
import { cn } from '../../lib/utils'

function formatDueDate(dueAt: string): string {
  const due = new Date(dueAt)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffHours < -24) {
    return `${Math.abs(diffDays)}d overdue`
  } else if (diffHours < 0) {
    return `${Math.abs(diffHours)}h overdue`
  } else if (diffHours < 1) {
    return 'Due soon'
  } else if (diffHours < 24) {
    return `${diffHours}h`
  } else if (diffDays === 1) {
    return 'Tomorrow'
  } else if (diffDays <= 7) {
    return `${diffDays}d`
  } else {
    return due.toLocaleDateString('en', { month: 'short', day: 'numeric' })
  }
}

const SOURCE_LABELS: Record<TodoSource, string> = {
  email: 'Email',
  meeting: 'Meeting',
  manual: 'Manual',
}

const TASK_TYPE_LABELS: Record<TodoTaskType, string> = {
  send_integration_doc: 'Integration',
  respond_to_email: 'Email',
  handle_pricing_objection: 'Pricing',
  competitive_followup: 'Competitive',
  schedule_demo: 'Demo',
  send_case_study: 'Case Study',
  general_followup: 'Follow-Up',
}

const TASK_TYPE_COLORS: Record<TodoTaskType, { bg: string; text: string }> = {
  send_integration_doc: { bg: 'bg-slate-100', text: 'text-slate-600' },
  respond_to_email: { bg: 'bg-blue-50', text: 'text-blue-600' },
  handle_pricing_objection: { bg: 'bg-amber-50', text: 'text-amber-600' },
  competitive_followup: { bg: 'bg-purple-50', text: 'text-purple-600' },
  schedule_demo: { bg: 'bg-green-50', text: 'text-green-600' },
  send_case_study: { bg: 'bg-cyan-50', text: 'text-cyan-600' },
  general_followup: { bg: 'bg-slate-100', text: 'text-slate-600' },
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
  const taskTypeColor = TASK_TYPE_COLORS[task.task_type] ?? TASK_TYPE_COLORS.general_followup
  const competitor = task.deal_intelligence?.competitor_mentioned

  return (
    <article
      className={cn(
        'group rounded-lg border-l-3 bg-white p-2.5 transition-all cursor-pointer shadow-sm hover:shadow',
        isDone 
          ? 'border-l-slate-300 opacity-60' 
          : 'border-l-blue-500'
      )}
      onClick={() => onOpen(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(task)}
    >
      {/* Task type + source */}
      <div className="flex items-center gap-1 mb-1.5 flex-wrap">
        <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', isDone ? 'bg-slate-400' : 'bg-blue-500')} />
        <span className="text-[10px] font-medium text-blue-600">
          {TASK_TYPE_LABELS[task.task_type]}
        </span>
        <span className="text-[10px] text-slate-400">•</span>
        <span className="text-[10px] text-slate-400">{SOURCE_LABELS[task.source]}</span>
        {task.due_at && (
          <>
            <span className="text-[10px] text-slate-400">•</span>
            <span className={cn(
              'text-[10px]',
              task.status === 'overdue' || new Date(task.due_at) < new Date() 
                ? 'text-red-500 font-medium' 
                : 'text-slate-400'
            )}>
              {formatDueDate(task.due_at)}
            </span>
          </>
        )}
      </div>

      {/* Title - wrap text */}
      <h3 className={cn(
        'text-[11px] font-medium text-slate-800 mb-1.5 leading-snug break-words',
        isDone && 'line-through text-slate-500'
      )}>
        {task.title}
      </h3>

      {/* Tags */}
      <div className="flex flex-wrap items-center gap-1 mb-1.5">
        <span className={cn(
          'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium',
          taskTypeColor.bg,
          taskTypeColor.text
        )}>
          {TASK_TYPE_LABELS[task.task_type]}
        </span>
        {competitor && (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-50 text-purple-600 break-words">
            {competitor}
          </span>
        )}
      </div>

      {/* Draft preview - wrap text */}
      {task.prepared_action?.draft_text && !isDone && (
        <div className="bg-slate-50 rounded p-2 mb-2 border-l-2 border-slate-200">
          <p className="text-[10px] text-slate-500 leading-relaxed break-words whitespace-pre-wrap line-clamp-2">
            {task.prepared_action.draft_text}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onOpen(task)}
          className="inline-flex items-center px-2.5 py-1.5 rounded text-[10px] font-semibold text-white bg-blue-500 hover:bg-blue-600 transition-colors"
        >
          Review
        </button>
        {onRegenerate && !isDone && (
          <button
            type="button"
            onClick={() => onRegenerate(task)}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors"
          >
            <Edit3 className="h-2.5 w-2.5" />
            Edit
          </button>
        )}
      </div>
    </article>
  )
}
