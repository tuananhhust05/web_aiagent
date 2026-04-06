import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { todoReadyAPI } from '@/lib/api'
import type { TodoItem, TodoTaskType, IntentCategory, TodoStatus } from '@/lib/api'
import type { ActionCardData, ActionType, SentimentBadge, TaskStatus, Channel, AlternativeOption } from './types'

// ─── Mapping helpers ──────────────────────────────────────────────────────────

function mapTaskType(tt: TodoTaskType): ActionType {
  if (tt === 'schedule_demo') return 'schedule_demo'
  if (tt === 'respond_to_email') return 'email_response'
  if (tt === 'general_followup' || tt === 'competitive_followup') return 'call_followup'
  return 'send_resources'
}

function mapIntentCategory(cat?: IntentCategory | null): SentimentBadge {
  if (!cat) return 'interested'
  if (cat === 'do_not_contact' || cat === 'non_in_target') return 'not_interested'
  return cat as SentimentBadge
}

function mapStatus(s: TodoStatus): TaskStatus {
  if (s === 'done') return 'completed'
  if (s === 'overdue') return 'overdue'
  return 'needs_review'
}

function makeDueLabel(due_at?: string | null, status?: string): string {
  if (status === 'done') return 'Completed'
  if (!due_at) return 'Due today'
  const diff = Math.round((new Date(due_at).getTime() - Date.now()) / 86400000)
  if (diff < 0) return `${Math.abs(diff)} days overdue`
  if (diff === 0) return 'Due today'
  if (diff === 1) return 'Due tomorrow'
  return `Due in ${diff} days`
}

function mapAlternativeActionType(t: string): AlternativeOption['actionType'] {
  if (t === 'make_call' || t === 'schedule_followup_call') return 'call'
  if (t === 'share_case_study' || t === 'escalate_technical_validation') return 'proposal'
  if (t === 'send_email') return 'email'
  return 'email'
}

export function mapTodoItemToCard(item: TodoItem): ActionCardData {
  return {
    id: item.id,
    type: mapTaskType(item.task_type),
    title: item.title,
    prospect: item.deal_intelligence?.company_name ?? item.assignee ?? 'Unknown',
    sentiment: mapIntentCategory(item.intent_category),
    triggeredFrom: (item.triggered_from === 'Meeting' ? 'Meeting' : 'Email') as Channel,
    dueLabel: makeDueLabel(item.due_at, item.status),
    isOverdue: item.status === 'overdue',
    status: mapStatus(item.status),
    category: mapIntentCategory(item.intent_category),
    // Strategy fields
    strategicStep: item.task_strategy?.recommended_next_step_label ?? undefined,
    objective: item.task_strategy?.objective ?? undefined,
    keyTopics: item.task_strategy?.key_topics ?? undefined,
    whyThisStep: item.task_strategy?.strategic_reasoning ?? undefined,
    decisionFactors: item.task_strategy?.decision_factors
      ? item.task_strategy.decision_factors.map((f: string) => ({ label: f, value: '' }))
      : undefined,
    alternativeOptions: item.task_strategy?.alternative_actions
      ? item.task_strategy.alternative_actions.map((a) => ({
          label: a.label,
          confidence: a.confidence,
          actionType: mapAlternativeActionType(a.action_type),
        }))
      : undefined,
    // Draft + tone variants
    draftContent: item.prepared_action?.draft_text ?? '',
    toneDrafts: item.prepared_action?.tone_drafts
      ? {
          Professional: item.prepared_action.tone_drafts.professional ?? undefined,
          Friendly: item.prepared_action.tone_drafts.warm ?? undefined,  // backend "warm" → UI "Friendly"
          Direct: item.prepared_action.tone_drafts.direct ?? undefined,
        }
      : undefined,
    // Created at (for inbox-arrival ordering)
    createdAt: item.created_at ? new Date(item.created_at).toISOString() : undefined,
    // Interaction
    interactionSummary: item.interaction_summary ?? undefined,
    interactionHistory: (item.interaction_history ?? []).map((h) => ({
      type: h.type as 'email' | 'call' | 'meeting',
      timeAgo: h.time_ago,
      summary: h.summary,
    })),
    // Neuroscience
    neurosciencePrinciples: item.neuroscience_principles
      ? item.neuroscience_principles.map((p) => ({
          title: p.title,
          explanation: p.explanation,
          highlightedPhrase: p.highlighted_phrase,
        }))
      : undefined,
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export const TODO_READY_QUERY_KEY = ['todo-ready', 'items'] as const

export function useRealActions() {
  const queryClient = useQueryClient()

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: TODO_READY_QUERY_KEY,
    queryFn: () => todoReadyAPI.listItems().then((r) => r.data),
    staleTime: 60 * 1000, // 1 minute
  })

  const actions: ActionCardData[] = (data?.items ?? []).map(mapTodoItemToCard)
  // Debug: log the raw API response and mapped actions
  if (process.env.NODE_ENV === 'development') {
    console.log('[useRealActions] raw items:', data?.items?.length ?? 0, 'mapped actions:', actions.length)
    if (data?.items?.length) {
      console.log('[useRealActions] first item status:', data.items[0]?.status, 'due_at:', data.items[0]?.due_at)
    }
  }

  const { mutate: completeItem } = useMutation({
    mutationFn: (id: string) => todoReadyAPI.completeItem(id).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TODO_READY_QUERY_KEY })
    },
  })

  return {
    actions,
    isLoading,
    error,
    refetch,
    completeItem,
  }
}
