import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Send,
  Copy,
  Pencil,
  Loader2,
  AlertCircle,
  Mail,
  Video,
  Building2,
  Calendar,
  ChevronDown,
  ChevronUp,
  Sparkles,
  MessageSquare,
} from 'lucide-react'
import type { TodoItem, EmailSourceContent, MeetingSourceContent } from '../../lib/api'
import { todoReadyAPI } from '../../lib/api'
import { cn } from '../../lib/utils'
import { toast } from 'react-hot-toast'

export interface ReplyLabProps {
  task: TodoItem | null
  onApproveCopy?: (task: TodoItem, draft: string) => void
  onTaskSent?: (task: TodoItem) => void
  onBack?: () => void
}

export default function ReplyLab({
  task,
  onApproveCopy,
  onTaskSent,
  onBack,
}: ReplyLabProps) {
  const queryClient = useQueryClient()
  const preparedDraft = task?.prepared_action?.draft_text ?? ''
  const [draft, setDraft] = useState(preparedDraft)
  const [copying, setCopying] = useState(false)
  const [isEditing, setIsEditing] = useState(false)

  useEffect(() => {
    if (task) {
      setDraft(task.prepared_action?.draft_text ?? '')
      setIsEditing(false)
    }
  }, [task?.id, task?.prepared_action?.draft_text])

  const { data: sourceData, isLoading: sourceLoading } = useQuery({
    queryKey: ['todo-ready', 'source-content', task?.id],
    queryFn: () => task?.id ? todoReadyAPI.getSourceContent(task.id).then((r) => r.data) : null,
    enabled: !!task?.id && !!task?.source_id,
    staleTime: 5 * 60 * 1000,
  })

  const sendEmailMutation = useMutation({
    mutationFn: (taskId: string) => todoReadyAPI.sendEmail(taskId).then((r) => r.data),
    onSuccess: (data) => {
      if (data.needs_reauthorization && data.auth_url) {
        toast((t) => (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium">Gmail needs to be reconnected</p>
            <button
              onClick={() => {
                window.location.href = data.auth_url!
                toast.dismiss(t.id)
              }}
              className="px-2.5 py-1 bg-blue-600 text-white text-[10px] font-medium rounded hover:bg-blue-700"
            >
              Connect Gmail
            </button>
          </div>
        ), { duration: 10000 })
        return
      }
      
      if (data.success) {
        toast.success('Email sent!')
        queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
        onTaskSent?.(task!)
      } else {
        toast.error(data.message || 'Failed')
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed')
    },
  })

  if (!task) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 bg-white rounded-lg">
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
          <Send className="h-7 w-7 text-slate-300" aria-hidden />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 mb-1">No task selected</h3>
        <p className="text-[11px] text-slate-500 max-w-[200px]">
          Select a task to view conversation and AI reply
        </p>
      </div>
    )
  }

  const effectiveDraft = draft || preparedDraft
  const email = sourceData?.type === 'email' ? sourceData.content as EmailSourceContent : null
  const meeting = sourceData?.type === 'meeting' ? sourceData.content as MeetingSourceContent : null
  const intel = task.deal_intelligence

  const handleCopy = async () => {
    if (!effectiveDraft) return
    setCopying(true)
    try {
      await navigator.clipboard.writeText(effectiveDraft)
      toast.success('Copied')
      onApproveCopy?.(task, effectiveDraft)
    } finally {
      setCopying(false)
    }
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 bg-slate-50">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded text-slate-500 hover:text-slate-700 hover:bg-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xs font-semibold text-slate-900 truncate">
            {task.title}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-500">
              <Building2 className="h-3 w-3" />
              {intel?.company_name || 'Unknown'}
            </span>
            {task.source === 'email' && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600">
                <Mail className="h-3 w-3" />
                Email
              </span>
            )}
            {task.source === 'meeting' && (
              <span className="inline-flex items-center gap-0.5 text-[10px] text-purple-600">
                <Video className="h-3 w-3" />
                Meeting
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-blue-thin">
        {sourceLoading ? (
          <div className="flex items-center justify-center py-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span className="text-[11px]">Loading...</span>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {email && <EmailThreadSection email={email} />}
            {meeting && <MeetingTranscriptSection meeting={meeting} />}
            {intel && (intel.last_objection || intel.competitor_mentioned || intel.deal_stage) && (
              <DealContextSection intel={intel} />
            )}
            <AISuggestionSection
              task={task}
              draft={effectiveDraft}
              isEditing={isEditing}
              onDraftChange={setDraft}
            />
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2.5 bg-slate-50 border-t border-slate-200">
        <button
          type="button"
          onClick={() => task?.id && sendEmailMutation.mutate(task.id)}
          disabled={!effectiveDraft || sendEmailMutation.isPending || task?.status === 'done'}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[10px] font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sendEmailMutation.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Send className="h-3 w-3" />
          )}
          {task?.status === 'done' ? 'Sent' : 'Send'}
        </button>
        
        <button
          type="button"
          onClick={handleCopy}
          disabled={!effectiveDraft || copying}
          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-medium bg-white border border-slate-300 text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {copying ? <Loader2 className="h-3 w-3 animate-spin" /> : <Copy className="h-3 w-3" />}
          Copy
        </button>

        <button
          type="button"
          onClick={() => setIsEditing(!isEditing)}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1.5 rounded text-[10px] font-medium",
            isEditing 
              ? "bg-emerald-600 text-white hover:bg-emerald-700"
              : "bg-white border border-slate-300 text-slate-600 hover:bg-slate-50"
          )}
        >
          <Pencil className="h-3 w-3" />
          {isEditing ? 'Save' : 'Edit'}
        </button>
      </div>
    </div>
  )
}

