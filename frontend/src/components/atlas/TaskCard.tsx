import {
  CheckCircle2,
  ChevronRight,
  RefreshCw,
  Clock,
  Mail,
  PhoneCall,
  FileText,
  Calendar,
  MessageSquare,
  Zap,
  ArrowUpRight,
  Building2,
} from 'lucide-react'
import type { TodoItem, TodoSource, TodoTaskType, TodoPriority } from '../../lib/api'
import { cn } from '../../lib/utils'

function formatDueDate(dueAt: string): string {
  const due = new Date(dueAt)
  const now = new Date()
  const diffMs = due.getTime() - now.getTime()
  const diffHours = Math.round(diffMs / (1000 * 60 * 60))
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffHours < -24) {
    return `${Math.abs(diffDays)} days overdue`
  } else if (diffHours < 0) {
    return `${Math.abs(diffHours)}h overdue`
  } else if (diffHours < 1) {
    return 'Due soon'
  } else if (diffHours < 24) {
    return `Due in ${diffHours}h`
  } else if (diffDays === 1) {
    return 'Due tomorrow'
  } else if (diffDays <= 7) {
    return `Due in ${diffDays} days`
  } else {
    return `Due ${due.toLocaleDateString()}`
  }
}

const SOURCE_ICONS: Record<TodoSource, typeof Mail> = {
  email: Mail,
  meeting: PhoneCall,
  manual: FileText,
}

const TASK_TYPE_LABELS: Record<TodoTaskType, string> = {
  send_integration_doc: 'Integration Doc',
  respond_to_email: 'Email Response',
  handle_pricing_objection: 'Pricing Objection',
  competitive_followup: 'Competitive',
  schedule_demo: 'Schedule Demo',
  send_case_study: 'Case Study',
  general_followup: 'Follow-Up',
}

const TASK_TYPE_ICONS: Record<TodoTaskType, typeof Mail> = {
  send_integration_doc: FileText,
  respond_to_email: Mail,
  handle_pricing_objection: MessageSquare,
  competitive_followup: Zap,
  schedule_demo: Calendar,
  send_case_study: FileText,
  general_followup: ArrowUpRight,
}

const STATUS_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  ready: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
  needs_input: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  overdue: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  done: { bg: 'bg-slate-50', text: 'text-slate-500', dot: 'bg-slate-400' },
}

const PRIORITY_COLORS: Record<TodoPriority, string> = {
  high: 'bg-red-500',
  medium: 'bg-blue-500',
  low: 'bg-slate-400',
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
  onMarkDone,
  onRegenerate,
  onSnooze,
}: TaskCardProps) {
  const TaskTypeIcon = TASK_TYPE_ICONS[task.task_type] ?? ArrowUpRight
  const SourceIcon = SOURCE_ICONS[task.source]
  const isDone = task.status === 'done'
  const companyName = task.deal_intelligence?.company_name ?? 'Unknown'
  const dealStage = task.deal_intelligence?.deal_stage
  const statusStyle = STATUS_STYLES[task.status] ?? STATUS_STYLES.ready

  return (
    <article
      className={cn(
        'group rounded-xl border bg-white p-4 transition-all cursor-pointer',
        isDone 
          ? 'border-slate-100 opacity-60' 
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
      )}
      onClick={() => onOpen(task)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onOpen(task)}
    >
      {/* Top row: Company + Status */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
            <Building2 className="h-4 w-4 text-slate-500" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{companyName}</p>
            {dealStage && (
              <p className="text-xs text-slate-500 truncate">{dealStage}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={cn('w-2 h-2 rounded-full', PRIORITY_COLORS[task.priority])} title={`${task.priority} priority`} />
          <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', statusStyle.bg, statusStyle.text)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', statusStyle.dot)} />
            {task.status === 'done' ? 'Done' : task.status.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Task title */}
      <h3 className={cn('text-sm font-medium text-slate-800 mb-2 line-clamp-2', isDone && 'line-through text-slate-500')}>
        {task.title}
      </h3>

      {/* Metadata row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mb-3">
        <div className="inline-flex items-center gap-1">
          <TaskTypeIcon className="h-3.5 w-3.5" />
          <span>{TASK_TYPE_LABELS[task.task_type]}</span>
        </div>
        <div className="inline-flex items-center gap-1">
          <SourceIcon className="h-3.5 w-3.5" />
          <span className="capitalize">{task.source}</span>
        </div>
        {task.due_at && (
          <div className={cn(
            'inline-flex items-center gap-1',
            task.status === 'overdue' ? 'text-red-600 font-medium' : 
            new Date(task.due_at) < new Date() ? 'text-red-600' : 'text-amber-600'
          )}>
            <Clock className="h-3.5 w-3.5" />
            <span>{formatDueDate(task.due_at)}</span>
          </div>
        )}
      </div>

      {/* Draft preview */}
      {task.prepared_action?.draft_text && !isDone && (
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 bg-slate-50 rounded-lg p-2 border border-slate-100">
          {task.prepared_action.draft_text}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-1 pt-3 border-t border-slate-100" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => onOpen(task)}
          className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          Open
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
        {!isDone && (
          <>
            <button
              type="button"
              onClick={() => onMarkDone(task)}
              className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              Done
            </button>
            {onRegenerate && (
              <button
                type="button"
                onClick={() => onRegenerate(task)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                title="Regenerate draft"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            )}
            {onSnooze && (
              <button
                type="button"
                onClick={() => onSnooze(task)}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-1"
                title="Snooze"
              >
                <Clock className="h-3.5 w-3.5" />
              </button>
            )}
          </>
        )}
      </div>
    </article>
  )
}
