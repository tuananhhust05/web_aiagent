import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Target,
  ListChecks,
  Lightbulb,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  Loader2,
  Phone,
  Mail,
  Share2,
  ArrowUpRight,
  Calendar,
} from 'lucide-react'
import type { TodoItem, TaskStrategy, AlternativeAction } from '../../lib/api'
import { todoReadyAPI } from '../../lib/api'
import { cn } from '../../lib/utils'
import { toast } from 'react-hot-toast'

const NEXT_STEP_LABELS: Record<string, string> = {
  send_email: 'Send email',
  make_call: 'Make call',
  share_case_study: 'Share case study',
  escalate_technical_validation: 'Escalate to technical validation',
  schedule_followup_call: 'Schedule follow-up call',
}

const NEXT_STEP_ICONS: Record<string, typeof Mail> = {
  send_email: Mail,
  make_call: Phone,
  share_case_study: Share2,
  escalate_technical_validation: ArrowUpRight,
  schedule_followup_call: Calendar,
}

export interface StrategyPanelProps {
  task: TodoItem | null
  onTaskUpdated?: (task: TodoItem) => void
  onSuggestScriptDone?: (task: TodoItem) => void
  onBack?: () => void
  /** When true, show execution (draft) section below strategy (after Suggest Script clicked). */
  showExecution?: boolean
  onShowExecution?: () => void
}