function EmailThreadSection({ email }: { email: EmailSourceContent }) {
  const [expanded, setExpanded] = useState(true)
  
  return (
    <div className="bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
            <Mail className="h-3.5 w-3.5 text-blue-600" />
          </div>
          <div className="text-left">
            <h3 className="text-[11px] font-semibold text-slate-900">Email</h3>
            <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{email.subject}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      
      {expanded && (
        <div className="px-3 pb-3">
          <div className="grid grid-cols-2 gap-2 mb-2 p-2.5 bg-slate-50 rounded text-[10px]">
            <div>
              <p className="text-slate-400 mb-0.5">From</p>
              <p className="font-medium text-slate-700 break-all">{email.from}</p>
            </div>
            <div>
              <p className="text-slate-400 mb-0.5">To</p>
              <p className="text-slate-600 break-all">{email.to}</p>
            </div>
            {email.date && (
              <div className="col-span-2">
                <p className="text-slate-400 mb-0.5">Date</p>
                <p className="text-slate-600 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(email.date).toLocaleString()}
                </p>
              </div>
            )}
          </div>
          <div className="border-l-3 border-blue-200 pl-2.5">
            <p className="text-[10px] text-slate-600 whitespace-pre-wrap leading-relaxed break-words">
              {email.body || email.snippet || 'No content'}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

function MeetingTranscriptSection({ meeting }: { meeting: MeetingSourceContent }) {
  const [expanded, setExpanded] = useState(true)
  
  return (
    <div className="bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-purple-100 flex items-center justify-center">
            <Video className="h-3.5 w-3.5 text-purple-600" />
          </div>
          <div className="text-left">
            <h3 className="text-[11px] font-semibold text-slate-900">Meeting</h3>
            <p className="text-[10px] text-slate-500 truncate max-w-[180px]">{meeting.title}</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      
      {expanded && (
        <div className="px-3 pb-3">
          <div className="flex flex-wrap gap-3 mb-2 p-2.5 bg-slate-50 rounded text-[10px]">
            {meeting.created_at && (
              <div>
                <p className="text-slate-400 mb-0.5">Date</p>
                <p className="text-slate-600 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {new Date(meeting.created_at).toLocaleDateString()}
                </p>
              </div>
            )}
            {meeting.platform && (
              <div>
                <p className="text-slate-400 mb-0.5">Platform</p>
                <p className="text-slate-600 capitalize">{meeting.platform.replace('_', ' ')}</p>
              </div>
            )}
          </div>

          {meeting.summary && (
            <div className="mb-2">
              <h4 className="text-[9px] font-semibold text-slate-500 uppercase mb-1">Summary</h4>
              <div className="p-2.5 bg-purple-50 rounded border-l-3 border-purple-300">
                <p className="text-[10px] text-slate-600 break-words whitespace-pre-wrap">
                  {typeof meeting.summary === 'string' ? meeting.summary : JSON.stringify(meeting.summary)}
                </p>
              </div>
            </div>
          )}

          {meeting.transcript && (
            <div>
              <h4 className="text-[9px] font-semibold text-slate-500 uppercase mb-1">Transcript</h4>
              <div className="p-2.5 bg-slate-50 rounded border border-slate-200">
                <pre className="text-[10px] text-slate-600 whitespace-pre-wrap font-sans leading-relaxed break-words">
                  {typeof meeting.transcript === 'string' 
                    ? meeting.transcript 
                    : JSON.stringify(meeting.transcript, null, 2)
                  }
                </pre>
              </div>
            </div>
          )}

          {meeting.next_steps && meeting.next_steps.length > 0 && (
            <div className="mt-2">
              <h4 className="text-[9px] font-semibold text-slate-500 uppercase mb-1">Next Steps</h4>
              <ul className="space-y-1">
                {meeting.next_steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[10px] text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[9px] font-medium shrink-0">
                      {i + 1}
                    </span>
                    <span className="break-words">{typeof step === 'string' ? step : step.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function DealContextSection({ intel }: { intel: NonNullable<TodoItem['deal_intelligence']> }) {
  const [expanded, setExpanded] = useState(true)
  
  return (
    <div className="bg-white">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
            <MessageSquare className="h-3.5 w-3.5 text-amber-600" />
          </div>
          <div className="text-left">
            <h3 className="text-[11px] font-semibold text-slate-900">Deal Context</h3>
            <p className="text-[10px] text-slate-500">Signals</p>
          </div>
        </div>
        {expanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
      </button>
      
      {expanded && (
        <div className="px-3 pb-3 space-y-1.5">
          {intel.deal_stage && (
            <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-[10px]">
              <span className="text-slate-500">Stage:</span>
              <span className="font-medium text-blue-700">{intel.deal_stage}</span>
            </div>
          )}
          
          {intel.last_objection && (
            <div className="p-2 bg-amber-50 rounded border-l-3 border-amber-300">
              <p className="text-[9px] text-amber-600 font-medium mb-0.5">Objection</p>
              <p className="text-[10px] text-slate-600 break-words">{intel.last_objection}</p>
            </div>
          )}
          
          {intel.competitor_mentioned && (
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-[10px]">
              <span className="text-slate-500">Competitor:</span>
              <span className="font-medium text-red-700 break-words">{intel.competitor_mentioned}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface AISuggestionSectionProps {
  task: TodoItem
  draft: string
  isEditing: boolean
  onDraftChange: (draft: string) => void
}

function AISuggestionSection({ task, draft, isEditing, onDraftChange }: AISuggestionSectionProps) {
  const action = task.prepared_action
  
  return (
    <div className="bg-gradient-to-b from-blue-50 to-white">
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 mb-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <h3 className="text-[11px] font-semibold text-slate-900">AI Suggestion</h3>
            {action?.strategy_label && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium bg-blue-100 text-blue-700">
                {action.strategy_label}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-start gap-1.5 p-2 bg-amber-50 rounded border border-amber-200 mb-2.5">
          <AlertCircle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
          <p className="text-[9px] text-amber-700">
            <span className="font-semibold">AI Generated.</span> Review before sending.
          </p>
        </div>

        {action?.explanation && (
          <div className="mb-2">
            <p className="text-[9px] text-slate-500 mb-0.5">Why:</p>
            <p className="text-[10px] text-slate-600 italic break-words">{action.explanation}</p>
          </div>
        )}

        <div>
          <p className="text-[9px] text-slate-500 mb-1">Reply:</p>
          <textarea
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            readOnly={!isEditing}
            placeholder="AI reply..."
            rows={8}
            className={cn(
              'w-full rounded border px-2.5 py-2 text-[10px] text-slate-700 placeholder:text-slate-400 resize-y leading-relaxed break-words',
              'focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-transparent',
              isEditing 
                ? 'border-blue-300 bg-white shadow-inner' 
                : 'border-slate-200 bg-white/80'
            )}
            style={{ wordBreak: 'break-word', overflowWrap: 'break-word' }}
          />
        </div>
      </div>
    </div>
  )
}
