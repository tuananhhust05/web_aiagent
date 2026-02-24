import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronRight,
  Loader2,
  Sparkles,
  ClipboardList,
  Filter,
  PanelLeftClose,
  PanelLeft,
  RefreshCw,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  Inbox,
} from 'lucide-react'
import {
  todoReadyAPI,
  gmailAPI,
  type MemorySignal,
  type TodoStatus,
  type TodoListResponse,
  type MemorySignalsResponse,
} from '../lib/api'
import { useToDoStore, type TodoActiveTab, type DateRangeOption } from '../stores/useToDoStore'
import { toast } from 'react-hot-toast'
import MemorySignalsBar from '../components/atlas/MemorySignalsBar'
import TaskFeed from '../components/atlas/TaskFeed'
import ReplyLab from '../components/atlas/ReplyLab'
import PasteEmailModal from '../components/atlas/PasteEmailModal'
import CustomDateRangePopover from '../components/atlas/CustomDateRangePopover'
import GmailConnectPrompt from '../components/atlas/GmailConnectPrompt'

const DATE_RANGE_OPTIONS: { id: DateRangeOption; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'custom', label: 'Custom' },
]

const TABS: { id: TodoActiveTab; label: string; icon: typeof Inbox }[] = [
  { id: 'ready', label: 'Ready to Send', icon: Inbox },
  { id: 'needs_input', label: 'Needs Input', icon: AlertCircle },
  { id: 'overdue', label: 'Overdue', icon: Clock },
  { id: 'completed', label: 'Completed', icon: CheckCircle2 },
]

const TAB_TO_STATUS: Record<TodoActiveTab, TodoStatus | undefined> = {
  ready: 'ready',
  needs_input: 'needs_input',
  overdue: 'overdue',
  completed: 'done',
}

