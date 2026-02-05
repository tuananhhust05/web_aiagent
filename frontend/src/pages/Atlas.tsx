import React, { useState, useMemo, useEffect } from 'react'
import {
  CalendarDays,
  PhoneCall,
  BarChart3,
  ClipboardCheck,
  BookOpen,
  Radio as RadioIcon,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Clock,
  Mic,
  X,
  AlertTriangle,
  XCircle,
} from 'lucide-react'
import { callsAPI, CallPlaybookAnalysis } from '../lib/api'
import { toast } from 'react-hot-toast'

type AtlasSection = 'calendar' | 'calls' | 'insights' | 'todo' | 'knowledge' | 'record'

const HOURS = 11 // 8 AM to 6 PM
const HOUR_LABELS = Array.from({ length: HOURS }, (_, i) => i + 8)
const ROW_HEIGHT = 56

interface CalendarEvent {
  id: string
  title: string
  dayIndex: number // 0 = Mon
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  color: 'blue' | 'green' | 'orange'
  hasAlert?: boolean
}

const mockCalendarEvents: CalendarEvent[] = [
  {
    id: '1',
    title: 'Discovery Call - Beta Solutions',
    dayIndex: 0,
    startHour: 10,
    startMinute: 0,
    endHour: 11,
    endMinute: 0,
    color: 'blue',
  },
  {
    id: '2',
    title: 'Demo - Acme Corp',
    dayIndex: 0,
    startHour: 14,
    startMinute: 0,
    endHour: 15,
    endMinute: 0,
    color: 'orange',
    hasAlert: true,
  },
  {
    id: '3',
    title: 'Follow-up - TechStart',
    dayIndex: 1,
    startHour: 11,
    startMinute: 0,
    endHour: 12,
    endMinute: 0,
    color: 'green',
  },
  {
    id: '4',
    title: 'Prospecting Call',
    dayIndex: 3,
    startHour: 16,
    startMinute: 0,
    endHour: 17,
    endMinute: 0,
    color: 'blue',
  },
]

type AtlasCall = {
  id: string
  phone_number: string
  agent_name?: string | null
  call_type: 'inbound' | 'outbound'
  duration?: number | null
  status: 'initiated' | 'connecting' | 'completed' | 'failed' | 'busy' | 'no_answer' | 'cancelled'
  sentiment?: 'positive' | 'negative' | 'neutral'
  feedback?: string | null
  created_at: string
  transcript?: string | null
}

const timeframeOptions = ['Last week', 'Last 2 weeks', 'Last month', 'Last 3 months'] as const
type Timeframe = (typeof timeframeOptions)[number]

