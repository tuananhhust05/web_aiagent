import { useMemo, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  ClipboardList,
  Filter,
  RefreshCw,
  Calendar,
  Inbox,
  AlertCircle,
  Clock,
  CheckCircle2,
  Settings,
  Plus,
  Tag,
} from 'lucide-react'
import {
  todoReadyAPI,
  gmailAPI,
  type MemorySignal,
  type TodoListResponse,
  type MemorySignalsResponse,
  type IntentCategory,
} from '../lib/api'
import { useToDoStore, type TodoViewTab, type TodoCategoryFilter, type DateRangeOption } from '../stores/useToDoStore'
import { toast } from 'react-hot-toast'
import MemorySignalsBar from '../components/atlas/MemorySignalsBar'
import TaskFeed from '../components/atlas/TaskFeed'
import ReplyLab from '../components/atlas/ReplyLab'
import StrategyPanel from '../components/atlas/StrategyPanel'
import PasteEmailModal from '../components/atlas/PasteEmailModal'
import CustomDateRangePopover from '../components/atlas/CustomDateRangePopover'
import GmailConnectPrompt from '../components/atlas/GmailConnectPrompt'

const DATE_RANGE_OPTIONS: { id: DateRangeOption; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'custom', label: 'Custom' },
]

const VIEW_TABS: { id: TodoViewTab; label: string; icon: typeof Inbox }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'needs_input', label: 'Needs Input', icon: AlertCircle },
  { id: 'overdue', label: 'Overdue', icon: Clock },
  { id: 'completed', label: 'Complete', icon: CheckCircle2 },
]

const INTENT_CATEGORIES: { id: TodoCategoryFilter; label: string; color: string }[] = [
  { id: 'all', label: 'All', color: 'bg-sky-100 text-sky-700' },
  { id: 'no_categories', label: 'No categories', color: 'bg-slate-100 text-slate-600' },
  { id: 'interested', label: 'Interested', color: 'bg-emerald-100 text-emerald-700' },
  { id: 'not_interested', label: 'Not interested', color: 'bg-amber-100 text-amber-700' },
  { id: 'do_not_contact', label: 'Do not contact', color: 'bg-red-100 text-red-700' },
  { id: 'not_now', label: 'Not now', color: 'bg-sky-100 text-sky-600' },
  { id: 'forwarded', label: 'Forwarded', color: 'bg-violet-100 text-violet-700' },
  { id: 'meeting_intent', label: 'Meeting intent', color: 'bg-violet-200 text-violet-800' },
  { id: 'non_in_target', label: 'Non in target', color: 'bg-pink-100 text-pink-700' },
]

/** PRD: Commercial interpretation, should trigger, priority (for tooltips) */
const INTENT_CATEGORY_PRD: Record<string, { interpretation: string; shouldTrigger: string; priority: string }> = {
  interested: {
    interpretation: 'High intent. Prospect shows positive buying signal (e.g. "This looks interesting", "Send more info", "Let\'s explore").',
    shouldTrigger: 'Recommended next step, follow-up within 24h, possibly suggest demo.',
    priority: 'Medium–High',
  },
  not_interested: {
    interpretation: 'Low intent. Clear rejection ("Not looking", "No budget"). Closed-lost (soft).',
    shouldTrigger: 'Remove from active queue; possibly trigger nurture flow.',
    priority: 'Low',
  },
  do_not_contact: {
    interpretation: 'Hard opt-out. "Stop contacting me", unsubscribe. Compliance state.',
    shouldTrigger: 'Block future suggestions, prevent automation, disable execution.',
    priority: 'None (hard stop)',
  },
  not_now: {
    interpretation: 'Interest exists but timing mismatch ("Reach out next quarter", "Ping me in 2 months").',
    shouldTrigger: 'Create future reminder, scheduled follow-up; remove from current urgency.',
    priority: 'Scheduled',
  },
  forwarded: {
    interpretation: 'Prospect passed message to another stakeholder. Buying committee expansion.',
    shouldTrigger: 'Multi-thread tracking; follow-up to new contact.',
    priority: 'Strategic',
  },
  meeting_intent: {
    interpretation: 'Explicit request for meeting or demo. High buying intent.',
    shouldTrigger: 'Suggest calendar link, specific slots; fast execution mode.',
    priority: 'High',
  },
  non_in_target: {
    interpretation: 'Contact outside ICP (wrong industry, size, geography).',
    shouldTrigger: 'Lower priority; suggest re-route to partner or disqualify.',
    priority: 'None',
  },
}