export default function ToDoReadyPage() {
  const queryClient = useQueryClient()
  const {
    selectedTaskId,
    activeTab,
    dateRange,
    customDateFrom,
    customDateTo,
    setSelectedTaskId,
    setActiveTab,
    setDateRange,
    setCustomDates,
    filters,
    setFilters,
  } = useToDoStore()

  const [pasteModalOpen, setPasteModalOpen] = useState(false)
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [taskFeedCollapsed, setTaskFeedCollapsed] = useState(false)
  const [customDatePopoverOpen, setCustomDatePopoverOpen] = useState(false)

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

  // Auto-analyze when page loads and Gmail is connected
  useEffect(() => {
    if (gmailConnected && !analyzeMutation.isPending) {
      analyzeMutation.mutate()
    }
  }, [gmailConnected])

  // Fetch todo items
  const currentStatus = TAB_TO_STATUS[activeTab]
  const {
    data: todoData,
    isLoading: todoLoading,
    error: todoError,
  } = useQuery<TodoListResponse>({
    queryKey: ['todo-ready', 'items', currentStatus],
    queryFn: () => todoReadyAPI.listItems({ status: currentStatus, limit: 50 }).then((r) => r.data),
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
  
  // Find selected task
  const selectedTask = useMemo(
    () => (selectedTaskId ? tasks.find((t) => t.id === selectedTaskId) ?? null : null),
    [tasks, selectedTaskId]
  )

  // Filter tasks by prospect if set
  const displayTasks = useMemo(() => {
    if (!filters.prospect) return tasks
    return tasks.filter((t) => 
      t.deal_intelligence?.company_name?.toLowerCase() === filters.prospect?.toLowerCase()
    )
  }, [tasks, filters.prospect])

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

  // Count tasks per tab for badges
  const allTasks = todoData?.items ?? []
  const tabCounts = useMemo(() => ({
    ready: allTasks.filter((t) => t.status === 'ready').length,
    needs_input: allTasks.filter((t) => t.status === 'needs_input').length,
    overdue: allTasks.filter((t) => t.status === 'overdue').length,
    completed: allTasks.filter((t) => t.status === 'done').length,
  }), [allTasks])

  return (
    <div className="h-full flex flex-col bg-slate-50 overflow-hidden">
      {/* Page Header - Clean enterprise style */}
      <header className="shrink-0 bg-white border-b border-slate-200">
        <div className="px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Title section */}
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
                To-Do Ready
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                AI-prepared next actions from calls and email intelligence
              </p>
            </div>
            
            {/* Actions section */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Date range selector */}
              <div className="relative">
                <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-sm">
                  <Calendar className="h-4 w-4 text-slate-400 ml-3" />
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
                      className={`px-3 py-2 text-sm font-medium transition-colors ${
                        idx === 0 ? 'rounded-l-lg' : ''
                      } ${idx === DATE_RANGE_OPTIONS.length - 1 ? 'rounded-r-lg' : ''} ${
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

              <div className="h-6 w-px bg-slate-200" />

              {/* Action buttons */}
              <button
                type="button"
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {analyzeMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                ) : (
                  <Sparkles className="h-4 w-4 text-blue-600" />
                )}
                Analyze New
              </button>

              <button
                type="button"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['todo-ready'] })}
                className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50 shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                aria-label="Refresh"
              >
                <RefreshCw className="h-4 w-4" />
              </button>

              {/* Filter dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setFilterDropdownOpen((o) => !o)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium border shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    filters.prospect
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Filter className="h-4 w-4" />
                  {filters.prospect || 'Filter'}
                  <ChevronDown className="h-4 w-4" />
                </button>
                {filterDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setFilterDropdownOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 bg-white py-2 shadow-xl z-20">
                      <div className="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                        Filter by Company
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFilters({ prospect: undefined })
                          setFilterDropdownOpen(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
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
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
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
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                <ClipboardList className="h-4 w-4" />
                Paste Email
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Memory Signals Strip - Accountability Intelligence Layer */}
      {memorySignals.length > 0 && (
        <div className="shrink-0 bg-white border-b border-slate-200">
          <MemorySignalsBar
            signals={memorySignals}
            onSelectTask={(taskId) => setSelectedTaskId(taskId)}
          />
        </div>
      )}

      {/* Gmail connection prompt */}
      {!gmailConnected && (
        <div className="shrink-0 bg-white border-b border-slate-200 px-6 lg:px-8 py-4">
          <GmailConnectPrompt
            status={gmailStatus ?? null}
            loading={gmailStatusLoading}
            onReauthorize={handleGmailReauthorize}
            onRefresh={() => refetchGmailStatus()}
            reauthorizing={reauthorizing}
          />
        </div>
      )}

      {/* Tab Navigation - Separated with proper spacing */}
      <div className="shrink-0 bg-white border-b border-slate-200">
        <div className="px-6 lg:px-8">
          <nav className="flex gap-1" aria-label="Task status tabs">
            {TABS.map((tab) => {
              const Icon = tab.icon
              const count = tabCounts[tab.id]
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`group relative inline-flex items-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors focus:outline-none ${
                    isActive
                      ? 'text-blue-600'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'}`} />
                  {tab.label}
                  {count > 0 && (
                    <span className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full ${
                      isActive
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}>
                      {count}
                    </span>
                  )}
                  {/* Active indicator */}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 transition-colors ${
                      isActive ? 'bg-blue-600' : 'bg-transparent'
                    }`}
                  />
                </button>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Left Panel - Task Feed */}
        <div
          className={`flex flex-col min-h-0 bg-white border-r border-slate-200 transition-all ${
            taskFeedCollapsed 
              ? 'w-0 overflow-hidden' 
              : 'w-full md:w-[400px] lg:w-[420px]'
          }`}
        >
          {/* Panel header */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-700">Tasks</span>
              <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-medium rounded-full bg-slate-200 text-slate-600">
                {displayTasks.length}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setTaskFeedCollapsed(true)}
              className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 hidden md:flex lg:hidden"
              aria-label="Collapse task list"
            >
              <PanelLeftClose className="h-4 w-4" />
            </button>
          </div>
          
          {/* Task list */}
          <div className="flex-1 overflow-hidden">
            <TaskFeed
              tasks={displayTasks}
              activeTab={activeTab}
              loading={todoLoading}
              onOpenTask={(task) => setSelectedTaskId(task.id)}
              onMarkDone={(task) => completeMutation.mutate(task.id)}
              onRegenerate={(task) => {
                setSelectedTaskId(task.id)
                toast('Regenerate draft will be available when the AI is connected.')
              }}
              onSnooze={() => {
                toast('Snooze will be available in a future update.')
              }}
            />
          </div>
        </div>
        
        {/* Collapsed panel toggle */}
        {taskFeedCollapsed && (
          <button
            type="button"
            onClick={() => setTaskFeedCollapsed(false)}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-10 flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm font-medium text-slate-600 shadow-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Show task list"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        )}
        
        {/* Right Panel - Reply Lab */}
        <div className="flex-1 min-w-0 min-h-0 flex-col bg-slate-50 p-4 lg:p-6 hidden md:flex overflow-y-auto">
          <ReplyLab
            key={selectedTask?.id ?? 'empty'}
            task={selectedTask}
            threadMessages={[]}
            onApproveCopy={() => toast.success('Copied to clipboard')}
            onCopyToCrm={() => toast('Copy to CRM requires CRM integration.')}
            onTaskSent={() => setSelectedTaskId(null)}
          />
        </div>
      </div>

      {/* Mobile drawer for ReplyLab */}
      {selectedTaskId && (
        <div
          className="md:hidden fixed inset-0 z-40 flex flex-col bg-white"
          role="dialog"
          aria-label="Reply lab"
        >
          <div className="shrink-0 flex items-center gap-3 px-4 py-4 border-b border-slate-200 bg-white">
            <button
              type="button"
              onClick={() => setSelectedTaskId(null)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Back to list"
            >
              <ChevronRight className="h-5 w-5 rotate-180" />
            </button>
            <span className="text-base font-semibold text-slate-900">Task Details</span>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto bg-slate-50 p-4">
            <ReplyLab
              key={selectedTask?.id ?? 'empty'}
              task={selectedTask}
              threadMessages={[]}
              onApproveCopy={() => toast.success('Copied to clipboard')}
              onCopyToCrm={() => toast('Copy to CRM requires CRM integration.')}
              onTaskSent={() => setSelectedTaskId(null)}
            />
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