function getWeekStart(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function formatWeekRange(weekStart: Date): string {
  const end = new Date(weekStart)
  end.setDate(end.getDate() + 6)
  const m1 = weekStart.toLocaleString('en-US', { month: 'short' })
  const m2 = end.toLocaleString('en-US', { month: 'short' })
  const y = weekStart.getFullYear()
  if (m1 === m2) return `${m1} ${weekStart.getDate()} - ${end.getDate()}, ${y}`
  return `${m1} ${weekStart.getDate()} - ${m2} ${end.getDate()}, ${y}`
}

export default function Atlas() {
  const [activeSection, setActiveSection] = useState<AtlasSection>('calls')
  const [calendarWeekStart, setCalendarWeekStart] = useState<Date>(() =>
    getWeekStart(new Date(2026, 0, 20))
  )
  const [calls, setCalls] = useState<AtlasCall[]>([])
  const [callsLoading, setCallsLoading] = useState(false)
  const [activeCallId, setActiveCallId] = useState<string | null>(null)
  const [activeCallTab, setActiveCallTab] = useState<
    'summary' | 'todo' | 'qna' | 'knowledge' | 'feedback' | 'comments'
  >('summary')
  const [playbookAnalysis, setPlaybookAnalysis] = useState<CallPlaybookAnalysis | null>(null)
  const [playbookLoading, setPlaybookLoading] = useState(false)
  const [playbookError, setPlaybookError] = useState<string | null>(null)
  const [playbookTimeframe, setPlaybookTimeframe] = useState<Timeframe>('Last week')
  const [speakingTimeframe, setSpeakingTimeframe] = useState<Timeframe>('Last week')
  const [objectionTimeframe, setObjectionTimeframe] = useState<Timeframe>('Last week')
  const [recordMode, setRecordMode] = useState<'join' | 'no_join'>('join')
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)

  const activeCall = useMemo(
    () => (activeCallId ? calls.find((c) => c.id === activeCallId) || null : null),
    [calls, activeCallId]
  )

  useEffect(() => {
    const loadCalls = async () => {
      try {
        setCallsLoading(true)
        const res = await callsAPI.getCalls({ limit: 50, offset: 0 })
        const list: AtlasCall[] = (res.data || []).map((c: any) => ({
          id: c.id || c._id,
          phone_number: c.phone_number,
          agent_name: c.agent_name,
          call_type: c.call_type,
          duration: c.duration,
          status: c.status,
          sentiment: c.sentiment,
          feedback: c.feedback,
          created_at: c.created_at,
          transcript: c.transcript,
        }))
        setCalls(list)
        if (!activeCallId && list.length > 0) {
          setActiveCallId(list[0].id)
        }
      } catch (e: any) {
        console.error('Failed to load calls for Atlas', e)
        toast.error(e.response?.data?.detail || 'Failed to load call history')
      } finally {
        setCallsLoading(false)
      }
    }
    loadCalls()
  }, [])

  useEffect(() => {
    // Reset playbook analysis when switching calls
    setPlaybookAnalysis(null)
    setPlaybookError(null)
    setPlaybookLoading(false)
  }, [activeCallId])

  const handleCheckPlaybook = async () => {
    if (!activeCall) {
      toast.error('No call selected')
      return
    }
    if (!activeCall.transcript || !activeCall.transcript.trim()) {
      toast.error('This call has no transcript to analyze yet.')
      return
    }
    try {
      setPlaybookLoading(true)
      setPlaybookError(null)
      const res = await callsAPI.getPlaybookAnalysis(activeCall.id)
      setPlaybookAnalysis(res.data)
      if (res.data.source === 'cache') {
        toast.success('Loaded previous playbook analysis')
      } else if (res.data.source === 'llm') {
        toast.success('Playbook analysis generated')
      } else if (res.data.source === 'none') {
        if (res.data.message) {
          setPlaybookError(res.data.message)
        } else {
          setPlaybookError('Playbook analysis is not available.')
        }
      }
    } catch (e: any) {
      console.error('Failed to analyze call against playbook', e)
      setPlaybookError(e.response?.data?.detail || 'Failed to analyze call against playbook')
      toast.error(e.response?.data?.detail || 'Failed to analyze call against playbook')
    } finally {
      setPlaybookLoading(false)
    }
  }

  const openRecordModal = () => setIsRecordModalOpen(true)
  const closeRecordModal = () => setIsRecordModalOpen(false)

  const renderTimeframeFilters = (value: Timeframe, setValue: (v: Timeframe) => void) => (
    <div className="flex gap-2 flex-wrap justify-end">
      {timeframeOptions.map((tf) => (
        <button
          key={tf}
          onClick={() => setValue(tf)}
          className={`px-3 py-1.5 text-xs rounded-full border transition-colors ${
            value === tf
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {tf}
        </button>
      ))}
    </div>
  )

  const renderRecordModalContent = () => {
    if (recordMode === 'join') {
      return (
        <p className="text-sm text-gray-700">
          Atlas Assistant will join your meeting as a participant to record the conversation
          and generate summaries, to-dos, and insights.
        </p>
      )
    }
    return (
      <p className="text-sm text-gray-700">
        Atlas will start recording audio from your computer speakers for all
        participants in the meeting, without joining as a visible participant.
      </p>
    )
  }

  return (
    <div className="flex w-screen h-screen bg-gray-50 overflow-hidden">
      {/* Atlas Sidebar */}
      <aside className="w-64 bg-[#0B1220] text-white flex flex-col">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="text-xs uppercase tracking-widest text-blue-300 mb-1">Atlas</div>
          <div className="text-sm text-blue-100">by ForSkale</div>
        </div>

        <nav className="flex-1 py-4 space-y-1 text-sm">
          <button
            onClick={() => setActiveSection('calendar')}
            className={`w-full flex items-center gap-2 px-5 py-2.5 text-left hover:bg-white/5 ${
              activeSection === 'calendar' ? 'bg-white/10 text-white' : 'text-gray-300'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
            <span>Calendar</span>
          </button>
          <button
            onClick={() => setActiveSection('calls')}
            className={`w-full flex items-center gap-2 px-5 py-2.5 text-left hover:bg-white/5 ${
              activeSection === 'calls' ? 'bg-white/10 text-white' : 'text-gray-300'
            }`}
          >
            <PhoneCall className="h-4 w-4" />
            <span>Call History</span>
          </button>
          <button
            onClick={() => setActiveSection('insights')}
            className={`w-full flex items-center gap-2 px-5 py-2.5 text-left hover:bg-white/5 ${
              activeSection === 'insights' ? 'bg-white/10 text-white' : 'text-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4" />
            <span>Insights</span>
          </button>
          <button
            onClick={() => setActiveSection('todo')}
            className={`w-full flex items-center gap-2 px-5 py-2.5 text-left hover:bg-white/5 ${
              activeSection === 'todo' ? 'bg-white/10 text-white' : 'text-gray-300'
            }`}
          >
            <ClipboardCheck className="h-4 w-4" />
            <span>To Do Ready</span>
          </button>
          <button
            onClick={() => setActiveSection('knowledge')}
            className={`w-full flex items-center gap-2 px-5 py-2.5 text-left hover:bg-white/5 ${
              activeSection === 'knowledge' ? 'bg-white/10 text-white' : 'text-gray-300'
            }`}
          >
            <BookOpen className="h-4 w-4" />
            <span>Knowledge</span>
          </button>
          <button
            onClick={() => setActiveSection('record')}
            className={`w-full flex items-center gap-2 px-5 py-2.5 text-left hover:bg-white/5 ${
              activeSection === 'record' ? 'bg-white/10 text-white' : 'text-gray-300'
            }`}
          >
            <RadioIcon className="h-4 w-4" />
            <span>Record</span>
          </button>
        </nav>

        <div className="px-5 py-3 border-t border-white/10 text-[11px] text-gray-400">
          v2.1.0
        </div>
      </aside>

      {/* Main content area */}
      <div className="flex-1 bg-gray-50 overflow-hidden">
        {activeSection === 'calendar' && (
          <div className="flex flex-col h-full overflow-hidden bg-white">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">CALENDAR</h1>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const prev = new Date(calendarWeekStart)
                    prev.setDate(prev.getDate() - 7)
                    setCalendarWeekStart(prev)
                  }}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="min-w-[220px] text-center text-sm font-medium text-gray-700">
                  {formatWeekRange(calendarWeekStart)}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const next = new Date(calendarWeekStart)
                    next.setDate(next.getDate() + 7)
                    setCalendarWeekStart(next)
                  }}
                  className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Next week"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Calendar grid */}
            <div className="flex-1 overflow-auto px-6 pb-6">
              <div className="relative" style={{ minWidth: '720px' }}>
                <div
                  className="grid border border-gray-200 rounded-lg bg-gray-50 overflow-hidden relative"
                  style={{
                    gridTemplateColumns: '64px repeat(7, minmax(0, 1fr))',
                    gridTemplateRows: `40px repeat(${HOURS}, ${ROW_HEIGHT}px)`,
                  }}
                >
                  {/* Corner */}
                  <div className="bg-gray-100 border-b border-r border-gray-200" />
                  {/* Day headers */}
                  {Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(calendarWeekStart)
                    d.setDate(d.getDate() + i)
                    const dayName = d.toLocaleString('en-US', { weekday: 'short' })
                    const dateNum = d.getDate()
                    return (
                      <div
                        key={i}
                        className="flex flex-col items-center justify-center border-b border-r border-gray-200 bg-gray-100 py-2 last:border-r-0"
                      >
                        <span className="text-xs font-semibold text-gray-600 uppercase">
                          {dayName}
                        </span>
                        <span className="text-sm font-bold text-gray-900">{dateNum}</span>
                      </div>
                    )
                  })}
                  {/* Time rows + cells */}
                  {HOUR_LABELS.map((hour, rowIdx) => (
                    <React.Fragment key={hour}>
                      <div
                        className="flex items-start justify-end pr-2 pt-1 border-b border-gray-200 bg-gray-50 text-xs text-gray-500 font-medium"
                        style={{ gridRow: rowIdx + 2 }}
                      >
                        {hour === 12
                          ? '12:00 PM'
                          : hour < 12
                            ? `${hour}:00 AM`
                            : `${hour - 12}:00 PM`}
                      </div>
                      {Array.from({ length: 7 }, (_, colIdx) => (
                        <div
                          key={colIdx}
                          className="border-b border-r border-gray-200 last:border-r-0 relative"
                          style={{ gridRow: rowIdx + 2 }}
                        />
                      ))}
                    </React.Fragment>
                  ))}

                  {/* Event blocks (positioned absolutely over grid) */}
                  {mockCalendarEvents.map((evt) => {
                    const startOffset =
                      (evt.startHour - 8) * ROW_HEIGHT +
                      (evt.startMinute / 60) * ROW_HEIGHT
                    const duration =
                      (evt.endHour - evt.startHour) * ROW_HEIGHT +
                      ((evt.endMinute - evt.startMinute) / 60) * ROW_HEIGHT
                    const top = 40 + startOffset
                    const dayColumnWidth = `calc((100% - 64px) / 7)`
                    const leftOffset = `calc(64px + ${evt.dayIndex} * ${dayColumnWidth})`
                    return (
                      <div
                        key={evt.id}
                        className="absolute rounded-md px-2 py-1.5 text-xs font-medium text-white shadow-sm border border-white/20 overflow-hidden cursor-pointer hover:opacity-95 z-10"
                        style={{
                          top: `${top}px`,
                          left: leftOffset,
                          width: `calc(${dayColumnWidth} * 0.92)`,
                          height: `${Math.max(duration - 4, 24)}px`,
                          backgroundColor:
                            evt.color === 'blue'
                              ? '#3b82f6'
                              : evt.color === 'green'
                                ? '#22c55e'
                                : '#f97316',
                        }}
                        title={evt.title}
                      >
                        <div className="flex items-start justify-between gap-1 h-full">
                          <span className="truncate leading-tight">{evt.title}</span>
                          {evt.hasAlert && (
                            <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-200" />
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'calls' && (
          <div className="flex h-full">
            {/* Left: Calls list */}
            <div className="w-80 border-r border-gray-200 bg-white p-4 space-y-3 overflow-y-auto">
              <h2 className="text-sm font-semibold text-gray-900 mb-2">Call History</h2>
              {callsLoading && (
                <div className="text-xs text-gray-500 px-1 py-2">Loading calls…</div>
              )}
              {!callsLoading && calls.length === 0 && (
                <div className="text-xs text-gray-500 px-1 py-2">No calls found.</div>
              )}
              {calls.map((call) => (
                <button
                  key={call.id}
                  onClick={() => setActiveCallId(call.id)}
                  className={`w-full text-left rounded-lg border px-3 py-2.5 mb-1 flex flex-col gap-1 ${
                    activeCallId === call.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {call.phone_number}
                    </span>
                    <ChevronRight className="h-3 w-3 text-gray-400" />
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2">
                    <span>
                      {new Date(call.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: '2-digit',
                      })}
                    </span>
                    <span>
                      •{' '}
                      {typeof call.duration === 'number'
                        ? `${Math.floor(call.duration / 60)} min`
                        : '—'}
                    </span>
                    <span>• {call.call_type === 'outbound' ? 'Outbound' : 'Inbound'}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Right: Call detail */}
            <div className="flex-1 p-6 space-y-4 overflow-y-auto">
              {activeCall ? (
                <>
                  <div>
                    <button className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                      <ChevronRight className="h-3 w-3 rotate-180" />
                      <span>Calls</span>
                    </button>
                    <h1 className="text-2xl font-semibold text-gray-900">
                      {activeCall.phone_number}
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(activeCall.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: '2-digit',
                      })}{' '}
                      •{' '}
                      {typeof activeCall.duration === 'number'
                        ? `${Math.floor(activeCall.duration / 60)} min`
                        : 'Unknown duration'}{' '}
                      • {activeCall.call_type === 'outbound' ? 'Outbound' : 'Inbound'} call
                    </p>
                  </div>

                  {/* Tabs */}
                  <div className="border-b border-gray-200">
                    <nav className="flex gap-6 text-sm">
                      {[
                        { id: 'summary', label: 'Summary' },
                        { id: 'todo', label: 'To Do Ready' },
                        { id: 'qna', label: 'QnA' },
                        { id: 'knowledge', label: 'Knowledge Configuration' },
                        { id: 'feedback', label: 'Feedback' },
                        { id: 'comments', label: 'Comments' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setActiveCallTab(tab.id as any)}
                          className={`pb-2 border-b-2 -mb-px flex items-center gap-1 ${
                            activeCallTab === tab.id
                              ? 'border-blue-600 text-blue-600'
                              : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </nav>
                  </div>

                  {/* Tab content */}
                  {activeCallTab === 'summary' && (
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">
                          Call summary
                        </h3>
                        <p className="text-xs text-gray-500 mb-2">
                          {activeCall.call_type === 'outbound' ? 'Outbound' : 'Inbound'} •{' '}
                          {new Date(activeCall.created_at).toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-3 text-sm text-gray-700">
                        <div>
                          <h4 className="font-semibold mb-1">Sales Playbook Check</h4>
                          <p className="text-xs text-gray-500 mb-2">
                            SilkChart AI will analyze this call transcript against your Sales
                            Playbook Template and show which rules were followed.
                          </p>
                          <div className="flex items-center gap-3 mb-3">
                            <button
                              type="button"
                              onClick={handleCheckPlaybook}
                              disabled={playbookLoading}
                              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                            >
                              {playbookLoading ? 'Analyzing…' : 'Check against Playbook'}
                            </button>
                            {playbookAnalysis?.template_name && (
                              <span className="text-[11px] text-gray-500">
                                Using template:{' '}
                                <span className="font-medium text-gray-700">
                                  {playbookAnalysis.template_name}
                                </span>
                                {playbookAnalysis.source === 'cache' && ' (cached)'}
                              </span>
                            )}
                          </div>
                          {playbookError && (
                            <div className="text-xs text-red-600 mb-2">{playbookError}</div>
                          )}
                          {playbookAnalysis && playbookAnalysis.rules.length > 0 && (
                            <div className="mt-2 space-y-3">
                              {typeof playbookAnalysis.overall_score === 'number' && (
                                <div className="rounded-md bg-blue-50 border border-blue-100 px-3 py-2 flex items-center justify-between">
                                  <div>
                                    <div className="text-xs font-semibold text-blue-900">
                                      Overall Playbook Score
                                    </div>
                                    {playbookAnalysis.coaching_summary && (
                                      <div className="text-[11px] text-blue-800 mt-0.5">
                                        {playbookAnalysis.coaching_summary}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-lg font-bold text-blue-900">
                                    {playbookAnalysis.overall_score}%
                                  </div>
                                </div>
                              )}
                              <div className="space-y-2">
                                {playbookAnalysis.rules.map((rule) => (
                                  <div
                                    key={rule.rule_id || rule.label}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs space-y-1.5"
                                  >
                                    <div className="flex items-start gap-2">
                                      {rule.passed ? (
                                        <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                                      ) : (
                                        <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                                      )}
                                      <div className="flex-1 min-w-0">
                                        <div className="font-semibold text-gray-900 truncate">
                                          {rule.label}
                                        </div>
                                        {rule.description && (
                                          <div className="text-[11px] text-gray-500">
                                            {rule.description}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1.5">
                                      <div>
                                        <div className="text-[11px] font-medium text-gray-700">
                                          Bạn đã nói gì?
                                        </div>
                                        <div className="text-[11px] text-gray-600 border border-gray-100 rounded-md px-2 py-1 min-h-[34px]">
                                          {rule.what_you_said && rule.what_you_said.trim()
                                            ? rule.what_you_said
                                            : '—'}
                                        </div>
                                      </div>
                                      <div>
                                        <div className="text-[11px] font-medium text-gray-700">
                                          Bạn nên nói gì?
                                        </div>
                                        <div className="text-[11px] text-gray-700 border border-blue-100 bg-blue-50 rounded-md px-2 py-1 min-h-[34px]">
                                          {rule.what_you_should_say && rule.what_you_should_say.trim()
                                            ? rule.what_you_should_say
                                            : '—'}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeCallTab === 'todo' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">To Do Ready</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Actionable tasks generated from the call, similar to ForSkale Sales Coach.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Send recap email with key decisions and next steps.</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
                      <span>Schedule technical demo with product specialist.</span>
                    </li>
                  </ul>
                </div>
              )}

                  {activeCallTab === 'qna' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">QnA</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Questions, suggestions, and recommendations for the sales manager.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>
                      <span className="font-medium">Question:</span> What pricing options best fit
                      the client&apos;s budget and timeline?
                    </li>
                    <li>
                      <span className="font-medium">Recommendation:</span> Prepare a 2-tier
                      proposal with implementation milestones.
                    </li>
                  </ul>
                </div>
              )}

                  {activeCallTab === 'knowledge' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Knowledge Configuration</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Templates for how the sales manager interacts with the client.
                  </p>
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white p-4 text-sm text-gray-600">
                    Configure playbooks, discovery templates, and objection handling scripts
                    that Atlas will use to coach your sales team.
                  </div>
                </div>
              )}

                  {activeCallTab === 'feedback' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Feedback</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Qualitative and quantitative feedback for the call.
                  </p>
                  <ul className="space-y-2 text-sm">
                    <li>Rapport building: Strong.</li>
                    <li>Discovery depth: Good, but can ask more about timeline.</li>
                    <li>Next steps clarity: Very clear.</li>
                  </ul>
                </div>
              )}

                  {activeCallTab === 'comments' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900">Comments</h3>
                  <p className="text-xs text-gray-500 mb-2">
                    Internal comments from sales manager or team leads.
                  </p>
                  <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm text-gray-700">
                    Add internal notes, coaching suggestions, or review comments related to
                    this call.
                  </div>
                </div>
                  )}
                </>
              ) : (
                <div className="text-sm text-gray-500">Select a call from the left list.</div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'insights' && (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <h1 className="text-xl font-semibold text-gray-900">Insights</h1>
            <p className="text-sm text-gray-600">Aggregated insights across all calls.</p>

            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      Sales Playbook Insights
                    </h2>
                    <p className="text-xs text-gray-500">
                      How well calls follow your sales playbook.
                    </p>
                  </div>
                  {renderTimeframeFilters(playbookTimeframe, setPlaybookTimeframe)}
                </div>
                <div className="mt-3 h-32 rounded-md bg-gradient-to-r from-blue-50 to-blue-100 border border-dashed border-blue-200 flex items-center justify-center text-xs text-blue-700">
                  Placeholder chart for playbook adherence over time.
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      Speaking Skills Insights
                    </h2>
                    <p className="text-xs text-gray-500">
                      Talk ratio, pacing, and clarity across calls.
                    </p>
                  </div>
                  {renderTimeframeFilters(speakingTimeframe, setSpeakingTimeframe)}
                </div>
                <div className="mt-3 h-32 rounded-md bg-gradient-to-r from-green-50 to-green-100 border border-dashed border-green-200 flex items-center justify-center text-xs text-green-700">
                  Placeholder chart for speaking skills metrics.
                </div>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900">
                      Objection Handling Insights
                    </h2>
                    <p className="text-xs text-gray-500">
                      How effectively objections are addressed.
                    </p>
                  </div>
                  {renderTimeframeFilters(objectionTimeframe, setObjectionTimeframe)}
                </div>
                <div className="mt-3 h-32 rounded-md bg-gradient-to-r from-purple-50 to-purple-100 border border-dashed border-purple-200 flex items-center justify-center text-xs text-purple-700">
                  Placeholder chart for objection handling performance.
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === 'todo' && (
          <div className="p-6 space-y-4 h-full overflow-y-auto">
            <h1 className="text-xl font-semibold text-gray-900">To Do Ready</h1>
            <p className="text-sm text-gray-600 mb-4">
              Centralized view of all follow-up tasks generated from calls.
            </p>
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500">
              To Do Ready board placeholder. Here you will see prioritized tasks across all
              your calls.
            </div>
          </div>
        )}

        {activeSection === 'knowledge' && (
          <div className="p-6 space-y-4 h-full overflow-y-auto">
            <h1 className="text-xl font-semibold text-gray-900">Knowledge</h1>
            <p className="text-sm text-gray-600 mb-4">
              Configure templates and knowledge bases used by Atlas during calls.
            </p>
            <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-sm text-gray-500 space-y-2">
              <p>Manage playbooks, discovery templates, and objection handling content.</p>
              <p>
                This section will connect to your existing RAG / knowledge base
                configuration.
              </p>
            </div>
          </div>
        )}

        {activeSection === 'record' && (
          <div className="p-6 space-y-6 h-full overflow-y-auto">
            <h1 className="text-xl font-semibold text-gray-900">Record</h1>
            <p className="text-sm text-gray-600">Configure how Atlas records your meetings.</p>

            <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-4">
              <div className="space-y-2">
                <h2 className="text-sm font-semibold text-gray-900">Recording Mode</h2>
                <p className="text-xs text-gray-500">
                  Choose how Atlas should participate in your meetings.
                </p>
              </div>

              <div className="flex flex-col gap-3 text-sm">
                <label className="inline-flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="record-mode"
                    value="join"
                    checked={recordMode === 'join'}
                    onChange={() => setRecordMode('join')}
                    className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-1">
                      <Mic className="h-3 w-3 text-blue-500" />
                      <span>Join Meeting</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Atlas Assistant joins the meeting as a participant to record.
                    </p>
                  </div>
                </label>

                <label className="inline-flex items-start gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="record-mode"
                    value="no_join"
                    checked={recordMode === 'no_join'}
                    onChange={() => setRecordMode('no_join')}
                    className="mt-0.5 h-4 w-4 border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900 flex items-center gap-1">
                      <Clock className="h-3 w-3 text-gray-500" />
                      <span>Don&apos;t Join Meeting</span>
                    </div>
                    <p className="text-xs text-gray-500">
                      Atlas records all speakers&apos; audio directly from your computer
                      speakers.
                    </p>
                  </div>
                </label>
              </div>

              <button
                onClick={openRecordModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                <RadioIcon className="h-4 w-4" />
                <span>Record</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Record modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                  {recordMode === 'join'
                    ? 'Add Atlas Assistant to join meeting to record'
                    : 'Start recording from computer speakers'}
                </h2>
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  <span>Recording will start as soon as your meeting begins.</span>
                </div>
              </div>
              <button onClick={closeRecordModal} className="text-gray-400 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>

            {renderRecordModalContent()}

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={closeRecordModal}
                className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={closeRecordModal}
                className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

