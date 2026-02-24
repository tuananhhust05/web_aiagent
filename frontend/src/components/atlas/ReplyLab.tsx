import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ExternalLink,
  BarChart3,
  MessageSquare,
  Copy,
  Send,
  Pencil,
  Loader2,
  Building2,
  TrendingUp,
  AlertTriangle,
  Target,
  CheckCircle2,
  Mail,
  Video,
  ChevronDown,
  ChevronUp,
  User,
} from 'lucide-react'
import type { TodoItem, ThreadMessage, EmailSourceContent, MeetingSourceContent } from '../../lib/api'
import { todoReadyAPI } from '../../lib/api'
import { cn } from '../../lib/utils'
import { toast } from 'react-hot-toast'

export interface ReplyLabProps {
  task: TodoItem | null
  threadMessages?: ThreadMessage[]
  onApproveCopy?: (task: TodoItem, draft: string) => void
  onApproveSend?: (task: TodoItem, draft: string) => void
  onCopyToCrm?: (task: TodoItem, draft: string) => void
  onEditDraft?: (task: TodoItem, draft: string) => void
  onTaskSent?: (task: TodoItem) => void
}

export default function ReplyLab({
  task,
  threadMessages = [],
  onApproveCopy,
  onCopyToCrm,
  onEditDraft,
  onTaskSent,
}: ReplyLabProps) {
  const queryClient = useQueryClient()
  const preparedDraft = task?.prepared_action?.draft_text ?? ''
  const [draft, setDraft] = useState(preparedDraft)
  const [isEditing, setIsEditing] = useState(false)
  const [copying, setCopying] = useState(false)
  const [sourceExpanded, setSourceExpanded] = useState(true)

  useEffect(() => {
    if (task) setDraft(task.prepared_action?.draft_text ?? '')
  }, [task?.id, task?.prepared_action?.draft_text])

  // Fetch source content when task changes
  const { data: sourceData, isLoading: sourceLoading } = useQuery({
    queryKey: ['todo-ready', 'source-content', task?.id],
    queryFn: () => task?.id ? todoReadyAPI.getSourceContent(task.id).then((r) => r.data) : null,
    enabled: !!task?.id && !!task?.source_id,
    staleTime: 5 * 60 * 1000,
  })

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: (taskId: string) => todoReadyAPI.sendEmail(taskId).then((r) => r.data),
    onSuccess: (data) => {
      if (data.needs_reauthorization && data.auth_url) {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Gmail needs to be reconnected to send emails</p>
            <button
              onClick={() => {
                window.location.href = data.auth_url!
                toast.dismiss(t.id)
              }}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
            >
              Connect Gmail
            </button>
          </div>
        ), { duration: 10000 })
        return
      }
      
      if (data.success) {
        toast.success('Email sent successfully!')
        queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
        onTaskSent?.(task!)
      } else {
        toast.error(data.message || 'Failed to send email')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send email')
    },
  })

  const isEmailTask = task?.source === 'email'

  if (!task) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-8">
        <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-6">
          <MessageSquare className="h-8 w-8 text-slate-300" aria-hidden />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">No task selected</h3>
        <p className="text-sm text-slate-500 max-w-sm">
          Select a task from the list to view deal context, communication thread, and prepared reply.
        </p>
      </div>
    )
  }

  const intel = task.deal_intelligence
  const action = task.prepared_action
  const effectiveDraft = draft || preparedDraft

  const handleCopy = async () => {
    if (!effectiveDraft) return
    setCopying(true)
    try {
      await navigator.clipboard.writeText(effectiveDraft)
      onApproveCopy?.(task, effectiveDraft)
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="h-full flex flex-col gap-4 overflow-y-auto">
      {/* Section A: Deal Intelligence Summary */}
      <section className="shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Target className="h-3.5 w-3.5" />
            Deal Intelligence
          </h2>
        </div>
        <div className="p-5">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Company</p>
                  <p className="text-sm font-semibold text-slate-900">{intel?.company_name ?? 'Unknown'}</p>
                </div>
              </div>
            </div>
            
            {intel?.deal_stage && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Deal Stage</p>
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 text-xs font-medium">
                  <TrendingUp className="h-3 w-3" />
                  {intel.deal_stage}
                </span>
              </div>
            )}
            
            {intel?.last_call_sentiment && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Last Call</p>
                <p className="text-sm text-slate-700">{intel.last_call_sentiment}</p>
              </div>
            )}
            
            {intel?.last_objection && (
              <div className="col-span-2 lg:col-span-3">
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  Last Objection
                </p>
                <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">{intel.last_objection}</p>
              </div>
            )}
            
            {intel?.competitor_mentioned && (
              <div>
                <p className="text-xs text-slate-500 mb-1">Competitor</p>
                <p className="text-sm text-slate-700">{intel.competitor_mentioned}</p>
              </div>
            )}
          </div>
          
          {/* Quick links */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-slate-100">
            {intel?.deal_id && (
              <a
                href={`/deals/${intel.deal_id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View Deal
              </a>
            )}
            {task.source === 'meeting' && task.source_id && (
              <a
                href={`/atlas/meetings/${task.source_id}`}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                <BarChart3 className="h-3.5 w-3.5" />
                View Meeting
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Section B: Source Content (Email/Meeting) */}
      {task.source_id && (
        <section className="shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setSourceExpanded(!sourceExpanded)}
            className="w-full px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between hover:bg-slate-100 transition-colors"
          >
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              {task.source === 'email' ? (
                <>
                  <Mail className="h-3.5 w-3.5" />
                  Original Email
                </>
              ) : task.source === 'meeting' ? (
                <>
                  <Video className="h-3.5 w-3.5" />
                  Meeting Transcript
                </>
              ) : (
                <>
                  <MessageSquare className="h-3.5 w-3.5" />
                  Source Content
                </>
              )}
            </h2>
            {sourceExpanded ? (
              <ChevronUp className="h-4 w-4 text-slate-400" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-400" />
            )}
          </button>
          
          {sourceExpanded && (
            <div className="p-5">
              {sourceLoading ? (
                <div className="flex items-center justify-center py-8 text-slate-500">
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  <span className="text-sm">Loading content...</span>
                </div>
              ) : sourceData?.content ? (
                <SourceContentDisplay type={sourceData.type} content={sourceData.content} />
              ) : (
                <p className="text-sm text-slate-500 italic py-4 text-center">
                  {sourceData?.message || 'Content not available'}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Section C: Communication Thread (if provided) */}
      {threadMessages.length > 0 && (
        <section className="shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5" />
              Communication Thread
            </h2>
          </div>
          <div className="p-5 space-y-3 max-h-64 overflow-y-auto">
            {threadMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  'rounded-xl p-4 text-sm',
                  msg.role === 'prospect'
                    ? 'bg-slate-50 border border-slate-100 ml-0 mr-8'
                    : 'bg-blue-50 border border-blue-100 ml-8 mr-0'
                )}
              >
                <p className="font-medium text-xs uppercase tracking-wider text-slate-400 mb-2">
                  {msg.role === 'prospect' ? 'Prospect' : 'You'}
                </p>
                <p className="text-slate-700 whitespace-pre-wrap">{msg.content}</p>
                {msg.timestamp && (
                  <p className="text-xs text-slate-400 mt-2">
                    {new Date(msg.timestamp).toLocaleString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Section D: Prepared Action Block */}
      <section className="shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" />
            Prepared Action
          </h2>
          {action?.strategy_label && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium">
              {action.strategy_label}
            </span>
          )}
        </div>
        
        <div className="p-5">
          {action?.explanation && (
            <p className="text-sm text-slate-600 mb-4 pb-4 border-b border-slate-100">{action.explanation}</p>
          )}
          
          <div>
            <textarea
              value={isEditing ? draft : effectiveDraft}
              onChange={(e) => setDraft(e.target.value)}
              readOnly={!isEditing}
              placeholder="Prepared draft will appear here…"
              rows={6}
              className={cn(
                'w-full rounded-xl border px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 resize-y transition-all',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                isEditing 
                  ? 'border-blue-300 bg-white shadow-inner' 
                  : 'border-slate-200 bg-slate-50/50'
              )}
              aria-label="Draft reply"
            />
            
            {/* Action buttons */}
            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(!isEditing)
                  if (!isEditing) setDraft(effectiveDraft)
                  onEditDraft?.(task, effectiveDraft)
                }}
                className={cn(
                  'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2',
                  isEditing
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400'
                )}
              >
                <Pencil className="h-4 w-4" />
                {isEditing ? 'Save Edit' : 'Edit'}
              </button>
              
              <div className="flex-1" />
              
              <button
                type="button"
                onClick={handleCopy}
                disabled={!effectiveDraft || copying}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
              >
                {copying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Copy className="h-4 w-4" />}
                Copy
              </button>
              
              {/* Send button - only for email tasks */}
              {isEmailTask && (
                <button
                  type="button"
                  onClick={() => task?.id && sendEmailMutation.mutate(task.id)}
                  disabled={!effectiveDraft || sendEmailMutation.isPending || task?.status === 'done'}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {sendEmailMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  {task?.status === 'done' ? 'Sent' : 'Send Email'}
                </button>
              )}
              
              {onCopyToCrm && (
                <button
                  type="button"
                  onClick={() => onCopyToCrm(task, effectiveDraft)}
                  className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium border border-slate-300 text-slate-700 hover:bg-slate-50 transition-all focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
                >
                  Copy to CRM
                </button>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

function SummaryObjectDisplay({ summary }: { summary: Record<string, unknown> }) {
  const formatKey = (key: string) => {
    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
  }

  const renderValue = (value: unknown): React.ReactNode => {
    if (typeof value === 'string') {
      return <p className="text-sm text-slate-700">{value}</p>
    }
    if (Array.isArray(value)) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {value.map((item, i) => (
            <li key={i} className="text-sm text-slate-700">
              {typeof item === 'string' ? item : JSON.stringify(item)}
            </li>
          ))}
        </ul>
      )
    }
    if (typeof value === 'object' && value !== null) {
      return (
        <div className="pl-3 border-l-2 border-slate-200 space-y-2">
          {Object.entries(value as Record<string, unknown>).map(([k, v]) => (
            <div key={k}>
              <p className="text-xs font-medium text-slate-500">{formatKey(k)}</p>
              {renderValue(v)}
            </div>
          ))}
        </div>
      )
    }
    return <p className="text-sm text-slate-700">{String(value)}</p>
  }

  return (
    <div className="space-y-3">
      {Object.entries(summary).map(([key, value]) => (
        <div key={key}>
          <p className="text-xs font-semibold text-slate-600 mb-1">{formatKey(key)}</p>
          {renderValue(value)}
        </div>
      ))}
    </div>
  )
}

function SourceContentDisplay({ type, content }: { type: string; content: EmailSourceContent | MeetingSourceContent }) {
  if (type === 'email') {
    const email = content as EmailSourceContent
    return (
      <div className="space-y-4">
        {/* Email header */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4 border-b border-slate-100">
          <div>
            <p className="text-xs text-slate-500 mb-1">From</p>
            <p className="text-sm font-medium text-slate-800">{email.from}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500 mb-1">To</p>
            <p className="text-sm text-slate-700">{email.to}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs text-slate-500 mb-1">Subject</p>
            <p className="text-sm font-semibold text-slate-900">{email.subject}</p>
          </div>
          {email.date && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Date</p>
              <p className="text-sm text-slate-600">{new Date(email.date).toLocaleString()}</p>
            </div>
          )}
        </div>
        
        {/* Email body - limited height to allow scrolling to Prepared Action */}
        <div>
          <p className="text-xs text-slate-500 mb-2">Message</p>
          <div className="bg-slate-50 rounded-lg p-4 max-h-48 overflow-y-auto">
            <p className="text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">
              {email.body || email.snippet || 'No content available'}
            </p>
          </div>
        </div>
      </div>
    )
  }
  
  if (type === 'meeting') {
    const meeting = content as MeetingSourceContent
    return (
      <div className="space-y-4">
        {/* Meeting header */}
        <div className="grid grid-cols-2 gap-3 pb-4 border-b border-slate-100">
          <div className="col-span-2">
            <p className="text-xs text-slate-500 mb-1">Meeting</p>
            <p className="text-sm font-semibold text-slate-900">{meeting.title}</p>
          </div>
          {meeting.created_at && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Date</p>
              <p className="text-sm text-slate-600">{new Date(meeting.created_at).toLocaleString()}</p>
            </div>
          )}
          {meeting.platform && (
            <div>
              <p className="text-xs text-slate-500 mb-1">Platform</p>
              <p className="text-sm text-slate-600 capitalize">{meeting.platform.replace('_', ' ')}</p>
            </div>
          )}
        </div>
        
        {/* Summary if available */}
        {meeting.summary && (
          <div>
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <Target className="h-3 w-3" />
              Summary
            </p>
            <div className="text-sm text-slate-700 bg-blue-50 rounded-lg p-3">
              {typeof meeting.summary === 'string' 
                ? meeting.summary 
                : <SummaryObjectDisplay summary={meeting.summary} />
              }
            </div>
          </div>
        )}
        
        {/* Transcript */}
        {meeting.transcript && (
          <div>
            <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
              <User className="h-3 w-3" />
              Transcript
            </p>
            <div className="bg-slate-50 rounded-lg p-4 max-h-48 overflow-y-auto">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {typeof meeting.transcript === 'string' 
                  ? meeting.transcript 
                  : JSON.stringify(meeting.transcript, null, 2)
                }
              </pre>
            </div>
          </div>
        )}
        
        {/* Next steps if available */}
        {meeting.next_steps && meeting.next_steps.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 mb-2">Next Steps</p>
            <ul className="space-y-1">
              {meeting.next_steps.map((step, i) => (
                <li key={i} className="text-sm text-slate-700 flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{typeof step === 'string' ? step : step.description}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }
  
  return <p className="text-sm text-slate-500 italic">Unknown content type</p>
}