export default function StrategyPanel({
  task,
  onTaskUpdated,
  onSuggestScriptDone,
  onBack,
  showExecution: _showExecution,
  onShowExecution,
}: StrategyPanelProps) {
  const queryClient = useQueryClient()
  const [otherOptionsOpen, setOtherOptionsOpen] = useState(false)

  const generateStrategyMutation = useMutation({
    mutationFn: (itemId: string) => todoReadyAPI.generateStrategy(itemId).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'item', updated.id] })
      onTaskUpdated?.(updated)
      toast.success('Strategy generated')
    },
    onError: () => toast.error('Failed to generate strategy'),
  })

  const suggestScriptMutation = useMutation({
    mutationFn: (itemId: string) => todoReadyAPI.suggestScript(itemId).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'item', updated.id] })
      onTaskUpdated?.(updated)
      onSuggestScriptDone?.(updated)
      toast.success('Script generated')
      onShowExecution?.()
    },
    onError: () => toast.error('Failed to generate script'),
  })

  if (!task) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center px-6 bg-white rounded-lg border border-slate-200">
        <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center mb-4">
          <Target className="h-7 w-7 text-slate-300" />
        </div>
        <h3 className="text-sm font-semibold text-slate-700 mb-1">No task selected</h3>
        <p className="text-[11px] text-slate-500 max-w-[220px]">
          Select a task to see recommended next step, objective, and key topics
        </p>
      </div>
    )
  }

  const strategy: TaskStrategy | null = task.task_strategy ?? null
  const hasStrategy = !!strategy && (!!strategy.objective || !!strategy.key_topics?.length || !!strategy.strategic_reasoning)
  const isEmailStep = strategy?.recommended_next_step_type === 'send_email'
  const loadingStrategy = generateStrategyMutation.isPending
  const loadingScript = suggestScriptMutation.isPending

  return (
    <div className="flex flex-col bg-white rounded-lg border border-slate-200 shadow-sm overflow-visible">
      {/* Header */}
      <div className="shrink-0 flex items-center gap-2 px-3 py-2 sm:py-2.5 border-b border-slate-100 bg-slate-50/80">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/80"
            aria-label="Back"
          >
            <ChevronDown className="h-4 w-4 rotate-90" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h2 className="text-xs font-semibold text-slate-800 truncate">Strategic next step</h2>
          <p className="text-[10px] text-slate-500 truncate">{task.deal_intelligence?.company_name ?? task.title}</p>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4 overflow-visible">
        {!hasStrategy && !loadingStrategy && (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 sm:p-6 text-center">
            <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-slate-300 mx-auto mb-2 sm:mb-3" />
            <p className="text-xs sm:text-sm text-slate-600 mb-3 sm:mb-4">Generate recommended next step, objective, and key topics</p>
            <button
              type="button"
              onClick={() => task.id && generateStrategyMutation.mutate(task.id)}
              disabled={loadingStrategy}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
            >
              {loadingStrategy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Generate strategy
            </button>
          </div>
        )}

        {loadingStrategy && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        )}

        {hasStrategy && strategy && (
          <>
            {/* Recommended Next Step */}
            <section>
              <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Recommended next step
              </h3>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-100">
                {(() => {
                  const Icon = NEXT_STEP_ICONS[strategy.recommended_next_step_type] ?? Mail
                  return <Icon className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                })()}
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    {strategy.recommended_next_step_label ?? NEXT_STEP_LABELS[strategy.recommended_next_step_type] ?? strategy.recommended_next_step_type}
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {NEXT_STEP_LABELS[strategy.recommended_next_step_type] ?? strategy.recommended_next_step_type}
                  </p>
                </div>
              </div>
            </section>

            {/* Objective */}
            {strategy.objective && (
              <section>
                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Target className="h-3 w-3" /> Objective
                </h3>
                <p className="text-sm text-slate-800 bg-amber-50/80 border border-amber-100 rounded-lg px-3 py-2">
                  {strategy.objective}
                </p>
              </section>
            )}

            {/* Key Topics */}
            {strategy.key_topics && strategy.key_topics.length > 0 && (
              <section>
                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <ListChecks className="h-3 w-3" /> Key topics
                </h3>
                <ul className="space-y-1.5">
                  {strategy.key_topics.map((topic, i) => (
                    <li
                      key={i}
                      className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 rounded-lg px-3 py-2 border border-slate-100"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-200 text-[10px] font-medium text-slate-600">
                        {i + 1}
                      </span>
                      {topic}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {/* Why / Strategic reasoning */}
            {strategy.strategic_reasoning && (
              <section>
                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Lightbulb className="h-3 w-3" /> Why this step
                </h3>
                <p className="text-sm text-slate-700 italic bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                  {strategy.strategic_reasoning}
                </p>
              </section>
            )}

            {/* Decision factors */}
            {strategy.decision_factors && strategy.decision_factors.length > 0 && (
              <section>
                <h3 className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Decision factors
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {strategy.decision_factors.map((f, i) => (
                    <span
                      key={i}
                      className="inline-flex px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Suggest Script (when next step is send email) */}
            {isEmailStep && (
              <section className="pt-2">
                <button
                  type="button"
                  onClick={() => task.id && suggestScriptMutation.mutate(task.id)}
                  disabled={loadingScript}
                  className={cn(
                    'w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-colors',
                    'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50'
                  )}
                >
                  {loadingScript ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  Suggest script
                </button>
                <p className="text-[10px] text-slate-500 mt-1.5 text-center">
                  Generate draft from key topics. You can edit and send from the execution block below.
                </p>
              </section>
            )}

            {/* View Other Options */}
            {strategy.alternative_actions && strategy.alternative_actions.length > 0 && (
              <section className="border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setOtherOptionsOpen((o) => !o)}
                  className="w-full flex items-center justify-between py-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  <span>View other options</span>
                  {otherOptionsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                {otherOptionsOpen && (
                  <div className="mt-2 space-y-2 rounded-lg bg-slate-50 border border-slate-200 p-3">
                    {strategy.alternative_actions.map((alt: AlternativeAction, i: number) => (
                      <div
                        key={i}
                        className="flex items-center justify-between gap-2 py-2 px-3 rounded-lg bg-white border border-slate-100"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {(() => {
                            const Icon = NEXT_STEP_ICONS[alt.action_type] ?? Mail
                            return <Icon className="h-4 w-4 text-slate-500 shrink-0" />
                          })()}
                          <span className="text-sm text-slate-800 truncate">{alt.label}</span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 shrink-0">
                          {alt.confidence}% confidence
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