export default function ToDoReadyPage() {
  const queryClient = useQueryClient()
  const {
    selectedTaskId,
    activeTab,
    categoryFilter,
    dateRange,
    customDateFrom,
    customDateTo,
    setSelectedTaskId,
    setActiveTab,
    setCategoryFilter,
    setDateRange,
    setCustomDates,
    filters,
    setFilters,
  } = useToDoStore()

  const [pasteModalOpen, setPasteModalOpen] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false)
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'meeting'>('all')
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false)
  const [customDatePopoverOpen, setCustomDatePopoverOpen] = useState(false)
  /** Task ID for which user clicked "Suggest Script" — then we show execution (ReplyLab) below strategy. */
  const [scriptGeneratedForTaskId, setScriptGeneratedForTaskId] = useState<string | null>(null)

  // Gmail connection status
  const {
    data: gmailStatus,
    isLoading: gmailStatusLoading,
    refetch: refetchGmailStatus,
  } = useQuery({
    queryKey: ['gmail', 'status'],
    queryFn: () => gmailAPI.getStatus().then((r) => r.data),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  })

  const [reauthorizing, setReauthorizing] = useState(false)

  const handleGmailReauthorize = async () => {
    setReauthorizing(true)
    try {
      const res = await gmailAPI.getReauthorizeUrl()
      window.location.href = res.data.auth_url
    } catch (err) {
      toast.error('Failed to get authorization URL')
      setReauthorizing(false)
    }
  }

  const gmailConnected = gmailStatus?.configured && gmailStatus?.has_gmail_scope && !gmailStatus?.needs_reauthorization

  // Handle gmail_connected query param from OAuth callback
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const gmailParam = searchParams.get('gmail_connected')
    if (gmailParam === 'success') {
      queryClient.invalidateQueries({ queryKey: ['gmail', 'status'] })
      refetchGmailStatus()
      toast.success('Gmail connected successfully. You can now use email intelligence.')
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('gmail_connected')
        return next
      }, { replace: true })
    } else if (gmailParam === 'error') {
      toast.error('Gmail connection failed. Please try again.')
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev)
        next.delete('gmail_connected')
        return next
      }, { replace: true })
    }
  }, [])

  // Auto-analyze on page load when Gmail is connected
  const analyzeMutation = useMutation({
    mutationFn: () => todoReadyAPI.analyze().then((r) => r.data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'memory-signals'] })
      if (data.new_todos_created > 0) {
        toast.success(`Created ${data.new_todos_created} new tasks from ${data.emails_analyzed} emails and ${data.meetings_analyzed} meetings`)
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Analysis failed')
    },
  })

  // Auto-analyze on page load when Gmail is connected. Backend only fetches 10 latest emails + 10 latest meetings
  // and skips items already in analyzed_email_ids / analyzed_meeting_ids.
  useEffect(() => {
    if (gmailConnected && !analyzeMutation.isPending) {
      analyzeMutation.mutate()
    }
  }, [gmailConnected])

  // Fetch todo items (all statuses; filter by view + category in UI)
  const {
    data: todoData,
    isLoading: todoLoading,
    error: todoError,
  } = useQuery<TodoListResponse>({
    queryKey: ['todo-ready', 'items'],
    queryFn: () => todoReadyAPI.listItems({ limit: 100 }).then((r) => r.data),
    staleTime: 60 * 1000,
  })

  // Fetch memory signals
  const { data: memorySignalsData } = useQuery<MemorySignalsResponse>({
    queryKey: ['todo-ready', 'memory-signals'],
    queryFn: () => todoReadyAPI.getMemorySignals().then((r) => r.data),
    staleTime: 2 * 60 * 1000,
  })

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (taskId: string) => todoReadyAPI.completeItem(taskId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'memory-signals'] })
      setSelectedTaskId(null)
      toast.success('Marked as done')
    },
    onError: () => toast.error('Failed to update'),
  })

  // Mark task as reviewed when user opens it (ReplyLab / detail) — once per selection (effect moved below selectedTask)
  const markReviewedMutation = useMutation({
    mutationFn: (taskId: string) =>
      todoReadyAPI.updateItem(taskId, { reviewed_at: new Date().toISOString() }).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
    },
  })
  const lastMarkedReviewedId = useRef<string | null>(null)

  // When user opens an item: ensure intent + strategy are filled (backend runs analysis if incomplete)
  const ensureAnalyzedMutation = useMutation({
    mutationFn: (itemId: string) => todoReadyAPI.ensureAnalyzed(itemId).then((r) => r.data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['todo-ready', 'item', updated.id], updated)
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
    },
  })
  const lastEnsuredId = useRef<string | null>(null)

  // Escape key to deselect task
  useEffect(() => {
    if (!selectedTaskId) return
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedTaskId(null)
    }
    window.addEventListener('keydown', onEscape)
    return () => window.removeEventListener('keydown', onEscape)
  }, [selectedTaskId, setSelectedTaskId])

  const tasks = todoData?.items ?? []

  // Filter by view: Inbox = all non-done; Needs Input / Overdue / Complete = by status
  const displayTasks = useMemo(() => {
    let list = tasks
    // View filter (status)
    if (activeTab === 'inbox') {
      list = list.filter((t) => t.status !== 'done')
    } else if (activeTab === 'needs_input') {
      list = list.filter((t) => t.status === 'needs_input')
    } else if (activeTab === 'overdue') {
      list = list.filter((t) => t.status === 'overdue')
    } else if (activeTab === 'completed') {
      list = list.filter((t) => t.status === 'done')
    }
    // Category filter
    if (categoryFilter === 'all') {
      // keep all
    } else if (categoryFilter === 'no_categories') {
      list = list.filter((t) => !t.intent_category)
    } else {
      list = list.filter((t) => t.intent_category === categoryFilter)
    }
    // Channel filter (All channels dropdown)
    if (channelFilter === 'email') {
      list = list.filter((t) => String(t.source ?? '').toLowerCase() === 'email')
    } else if (channelFilter === 'meeting') {
      list = list.filter((t) => String(t.source ?? '').toLowerCase() === 'meeting')
    }
    // Prospect filter
    if (filters.prospect) {
      list = list.filter(
        (t) => t.deal_intelligence?.company_name?.toLowerCase() === filters.prospect?.toLowerCase()
      )
    }
    return list
  }, [tasks, activeTab, categoryFilter, channelFilter, filters.prospect])

  // Counts: Inbox = chưa review (non-done); others by status
  const tabCounts = useMemo(
    () => ({
      inbox: tasks.filter((t) => t.status !== 'done' && !t.reviewed_at).length,
      needs_input: tasks.filter((t) => t.status === 'needs_input').length,
      overdue: tasks.filter((t) => t.status === 'overdue').length,
      completed: tasks.filter((t) => t.status === 'done').length,
    }),
    [tasks]
  )
  const nonDoneTasks = useMemo(() => tasks.filter((t) => t.status !== 'done'), [tasks])
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: nonDoneTasks.length }
    counts['no_categories'] = nonDoneTasks.filter((t) => !t.intent_category).length
    ;(['interested', 'not_interested', 'do_not_contact', 'not_now', 'forwarded', 'meeting_intent', 'non_in_target'] as IntentCategory[]).forEach(
      (cat) => {
        counts[cat] = nonDoneTasks.filter((t) => t.intent_category === cat).length
      }
    )
    return counts
  }, [nonDoneTasks])
  
  // Fetch selected task separately if not in current list
  const { data: fetchedSelectedTask } = useQuery({
    queryKey: ['todo-ready', 'item', selectedTaskId],
    queryFn: () => selectedTaskId ? todoReadyAPI.getItem(selectedTaskId).then(r => r.data) : null,
    enabled: !!selectedTaskId && !tasks.find(t => t.id === selectedTaskId),
    staleTime: 30 * 1000,
  })
  
  // Find selected task - from current list or fetched separately
  const selectedTask = useMemo(
    () => {
      if (!selectedTaskId) return null
      const fromList = tasks.find((t) => t.id === selectedTaskId)
      if (fromList) return fromList
      return fetchedSelectedTask ?? null
    },
    [tasks, selectedTaskId, fetchedSelectedTask]
  )

  // When opening item: run ensure-analyzed if intent or strategy is missing (backend fills them)
  useEffect(() => {
    if (!selectedTaskId || !selectedTask) return
    if (lastEnsuredId.current === selectedTaskId) return
    const needsIntent =
      (selectedTask.source === 'email' || selectedTask.source === 'meeting') && !selectedTask.intent_category
    const needsStrategy =
      !selectedTask.task_strategy ||
      (typeof selectedTask.task_strategy === 'object' &&
        !selectedTask.task_strategy.recommended_next_step_type)
    if (needsIntent || needsStrategy) {
      lastEnsuredId.current = selectedTaskId
      ensureAnalyzedMutation.mutate(selectedTaskId)
    }
  }, [selectedTaskId, selectedTask?.id, selectedTask?.intent_category, selectedTask?.task_strategy])
  useEffect(() => {
    if (!selectedTaskId) lastEnsuredId.current = null
  }, [selectedTaskId])

  // Mark as reviewed when user opens a task (after selectedTask is defined)
  useEffect(() => {
    if (!selectedTaskId || !selectedTask) return
    if (selectedTask.reviewed_at) return
    if (lastMarkedReviewedId.current === selectedTaskId) return
    lastMarkedReviewedId.current = selectedTaskId
    markReviewedMutation.mutate(selectedTaskId)
  }, [selectedTaskId, selectedTask?.id, selectedTask?.reviewed_at])
  useEffect(() => {
    if (!selectedTaskId) lastMarkedReviewedId.current = null
  }, [selectedTaskId])

  // Show execution panel when task already has a draft (existing/pasted task)
  useEffect(() => {
    if (!selectedTaskId) return
    if (selectedTask?.prepared_action?.draft_text) {
      setScriptGeneratedForTaskId((prev) => (prev === selectedTaskId ? prev : selectedTaskId))
    } else {
      setScriptGeneratedForTaskId((prev) => (prev === selectedTaskId ? null : prev))
    }
  }, [selectedTaskId, selectedTask?.id, selectedTask?.prepared_action?.draft_text])

  // Convert API memory signals to component format
  const memorySignals: MemorySignal[] = useMemo(() => {
    return memorySignalsData?.signals ?? []
  }, [memorySignalsData])

  const handlePasteSubmit = async (data: {
    company: string
    contact: string
    deal: string
    direction: 'prospect' | 'sales'
    text: string
    date: string
  }) => {
    try {
      const res = await todoReadyAPI.createItem({
        title: `Reply to ${data.contact} at ${data.company}`,
        description: data.text.slice(0, 500),
        task_type: 'respond_to_email',
        source: 'manual',
        deal_intelligence: {
          company_name: data.company,
        },
        prepared_action: {
          strategy_label: 'Manual Email Response',
          explanation: 'Email pasted manually for follow-up',
          draft_text: `Thank you for your message. I'll review and respond shortly.`,
        },
      })
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
      if (res?.data?.id) setSelectedTaskId(res.data.id)
      toast.success('Email added. Task will appear in the list.')
    } catch (e) {
      const msg =
        (e as { response?: { status?: number } })?.response?.status === 404
          ? 'API endpoint is not available.'
          : (e instanceof Error ? e.message : 'Failed to submit.')
      throw new Error(msg)
    }
  }

  // Get unique company names for filter dropdown
  const companyNames = useMemo(() => {
    const names = new Set<string>()
    tasks.forEach((t) => {
      const name = t.deal_intelligence?.company_name
      if (name) names.add(name)
    })
    return Array.from(names)
  }, [tasks])

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Page Header - Compact */}
      <header className="shrink-0 bg-white border-b border-slate-200">
        <div className="px-3 lg:px-4 py-2">
          <div className="flex items-center justify-between gap-3">
            {/* Title section */}
            <div className="min-w-0">
              <h1 className="text-sm font-semibold text-slate-900">Action Ready</h1>
              <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">
                AI-prepared next actions from calls and email intelligence
              </p>
            </div>
            
            {/* Actions section */}
            <div className="flex flex-wrap items-center gap-1.5">
              {/* Date range selector */}
              <div className="relative">
                <div className="inline-flex items-center rounded border border-slate-200 bg-white">
                  <Calendar className="h-3 w-3 text-slate-400 ml-2" />
                  {DATE_RANGE_OPTIONS.map((opt, idx) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        if (opt.id === 'custom') {
                          setCustomDatePopoverOpen(true)
                        } else {
                          setDateRange(opt.id)
                          setCustomDatePopoverOpen(false)
                        }
                      }}
                      className={`px-2 py-1 text-[10px] font-medium transition-colors ${
                        idx === 0 ? 'rounded-l' : ''
                      } ${idx === DATE_RANGE_OPTIONS.length - 1 ? 'rounded-r' : ''} ${
                        dateRange === opt.id
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {customDatePopoverOpen && (
                  <CustomDateRangePopover
                    fromDate={customDateFrom}
                    toDate={customDateTo}
                    onApply={(from, to) => {
                      setCustomDates(from, to)
                      setDateRange('custom')
                      setCustomDatePopoverOpen(false)
                    }}
                    onClose={() => setCustomDatePopoverOpen(false)}
                  />
                )}
              </div>

              <div className="h-4 w-px bg-slate-200" />

              {/* Action buttons */}
              <button
                type="button"
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                className="inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {analyzeMutation.isPending ? (
                  <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                ) : (
                  <Sparkles className="h-3 w-3 text-blue-600" />
                )}
                Analyze New
              </button>

              <button
                type="button"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['todo-ready'] })}
                className="inline-flex items-center justify-center w-6 h-6 rounded border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                aria-label="Refresh"
              >
                <RefreshCw className="h-3 w-3" />
              </button>

              {/* Filter dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterDropdownOpen((o) => !o)}
                  className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium border ${
                    filters.prospect
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="h-3 w-3" />
                  {filters.prospect || 'Filter'}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {filterDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFilterDropdownOpen(false)} />
                    <div className="absolute right-0 mt-1 w-44 rounded border border-slate-200 bg-white py-1 shadow-lg z-20">
                      <div className="px-2 py-1 text-[9px] font-semibold text-slate-400 uppercase">
                        Filter by Company
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFilters({ prospect: undefined })
                          setFilterDropdownOpen(false)
                        }}
                        className={`w-full text-left px-2 py-1.5 text-[10px] ${
                          !filters.prospect ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        All companies
                      </button>
                      {companyNames.map((name) => (
                        <button
                          key={name}
                          type="button"
                          onClick={() => {
                            setFilters({ prospect: name })
                            setFilterDropdownOpen(false)
                          }}
                          className={`w-full text-left px-2 py-1.5 text-[10px] ${
                            filters.prospect === name ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Primary action */}
              <button
                type="button"
                onClick={() => setPasteModalOpen(true)}
                className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-blue-700"
              >
                <ClipboardList className="h-3 w-3" />
                Paste Email
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Gmail connection prompt */}
      {!gmailConnected && (
        <div className="shrink-0 bg-white border-b border-slate-200 px-3 lg:px-4 py-1.5">
          <GmailConnectPrompt
            status={gmailStatus ?? null}
            loading={gmailStatusLoading}
            onReauthorize={handleGmailReauthorize}
            onRefresh={() => refetchGmailStatus()}
            reauthorizing={reauthorizing}
          />
        </div>
      )}

      {/* Main: Left sidebar (nav + categories) | Right (Attention strip + task list or detail) */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Sidebar - All channels, Inbox/Unread/AI draft, Categories */}
        <aside className="shrink-0 w-[220px] lg:w-[240px] flex flex-col bg-white border-r border-slate-200 overflow-hidden">
          <div className="p-3 border-b border-slate-100 relative">
            <button
              type="button"
              onClick={() => setChannelDropdownOpen((o) => !o)}
              className="w-full flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50/50 px-2.5 py-2 text-[11px] text-slate-600 hover:bg-slate-100"
            >
              <span>
                {channelFilter === 'all' ? 'All channels' : channelFilter === 'email' ? 'Email' : 'Meeting'}
              </span>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform ${channelDropdownOpen ? 'rotate-180' : ''}`}
                aria-hidden
              />
            </button>
            {channelDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-[100]"
                  onClick={() => setChannelDropdownOpen(false)}
                  aria-hidden
                />
                <div
                  className="absolute top-full left-3 right-3 mt-1 z-[101] rounded-lg border border-slate-200 bg-white shadow-lg py-1 min-w-[120px]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => { setChannelFilter('all'); setChannelDropdownOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-[11px] font-medium ${channelFilter === 'all' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    All channels
                  </button>
                  <button
                    type="button"
                    onClick={() => { setChannelFilter('email'); setChannelDropdownOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-[11px] font-medium ${channelFilter === 'email' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    Email
                  </button>
                  <button
                    type="button"
                    onClick={() => { setChannelFilter('meeting'); setChannelDropdownOpen(false) }}
                    className={`w-full text-left px-3 py-2 text-[11px] font-medium ${channelFilter === 'meeting' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    Meeting
                  </button>
                </div>
              </>
            )}
          </div>
          <nav className="p-2 space-y-0.5" aria-label="View">
            {VIEW_TABS.map((tab) => {
              const Icon = tab.icon
              const count = tabCounts[tab.id]
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium transition-colors ${
                    isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  {tab.label}
                  {count > 0 && (
                    <span className={`ml-auto min-w-[18px] h-[18px] flex items-center justify-center rounded-full text-[10px] ${
                      isActive ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </nav>
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col border-t border-slate-100">
            <button
              type="button"
              onClick={() => setCategoriesCollapsed((c) => !c)}
              className="flex items-center justify-between w-full px-3 py-2 text-left hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <Tag className="h-3.5 w-3.5 text-slate-500" />
                <span className="text-[11px] font-semibold text-slate-700">Categories</span>
                <Settings className="h-3 w-3 text-slate-400" />
                <Plus className="h-3 w-3 text-slate-400" />
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-400 transition-transform ${categoriesCollapsed ? '' : 'rotate-180'}`}
                aria-hidden
              />
            </button>
            {!categoriesCollapsed && (
              <div className="flex-1 overflow-y-auto scrollbar-blue-thin px-2 pt-2 pb-2 space-y-0.5 mt-1">
                {INTENT_CATEGORIES.map((cat) => {
                  const count = categoryCounts[cat.id] ?? 0
                  const isActive = categoryFilter === cat.id
                  const prd = cat.id !== 'all' && cat.id !== 'no_categories' ? INTENT_CATEGORY_PRD[cat.id] : null
                  const tooltip = prd
                    ? `${prd.interpretation} Should: ${prd.shouldTrigger} Priority: ${prd.priority}`
                    : undefined
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      title={tooltip}
                      onClick={() => setCategoryFilter(cat.id)}
                      className={`w-full flex items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-medium transition-colors ${
                        isActive ? 'ring-1 ring-slate-300 bg-slate-50 ' + cat.color : cat.color + ' hover:opacity-90'
                      }`}
                    >
                      <Tag className="h-3.5 w-3.5 shrink-0 opacity-70" />
                      <span className="flex-1 truncate">{cat.label}</span>
                      {count > 0 && <span className="text-[10px] opacity-80">{count}</span>}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </aside>

        {/* Right Main - Attention Required strip + Task list or Detail */}
        <div className="flex-1 min-w-0 min-h-0 flex flex-col bg-slate-50 overflow-hidden">
          {/* Attention Required strip */}
          {memorySignals.length > 0 && (
            <div className="shrink-0 bg-white border-b border-slate-200">
              <MemorySignalsBar
                signals={memorySignals}
                onSelectTask={(taskId) => {
                  setActiveTab('inbox')
                  setSelectedTaskId(taskId)
                }}
              />
            </div>
          )}

          {/* Task list or Detail */}
          {!selectedTaskId ? (
            <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto scrollbar-blue-thin p-4">
                <TaskFeed
                  key={`feed-${channelFilter}`}
                  tasks={displayTasks}
                  activeTab={activeTab}
                  loading={todoLoading}
                  onOpenTask={(task) => setSelectedTaskId(task.id)}
                  onMarkDone={(task) => completeMutation.mutate(task.id)}
                  onRegenerate={(task) => {
                    setSelectedTaskId(task.id)
                    toast('Regenerate draft will be available when the AI is connected.')
                  }}
                  onSnooze={() => toast('Snooze will be available in a future update.')}
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 overflow-y-auto bg-slate-100 p-3 lg:p-4 scrollbar-blue-thin">
              <div className="flex flex-col gap-3">
                {/* Strategic next step: hiển thị full, không scroll */}
                <div className="shrink-0 rounded-lg bg-white border border-slate-200 shadow-sm overflow-visible">
                  <StrategyPanel
                    key={`strategy-${selectedTask?.id ?? 'empty'}`}
                    task={selectedTask}
                    onTaskUpdated={(updated) => {
                      queryClient.setQueryData(['todo-ready', 'item', updated.id], updated)
                      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
                    }}
                    onSuggestScriptDone={() => selectedTask?.id && setScriptGeneratedForTaskId(selectedTask.id)}
                    onBack={() => {
                      setSelectedTaskId(null)
                      setScriptGeneratedForTaskId(null)
                    }}
                    showExecution={scriptGeneratedForTaskId === selectedTaskId}
                    onShowExecution={() => selectedTask?.id && setScriptGeneratedForTaskId(selectedTask.id)}
                  />
                </div>
                {/* Box chi tiết task: hiển thị full, scroll cùng với Strategy */}
                {scriptGeneratedForTaskId === selectedTaskId && selectedTask && (
                  <div className="rounded-lg bg-white border border-slate-200 shadow-sm">
                    <ReplyLab
                      key={selectedTask.id}
                      task={selectedTask}
                      onApproveCopy={() => toast.success('Copied to clipboard')}
                      onTaskSent={() => {
                        setSelectedTaskId(null)
                        setScriptGeneratedForTaskId(null)
                      }}
                      onBack={() => setSelectedTaskId(null)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile drawer: Strategy + Execution (same flow as desktop) */}
      {selectedTaskId && (
        <div
          className="md:hidden fixed inset-0 z-40 flex flex-col bg-white"
          role="dialog"
          aria-label="Task detail"
        >
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => { setSelectedTaskId(null); setScriptGeneratedForTaskId(null) }}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              aria-label="Back to list"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
            <span className="text-base font-semibold text-slate-900">Task</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-100 p-3 flex flex-col gap-3">
            <div className="shrink-0 rounded-lg bg-white border border-slate-200 overflow-hidden">
              <StrategyPanel
                key={`strategy-mob-${selectedTask?.id ?? 'empty'}`}
                task={selectedTask}
                onTaskUpdated={(updated) => {
                  queryClient.setQueryData(['todo-ready', 'item', updated.id], updated)
                  queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
                }}
                onSuggestScriptDone={() => selectedTask?.id && setScriptGeneratedForTaskId(selectedTask.id)}
                onShowExecution={() => selectedTask?.id && setScriptGeneratedForTaskId(selectedTask.id)}
              />
            </div>
            {scriptGeneratedForTaskId === selectedTaskId && selectedTask && (
              <div className="shrink-0 rounded-lg bg-white border border-slate-200 overflow-hidden">
                <ReplyLab
                  key={selectedTask.id}
                  task={selectedTask}
                  onApproveCopy={() => toast.success('Copied')}
                  onTaskSent={() => { setSelectedTaskId(null); setScriptGeneratedForTaskId(null) }}
                  onBack={() => setSelectedTaskId(null)}
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error state */}
      {todoError && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Failed to load tasks</p>
              <p className="text-sm text-red-600 mt-1">
                {todoError instanceof Error ? todoError.message : 'Please try again'}
              </p>
            </div>
          </div>
        </div>
      )}

      <PasteEmailModal
        open={pasteModalOpen}
        onClose={() => setPasteModalOpen(false)}
        onSubmit={handlePasteSubmit}
      />
    </div>
  )
}
