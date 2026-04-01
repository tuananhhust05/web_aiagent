import { useMemo, useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Mail,
  Search,
  SlidersHorizontal,
  PanelLeftClose,
  PanelLeft,
  Circle,
  AlertTriangle,
} from 'lucide-react'
import {
  todoReadyAPI,
  gmailAPI,
  type TodoListResponse,
  type IntentCategory,
  type GmailStatusResponse,
} from '../lib/api'
import { useToDoStore, type TodoViewTab, type TodoCategoryFilter } from '../stores/useToDoStore'
import { toast } from 'react-hot-toast'
import ReplyLab from '../components/atlas/ReplyLab'
import StrategyPanel from '../components/atlas/StrategyPanel'
import PasteEmailModal from '../components/atlas/PasteEmailModal'

import GmailConnectPrompt from '../components/atlas/GmailConnectPrompt'
import ActionCard from '../components/atlas/action-card/ActionCard'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog'

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


export default function ToDoReadyPage() {
  const queryClient = useQueryClient()
  const {
    selectedTaskId,
    activeTab,
    categoryFilter,
    setSelectedTaskId,
    setActiveTab,
    setCategoryFilter,
    filters,
    setFilters,
  } = useToDoStore()

  const [pasteModalOpen, setPasteModalOpen] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [channelDropdownOpen, setChannelDropdownOpen] = useState(false)
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'meeting'>('all')
  const [categoriesCollapsed, setCategoriesCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
  const [showGmailPopup, setShowGmailPopup] = useState(false)

  const isGmailConnected = (s: GmailStatusResponse | null | undefined): boolean =>
    !!(s?.configured && s?.has_gmail_scope && !s?.needs_reauthorization)

  // Check Gmail connection immediately on mount — show popup dialog if not connected
  useEffect(() => {
    if (gmailStatusLoading) return
    if (!isGmailConnected(gmailStatus)) {
      setShowGmailPopup(true)
    }
  }, [gmailStatusLoading, gmailStatus])

  const revalidateGmailConnection = async () => {
    try {
      const { data } = await gmailAPI.getStatus()
      if (!isGmailConnected(data)) {
        setShowGmailPopup(true)
      }
    } catch {
      setShowGmailPopup(true)
    }
  }

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

  const gmailConnected = isGmailConnected(gmailStatus)

  // Handle gmail_connected query param from OAuth callback
  const [searchParams, setSearchParams] = useSearchParams()
  useEffect(() => {
    const gmailParam = searchParams.get('gmail_connected')
    if (gmailParam === 'success') {
      setShowGmailPopup(false)
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
      // Check if backend reported a Gmail auth/token error
      if (data.gmail_auth_error || data.needs_reauthorization) {
        toast.error('Gmail token expired. Please re-connect your Gmail account.')
        setShowGmailPopup(true)
        // Refresh gmail status so the UI reflects the disconnected state
        queryClient.invalidateQueries({ queryKey: ['gmail', 'status'] })
        return
      }
      if (data.new_todos_created > 0) {
        toast.success(`Created ${data.new_todos_created} new tasks from ${data.emails_analyzed} emails and ${data.meetings_analyzed} meetings`)
      }
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : 'Analysis failed')
      revalidateGmailConnection()
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

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: (taskId: string) => todoReadyAPI.completeItem(taskId).then((r) => r.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
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

  const OVERDUE_DAYS = 5
  const isTaskOverdue = (t: typeof tasks[number]) => {
    if (t.status === 'done') return false
    if (t.status === 'overdue') return true
    const ref = t.due_at ?? t.created_at
    if (!ref) return false
    const age = Date.now() - new Date(ref).getTime()
    return age > OVERDUE_DAYS * 24 * 60 * 60 * 1000
  }

  // Filter by view: Inbox = all non-done; Overdue = 5+ days old; Complete = done
  const displayTasks = useMemo(() => {
    let list = tasks
    if (activeTab === 'inbox') {
      list = list.filter((t) => t.status !== 'done')
    } else if (activeTab === 'needs_input') {
      list = list.filter((t) => t.status === 'needs_input')
    } else if (activeTab === 'overdue') {
      list = list.filter(isTaskOverdue)
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
    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.deal_intelligence?.company_name ?? '').toLowerCase().includes(q) ||
          (t.description ?? '').toLowerCase().includes(q) ||
          (t.interaction_summary ?? '').toLowerCase().includes(q)
      )
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
  }, [tasks, activeTab, categoryFilter, channelFilter, filters.prospect, searchQuery])

  const tabCounts = useMemo(
    () => ({
      inbox: tasks.filter((t) => t.status !== 'done' && !t.reviewed_at).length,
      needs_input: tasks.filter((t) => t.status === 'needs_input').length,
      overdue: tasks.filter(isTaskOverdue).length,
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

  const handlePasteSubmit = async (data: {
    company: string
    contact: string
    deal: string
    direction: 'prospect' | 'sales'
    text: string
    date: string
  }) => {
    try {
      let res
      try {
        res = await todoReadyAPI.ingestEmail({
          subject: `${data.direction === 'prospect' ? 'From' : 'To'} ${data.contact} at ${data.company}`,
          body: data.text,
          from: data.direction === 'prospect' ? data.contact : undefined,
          to: data.direction === 'sales' ? data.contact : undefined,
        })
      } catch {
        res = await todoReadyAPI.createItem({
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
      }
      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
      if (res?.data?.id) setSelectedTaskId(res.data.id)
      toast.success('Email ingested. AI will analyze and create an action card.')
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

  const statusFilters: { label: string; count: number; countSuffix: string; icon: JSX.Element; tab: TodoViewTab; colorClass: string }[] = [
    { label: 'Needs Review', count: tabCounts.inbox, countSuffix: ' Actions', icon: <Circle size={16} />, tab: 'inbox', colorClass: 'bg-primary/10 text-primary' },
    { label: 'Overdue', count: tabCounts.overdue, countSuffix: ' min', icon: <AlertTriangle size={16} />, tab: 'overdue', colorClass: 'bg-forskale-cyan/10 text-forskale-cyan' },
    { label: 'Completed', count: tabCounts.completed, countSuffix: ' tasks', icon: <CheckCircle2 size={16} />, tab: 'completed', colorClass: 'bg-forskale-green/10 text-forskale-green' },
  ]

  const isCompleted = activeTab === 'completed'
  const isOverdue = activeTab === 'overdue'
  const queueConfig = isOverdue
    ? { eyebrow: 'OVERDUE', title: 'Overdue tasks need quick intervention', Icon: AlertTriangle }
    : isCompleted
    ? { eyebrow: 'COMPLETED', title: 'Recently shipped actions', Icon: CheckCircle2 }
    : { eyebrow: 'EXECUTION QUEUE', title: 'One task. One action. Next card.', Icon: Circle }

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* ── Header (action-ready-main style) ── */}
      <header className="shrink-0 border-b border-border bg-card px-3 py-2.5 sm:px-5 sm:py-3.5 lg:px-6">
        <div className="flex flex-col gap-2 sm:gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] text-forskale-blue">
              Action Ready
            </span>
            <h1 className="mt-0.5 sm:mt-1 text-lg sm:text-2xl font-bold tracking-tight text-foreground">
              Execution flashcards for sales follow-up
            </h1>
            <p className="mt-0.5 sm:mt-1 max-w-xl text-[10px] sm:text-xs leading-relaxed text-muted-foreground hidden sm:block">
              Review one AI-prepared action at a time, expand the card, refine the draft, and move straight to the next task.
            </p>
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 sm:h-10 w-full sm:w-[180px] rounded-lg border border-border bg-card pl-9 pr-3 text-sm text-foreground transition-all placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
              />
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setFilterDropdownOpen((o) => !o)}
                className="inline-flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-lg border border-border bg-card px-2.5 sm:px-3.5 text-sm font-semibold text-muted-foreground transition-all hover:border-primary hover:text-foreground"
              >
                <SlidersHorizontal size={16} />
                <span className="hidden sm:inline">{filters.prospect || 'Filters'}</span>
              </button>
              {filterDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setFilterDropdownOpen(false)} />
                  <div className="absolute right-0 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg z-20">
                    <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                      Filter by Company
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFilters({ prospect: undefined }); setFilterDropdownOpen(false) }}
                      className={`w-full text-left px-3 py-2 text-sm ${!filters.prospect ? 'bg-primary/5 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}
                    >
                      All companies
                    </button>
                    {companyNames.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => { setFilters({ prospect: name }); setFilterDropdownOpen(false) }}
                        className={`w-full text-left px-3 py-2 text-sm ${filters.prospect === name ? 'bg-primary/5 text-primary font-semibold' : 'text-foreground hover:bg-muted'}`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => analyzeMutation.mutate()}
              disabled={analyzeMutation.isPending}
              className="inline-flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-lg border border-border bg-card px-2.5 sm:px-3.5 text-sm font-semibold text-muted-foreground transition-all hover:border-primary hover:text-foreground disabled:opacity-50"
            >
              {analyzeMutation.isPending ? <Loader2 size={16} className="animate-spin text-forskale-blue" /> : <Sparkles size={16} />}
              <span className="hidden sm:inline">Analyze New</span>
            </button>

            <button
              type="button"
              onClick={() => setPasteModalOpen(true)}
              className="inline-flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-3 sm:px-4 text-xs sm:text-sm font-semibold text-white shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.4)]"
            >
              <Mail size={16} />
              <span className="hidden xs:inline">Paste Email</span>
              <span className="xs:hidden">Paste</span>
            </button>
          </div>
        </div>
      </header>

      {/* ── Body: Filter Sidebar + Main Content ── */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">

        {/* ── Left Filter Sidebar (action-ready-main style) ── */}
        {sidebarCollapsed ? (
          <aside className="hidden w-[60px] shrink-0 border-r border-border bg-card lg:flex lg:flex-col lg:items-center lg:py-4">
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Expand sidebar"
            >
              <PanelLeft size={16} />
            </button>
            <div className="flex flex-col items-center gap-2.5">
              {statusFilters.map((f) => {
                const isActive = activeTab === f.tab
                return (
                  <button
                    key={f.label}
                    onClick={() => setActiveTab(f.tab)}
                    className={`relative flex h-10 w-10 items-center justify-center rounded-xl border transition-all hover:shadow-md ${
                      isActive
                        ? 'border-primary bg-gradient-to-r from-forskale-green/[0.06] to-primary/[0.06] shadow-md'
                        : 'border-border bg-card hover:border-primary'
                    }`}
                    title={`${f.label} (${f.count}${f.countSuffix})`}
                  >
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full ${f.colorClass}`}>
                      {f.icon}
                    </div>
                    {isActive && (
                      <div className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.2)]" />
                    )}
                  </button>
                )
              })}
            </div>
          </aside>
        ) : (
          <aside className="shrink-0 border-b border-border bg-card p-3 sm:p-4 lg:w-[240px] lg:border-b-0 lg:border-r lg:p-4 transition-all duration-200 lg:overflow-y-auto">
            <div className="space-y-3 sm:space-y-4 lg:sticky lg:top-0">
              <div className="hidden lg:flex lg:justify-end">
                <button
                  onClick={() => setSidebarCollapsed(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose size={16} />
                </button>
              </div>

              {/* Channel filter dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setChannelDropdownOpen((o) => !o)}
                  className="w-full flex items-center justify-between rounded-xl border border-border bg-muted/40 px-3 py-2 sm:py-2.5 text-sm text-foreground hover:bg-muted"
                >
                  <span>{channelFilter === 'all' ? 'All channels' : channelFilter === 'email' ? 'Email' : 'Meeting'}</span>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${channelDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                {channelDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-[100]" onClick={() => setChannelDropdownOpen(false)} />
                    <div className="absolute left-0 right-0 mt-1 z-[101] rounded-xl border border-border bg-card shadow-lg py-1">
                      {(['all', 'email', 'meeting'] as const).map((ch) => (
                        <button
                          key={ch}
                          type="button"
                          onClick={() => { setChannelFilter(ch); setChannelDropdownOpen(false) }}
                          className={`w-full text-left px-3 py-2 text-sm font-medium ${channelFilter === ch ? 'bg-primary/5 text-primary' : 'text-foreground hover:bg-muted'}`}
                        >
                          {ch === 'all' ? 'All channels' : ch === 'email' ? 'Email' : 'Meeting'}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Status filters — horizontal on mobile, vertical on desktop */}
              <div className="flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-x-visible lg:pb-0">
                {statusFilters.map((f) => {
                  const isActive = activeTab === f.tab
                  return (
                    <button
                      key={f.label}
                      onClick={() => setActiveTab(f.tab)}
                      className={`relative flex shrink-0 items-center gap-2 lg:gap-2.5 rounded-xl border p-2 lg:p-2.5 text-left transition-all hover:-translate-y-0.5 hover:shadow-md lg:w-full ${
                        isActive
                          ? 'border-primary bg-gradient-to-r from-forskale-green/[0.06] to-primary/[0.06] shadow-md'
                          : 'border-border bg-card hover:border-primary'
                      }`}
                    >
                      <div className={`flex h-6 w-6 lg:h-7 lg:w-7 shrink-0 items-center justify-center rounded-full ${f.colorClass}`}>
                        {f.icon}
                      </div>
                      <div className="flex flex-1 flex-col min-w-0">
                        <span className="text-xs lg:text-sm font-semibold text-foreground whitespace-nowrap">{f.label}</span>
                        <span className="text-[10px] lg:text-xs text-muted-foreground whitespace-nowrap">{f.count}{f.countSuffix}</span>
                      </div>
                      {isActive ? (
                        <div className="hidden lg:block h-2 w-2 rounded-full bg-primary shadow-[0_0_0_4px_hsl(var(--primary)/0.2)]" />
                      ) : (
                        <ChevronRight size={14} className="hidden lg:block text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      )}
                    </button>
                  )
                })}
              </div>

              {/* Categories — collapsed by default on mobile */}
              <div className="pt-1 lg:pt-2">
                <button
                  type="button"
                  onClick={() => setCategoriesCollapsed((c) => !c)}
                  className="mb-2 lg:mb-3 flex w-full items-center justify-between"
                >
                  <h3 className="text-[10px] lg:text-xs font-bold uppercase tracking-[0.1em] text-muted-foreground">Categories</h3>
                  <ChevronDown size={14} className={`text-muted-foreground transition-transform ${categoriesCollapsed ? '' : 'rotate-180'}`} />
                </button>
                {!categoriesCollapsed && (
                  <div className="flex flex-wrap gap-1.5 lg:flex-col lg:gap-2 max-h-[min(30vh,220px)] lg:max-h-[min(50vh,320px)] overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin">
                    {INTENT_CATEGORIES.map((cat) => {
                      const count = categoryCounts[cat.id] ?? 0
                      const isActive = categoryFilter === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategoryFilter(cat.id)}
                          className={`rounded-lg border px-2.5 py-1.5 lg:px-3 lg:py-2 text-[10px] lg:text-xs font-semibold transition-all ${
                            isActive
                              ? 'border-foreground bg-foreground text-card'
                              : 'border-border bg-muted/40 text-muted-foreground hover:border-primary hover:text-foreground'
                          }`}
                        >
                          {count > 0 ? `${count} ` : ''}{cat.label}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </aside>
        )}

        {/* ── Main Content ── */}
        <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden">
          {/* Gmail connection prompt (inline) */}
          {!gmailConnected && (
            <div className="shrink-0 mx-3 mt-3 sm:mx-4 sm:mt-4 lg:mx-6">
              <GmailConnectPrompt
                status={gmailStatus ?? null}
                loading={gmailStatusLoading}
                onReauthorize={handleGmailReauthorize}
                onRefresh={() => refetchGmailStatus()}
                reauthorizing={reauthorizing}
              />
            </div>
          )}

          {/* Content area */}
          {!selectedTaskId ? (
            <div className="flex-1 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
              <div className="mx-auto max-w-7xl space-y-3 sm:space-y-4">
                <section className="space-y-2.5 sm:space-y-3">
                  {/* Queue header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 sm:gap-2.5">
                      <div className={`flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full ${
                        isOverdue ? 'bg-forskale-cyan/10 text-forskale-cyan' : isCompleted ? 'bg-forskale-green/10 text-forskale-green' : 'bg-primary/10 text-primary'
                      }`}>
                        <queueConfig.Icon size={16} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">{queueConfig.eyebrow}</span>
                        <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">{queueConfig.title}</h2>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-md border border-border bg-card px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] font-semibold text-primary">
                      {displayTasks.length} cards
                    </span>
                  </div>

                  {isOverdue && (
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Tasks older than 5 days stay visible here for quick intervention.</p>
                  )}

                  {/* Loading state */}
                  {todoLoading && (
                    <div className="flex items-center justify-center py-8 sm:py-12">
                      <Loader2 size={24} className="animate-spin text-primary" />
                    </div>
                  )}

                  {/* Action Card Grid — 1 col on mobile, 2 cols on md+ */}
                  {!todoLoading && displayTasks.length > 0 && (
                    <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
                      {displayTasks.map((task) => (
                        <ActionCard
                          key={task.id}
                          task={task}
                          onOpen={(t) => {
                            /* trigger background analysis without switching to detail view */
                            if (!t.intent_category || !t.task_strategy?.recommended_next_step_type) {
                              ensureAnalyzedMutation.mutate(t.id)
                            }
                            if (!t.reviewed_at) {
                              markReviewedMutation.mutate(t.id)
                            }
                          }}
                          onResolve={!isCompleted ? (id) => completeMutation.mutate(id) : undefined}
                          resolved={isCompleted}
                        />
                      ))}
                    </div>
                  )}

                  {/* Empty state */}
                  {!todoLoading && displayTasks.length === 0 && (
                    <div className="rounded-xl border border-dashed border-border bg-card px-4 py-6 sm:px-5 sm:py-8 text-center">
                      <p className="text-sm font-bold text-foreground">
                        {isCompleted ? 'No completed cards yet.' : isOverdue ? 'No overdue cards right now.' : 'Execution queue is clear.'}
                      </p>
                      <p className="mt-1 sm:mt-1.5 text-[10px] sm:text-xs text-muted-foreground">
                        {isCompleted ? 'Completed work will appear here once reps finish tasks.' : isOverdue ? 'Cards older than 5 days will appear here automatically.' : 'When a new action is ready, it will drop straight into this flow.'}
                      </p>
                    </div>
                  )}
                </section>
              </div>
            </div>
          ) : (
            /* Detail view: StrategyPanel + ReplyLab — hidden on mobile, shown via mobile drawer below */
            <div className="hidden md:flex flex-1 min-h-0 overflow-y-auto bg-secondary px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
              <div className="mx-auto max-w-4xl w-full flex flex-col gap-3">
                <div className="shrink-0 rounded-2xl bg-card border border-border shadow-md overflow-visible">
                  <StrategyPanel
                    key={`strategy-${selectedTask?.id ?? 'empty'}`}
                    task={selectedTask}
                    onTaskUpdated={(updated) => {
                      queryClient.setQueryData(['todo-ready', 'item', updated.id], updated)
                      queryClient.invalidateQueries({ queryKey: ['todo-ready', 'items'] })
                    }}
                    onSuggestScriptDone={() => selectedTask?.id && setScriptGeneratedForTaskId(selectedTask.id)}
                    onBack={() => { setSelectedTaskId(null); setScriptGeneratedForTaskId(null) }}
                    showExecution={scriptGeneratedForTaskId === selectedTaskId}
                    onShowExecution={() => selectedTask?.id && setScriptGeneratedForTaskId(selectedTask.id)}
                  />
                </div>
                {scriptGeneratedForTaskId === selectedTaskId && selectedTask && (
                  <div className="rounded-2xl bg-card border border-border shadow-md">
                    <ReplyLab
                      key={selectedTask.id}
                      task={selectedTask}
                      onApproveCopy={() => toast.success('Copied to clipboard')}
                      onTaskSent={() => { setSelectedTaskId(null); setScriptGeneratedForTaskId(null) }}
                      onBack={() => setSelectedTaskId(null)}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile drawer */}
      {selectedTaskId && (
        <div className="md:hidden fixed inset-0 z-40 flex flex-col bg-card" role="dialog" aria-label="Task detail">
          <div className="shrink-0 flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
            <button
              type="button"
              onClick={() => { setSelectedTaskId(null); setScriptGeneratedForTaskId(null) }}
              className="p-2 -ml-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Back to list"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
            <span className="text-base font-semibold text-foreground">Task</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto bg-secondary p-3 flex flex-col gap-3">
            <div className="shrink-0 rounded-2xl bg-card border border-border overflow-hidden">
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
              <div className="shrink-0 rounded-2xl bg-card border border-border overflow-hidden">
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
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-atlas-urgent-light border border-atlas-urgent-border rounded-xl p-4 shadow-lg" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-atlas-urgent shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground">Failed to load tasks</p>
              <p className="text-sm text-muted-foreground mt-1">
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

      <Dialog open={showGmailPopup} onOpenChange={(v) => !v && setShowGmailPopup(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-forskale-blue/10">
              <Mail className="h-6 w-6 text-forskale-blue" />
            </div>
            <DialogTitle className="text-center">Connect your Gmail</DialogTitle>
            <DialogDescription className="text-center">
              To-Do Ready needs Gmail access to detect prospect replies and prepare AI-powered responses.
            </DialogDescription>
          </DialogHeader>
          <GmailConnectPrompt
            status={gmailStatus ?? null}
            loading={gmailStatusLoading}
            onReauthorize={handleGmailReauthorize}
            onRefresh={() => refetchGmailStatus()}
            reauthorizing={reauthorizing}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
