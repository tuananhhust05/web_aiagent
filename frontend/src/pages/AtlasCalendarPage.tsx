import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Calendar as CalendarIcon,
  Loader2,
  User,
  X,
  Video,
  UserPlus,
  Save,
  Trash2,
} from 'lucide-react'
import {
  calendarAPI,
  atlasAPI,
  type GoogleCalendarEvent,
  type AtlasMeetingContext,
  type MeetingParticipant,
  type CompanyInfoUser,
  type MainContactUser,
  type MeetingHistoryItem,
} from '../lib/api'

const HOURS = 11 // 8 AM to 6 PM
const HOUR_LABELS = Array.from({ length: HOURS }, (_, i) => i + 8)
const ROW_HEIGHT = 56

type ViewMode = 'day' | 'week' | 'month'

interface CalendarEvent {
  id: string
  title: string
  dayIndex: number
  startHour: number
  startMinute: number
  endHour: number
  endMinute: number
  color: 'blue' | 'green' | 'orange'
  hasAlert?: boolean
  /** ISO date string (YYYY-MM-DD) for month view filtering */
  startDateISO?: string
}

const COLORS: ('blue' | 'green' | 'orange')[] = ['blue', 'green', 'orange']

function getWeekStart(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay()
  const diff = date.getDate() - day + (day === 0 ? -6 : 1)
  date.setDate(diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function getMonthStart(d: Date): Date {
  const date = new Date(d.getFullYear(), d.getMonth(), 1)
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

function formatDay(dayStart: Date): string {
  return dayStart.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatMonthRange(monthStart: Date): string {
  return monthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

/** Extract company/prospect name from event title (e.g. "Discovery Call - Beta Solutions" -> "Beta Solutions") */
function companyNameFromTitle(title: string): string {
  if (!title || !title.includes(' - ')) return title || ''
  const parts = title.split(' - ')
  return parts.slice(1).join(' - ').trim() || parts[0]?.trim() || ''
}

function parseGoogleEvent(evt: GoogleCalendarEvent, weekStart: Date, allowAnyDayIndex = false): CalendarEvent | null {
  const start = evt.start?.dateTime || evt.start?.date
  const end = evt.end?.dateTime || evt.end?.date
  if (!start || !end) return null
  const startDate = new Date(start)
  const endDate = new Date(end)
  const dayIndex = Math.floor((startDate.getTime() - weekStart.getTime()) / (24 * 60 * 60 * 1000))
  if (!allowAnyDayIndex && (dayIndex < 0 || dayIndex > 6)) return null
  const startDateISO = startDate.toISOString().slice(0, 10)
  return {
    id: evt.id || String(Math.random()),
    title: evt.summary || '(No title)',
    dayIndex,
    startHour: startDate.getHours(),
    startMinute: startDate.getMinutes(),
    endHour: endDate.getHours(),
    endMinute: endDate.getMinutes(),
    color: COLORS[Math.abs(dayIndex) % COLORS.length],
    startDateISO,
  }
}

function formatEventDateTime(weekStart: Date, evt: CalendarEvent): string {
  const d = new Date(weekStart)
  d.setDate(d.getDate() + evt.dayIndex)
  d.setHours(evt.startHour, evt.startMinute, 0, 0)
  const end = new Date(weekStart)
  end.setDate(end.getDate() + evt.dayIndex)
  end.setHours(evt.endHour, evt.endMinute, 0, 0)
  const dayStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  const startStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const endStr = end.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  return `${dayStr}, ${startStr}–${endStr}`
}

/** Get join URL from Google event (Meet, Teams, Zoom link) */
function getJoinUrl(evt: GoogleCalendarEvent | null): string | null {
  if (!evt) return null
  if (evt.hangoutLink) return evt.hangoutLink
  const uri = evt.conferenceData?.entryPoints?.find(
    (e) => e.entryPointType === 'video' || e.uri
  )?.uri
  return uri || null
}

export default function AtlasCalendarPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [connected, setConnected] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const fromOAuthSuccessRef = useRef(false)
  const [rawEvents, setRawEvents] = useState<GoogleCalendarEvent[]>([])
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [eventsLoading, setEventsLoading] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [calendarWeekStart, setCalendarWeekStart] = useState<Date>(() => getWeekStart(new Date()))
  const [calendarDayStart, setCalendarDayStart] = useState<Date>(() => new Date())
  const [calendarMonthStart, setCalendarMonthStart] = useState<Date>(() => getMonthStart(new Date()))
  const [banner, setBanner] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [meetingContext, setMeetingContext] = useState<AtlasMeetingContext | null>(null)
  const [contextLoading, setContextLoading] = useState(false)
  const [meetingParticipants, setMeetingParticipants] = useState<MeetingParticipant[]>([])
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoUser>({})
  const [mainContact, setMainContact] = useState<MainContactUser>({})
  const [dealStage, setDealStage] = useState<string>('')
  const [meetingHistoryByEmail, setMeetingHistoryByEmail] = useState<MeetingHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [participantsLoading, setParticipantsLoading] = useState(false)
  const [participantsSaving, setParticipantsSaving] = useState(false)
  const [newParticipant, setNewParticipant] = useState<MeetingParticipant>({ name: '' })
  const [showAddParticipant, setShowAddParticipant] = useState(false)

  const selectedRawEvent = useMemo(() => {
    if (!selectedEvent) return null
    return rawEvents.find((e) => (e.id || '') === selectedEvent.id) || null
  }, [selectedEvent, rawEvents])

  const joinUrl = getJoinUrl(selectedRawEvent)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await calendarAPI.getStatus()
        if (!cancelled) {
          if (fromOAuthSuccessRef.current) setConnected(true)
          else setConnected(res.data.connected)
        }
      } catch {
        if (!cancelled && !fromOAuthSuccessRef.current) setConnected(false)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const success = searchParams.get('connected') === 'success'
    const error = searchParams.get('connected') === 'error'
    if (success) {
      fromOAuthSuccessRef.current = true
      setBanner({ type: 'success', message: 'Google Calendar connected successfully.' })
      setSearchParams({}, { replace: true })
      setConnected(true)
    }
    if (error) {
      setBanner({ type: 'error', message: 'Failed to connect Google Calendar. Please try again.' })
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const rangeStart = viewMode === 'day' ? calendarDayStart : viewMode === 'month' ? calendarMonthStart : calendarWeekStart
  const rangeEnd = (() => {
    if (viewMode === 'day') {
      const e = new Date(calendarDayStart)
      e.setDate(e.getDate() + 1)
      return e
    }
    if (viewMode === 'month') {
      const e = new Date(calendarMonthStart.getFullYear(), calendarMonthStart.getMonth() + 1, 1)
      return e
    }
    const e = new Date(calendarWeekStart)
    e.setDate(e.getDate() + 7)
    return e
  })()

  useEffect(() => {
    if (!connected) return
    const timeMin = rangeStart.toISOString()
    const timeMax = rangeEnd.toISOString()
    let cancelled = false
    setEventsLoading(true)
    calendarAPI
      .getEvents({ time_min: timeMin, time_max: timeMax })
      .then((res) => {
        if (cancelled) return
        const list = res.data.events || []
        setRawEvents(list)
        // Save meetings to backend; same id = update, no duplicate
        atlasAPI.syncCalendarEvents(list).catch(() => {})
        const weekStart = viewMode === 'week' ? calendarWeekStart : viewMode === 'day' ? getWeekStart(calendarDayStart) : getMonthStart(calendarMonthStart)
        const allowAnyDay = viewMode === 'month'
        const mapped = list
          .map((e) => parseGoogleEvent(e, weekStart, allowAnyDay))
          .filter((e): e is CalendarEvent => e !== null)
        setEvents(mapped)
      })
      .catch(() => {
        if (!cancelled) setRawEvents([]); setEvents([])
      })
      .finally(() => {
        if (!cancelled) setEventsLoading(false)
      })
    return () => { cancelled = true }
  }, [connected, rangeStart.toISOString(), rangeEnd.toISOString(), viewMode, calendarWeekStart, calendarDayStart, calendarMonthStart])

  useEffect(() => {
    if (!selectedEvent) {
      setMeetingContext(null)
      return
    }
    const q = companyNameFromTitle(selectedEvent.title)
    if (!q) {
      setMeetingContext(null)
      return
    }
    let cancelled = false
    setContextLoading(true)
    atlasAPI
      .getMeetingContext(q)
      .then((res) => {
        if (!cancelled) setMeetingContext(res.data)
      })
      .catch(() => {
        if (!cancelled) setMeetingContext(null)
      })
      .finally(() => {
        if (!cancelled) setContextLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedEvent?.id, selectedEvent?.title])

  // Load participants + company_info + main_contact for this meeting (by event_id)
  useEffect(() => {
    if (!selectedEvent?.id) {
      setMeetingParticipants([])
      setCompanyInfo({})
      setMainContact({})
      setDealStage('')
      setShowAddParticipant(false)
      setNewParticipant({ name: '' })
      return
    }
    let cancelled = false
    setParticipantsLoading(true)
    atlasAPI
      .getMeetingParticipants(selectedEvent.id)
      .then((res) => {
        if (cancelled) return
        setMeetingParticipants(res.data.participants || [])
        setCompanyInfo(res.data.company_info || {})
        setMainContact(res.data.main_contact || {})
        setDealStage(res.data.deal_stage || '')
      })
      .catch(() => {
        if (!cancelled) {
          setMeetingParticipants([])
          setCompanyInfo({})
          setMainContact({})
          setDealStage('')
        }
      })
      .finally(() => {
        if (!cancelled) setParticipantsLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedEvent?.id])

  // Pre-fill company_info / main_contact from meeting context only when current values are empty (first load)
  useEffect(() => {
    if (!meetingContext || participantsLoading) return
    setCompanyInfo((prev) => {
      const hasAny = prev.industry || prev.size_revenue || prev.location || prev.founded || prev.website || prev.description
      if (hasAny) return prev
      return {
        ...prev,
        industry: meetingContext.company?.business_description?.split(/[.;]/)[0]?.trim(),
        size_revenue: [meetingContext.company?.employee_count_range && `Size: ${meetingContext.company.employee_count_range}`, meetingContext.company?.revenue_range && `Fatturato: ${meetingContext.company.revenue_range}`].filter(Boolean).join(' | '),
        location: [meetingContext.company?.city, meetingContext.company?.country].filter(Boolean).join(', '),
        description: meetingContext.company?.business_description,
      }
    })
    setMainContact((prev) => {
      const hasAny = prev.name || prev.email || prev.job_title
      if (hasAny) return prev
      return {
        ...prev,
        name: [meetingContext.contact?.first_name, meetingContext.contact?.last_name].filter(Boolean).join(' '),
        email: meetingContext.contact?.email,
        job_title: meetingContext.contact?.job_title,
      }
    })
    setDealStage((prev) => prev || meetingContext?.deal?.stage_name || '')
  }, [meetingContext, participantsLoading])

  // Load meeting history by contact email (Interaction history: past meetings with this email)
  const contactEmail = mainContact.email?.trim() || meetingParticipants.find((p) => p.email?.trim())?.email?.trim() || meetingContext?.contact?.email?.trim()
  useEffect(() => {
    if (!contactEmail) {
      setMeetingHistoryByEmail([])
      return
    }
    let cancelled = false
    setHistoryLoading(true)
    atlasAPI
      .getMeetingHistoryByEmail(contactEmail)
      .then((res) => {
        if (cancelled) return
        const list = (res.data.meetings || []).filter((m) => m.event_id !== selectedEvent?.id)
        setMeetingHistoryByEmail(list)
      })
      .catch(() => {
        if (!cancelled) setMeetingHistoryByEmail([])
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false)
      })
    return () => { cancelled = true }
  }, [contactEmail, selectedEvent?.id])

  const handleConnectGoogleCalendar = async () => {
    setConnecting(true)
    try {
      const redirectOrigin = typeof window !== 'undefined' ? window.location.origin : undefined
      const res = await calendarAPI.getAuthUrl(redirectOrigin)
      const url = res.data.url
      if (url) window.location.href = url
    } catch {
      setBanner({ type: 'error', message: 'Could not get connection link. Please try again.' })
    } finally {
      setConnecting(false)
    }
  }

  const goPrev = () => {
    if (viewMode === 'day') {
      const d = new Date(calendarDayStart)
      d.setDate(d.getDate() - 1)
      setCalendarDayStart(d)
    } else if (viewMode === 'month') {
      const d = new Date(calendarMonthStart.getFullYear(), calendarMonthStart.getMonth() - 1, 1)
      setCalendarMonthStart(d)
    } else {
      const prev = new Date(calendarWeekStart)
      prev.setDate(prev.getDate() - 7)
      setCalendarWeekStart(prev)
    }
  }

  const goNext = () => {
    if (viewMode === 'day') {
      const d = new Date(calendarDayStart)
      d.setDate(d.getDate() + 1)
      setCalendarDayStart(d)
    } else if (viewMode === 'month') {
      const d = new Date(calendarMonthStart.getFullYear(), calendarMonthStart.getMonth() + 1, 1)
      setCalendarMonthStart(d)
    } else {
      const next = new Date(calendarWeekStart)
      next.setDate(next.getDate() + 7)
      setCalendarWeekStart(next)
    }
  }

  const handleAddParticipant = () => {
    if (!newParticipant.name.trim()) return
    setMeetingParticipants((prev) => [...prev, { ...newParticipant, name: newParticipant.name.trim() }])
    setNewParticipant({ name: '' })
    setShowAddParticipant(false)
  }

  const handleRemoveParticipant = (index: number) => {
    setMeetingParticipants((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSaveAll = async () => {
    if (!selectedEvent?.id) return
    const toSave = meetingParticipants.filter((p) => (p.name || '').trim())
    const d = new Date(weekStartForGrid)
    d.setDate(d.getDate() + selectedEvent.dayIndex)
    d.setHours(selectedEvent.startHour, selectedEvent.startMinute, 0, 0)
    const event_start = d.toISOString()
    setParticipantsSaving(true)
    try {
      const res = await atlasAPI.saveMeetingParticipants(selectedEvent.id, {
        participants: toSave,
        company_info: companyInfo,
        main_contact: mainContact,
        deal_stage: dealStage.trim() || undefined,
        event_title: selectedEvent.title,
        event_start,
      })
      setMeetingParticipants(res.data.participants || [])
      if (res.data.company_info) setCompanyInfo(res.data.company_info)
      if (res.data.main_contact) setMainContact(res.data.main_contact)
      if (res.data.deal_stage !== undefined) setDealStage(res.data.deal_stage || '')
      // Refresh meeting history by email after save so new meeting appears
      const contactEmail = mainContact.email?.trim() || toSave.find((p) => p.email?.trim())?.email?.trim()
      if (contactEmail) {
        atlasAPI.getMeetingHistoryByEmail(contactEmail).then((hr) => {
          const list = (hr.data.meetings || []).filter((m) => m.event_id !== selectedEvent.id)
          setMeetingHistoryByEmail(list)
        }).catch(() => setMeetingHistoryByEmail([]))
      }
    } finally {
      setParticipantsSaving(false)
    }
  }

  const headerTitle =
    viewMode === 'day'
      ? formatDay(calendarDayStart)
      : viewMode === 'month'
        ? formatMonthRange(calendarMonthStart)
        : formatWeekRange(calendarWeekStart)

  if (loading) {
    return (
      <div className="flex flex-col h-full items-center justify-center bg-white">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <p className="mt-2 text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  if (connected === false) {
    return (
      <div className="flex flex-col h-full overflow-hidden bg-white">
        {banner && (
          <div
            className={`shrink-0 px-4 py-2 text-sm ${
              banner.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            {banner.message}
          </div>
        )}
        <div className="flex-1 flex flex-col items-center justify-center px-6">
          <div className="text-center max-w-md">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 text-gray-400 mb-4">
              <CalendarIcon className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Google Calendar</h2>
            <p className="text-sm text-gray-600 mb-6">
              Connect your Google Calendar account to view and manage events on Atlas.
            </p>
            <button
              type="button"
              onClick={handleConnectGoogleCalendar}
              disabled={connecting}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:pointer-events-none"
            >
              {connecting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Redirecting...
                </>
              ) : (
                'Connect Google Calendar'
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  const displayEvents =
    viewMode === 'day'
      ? events.filter((e) => {
          const d = new Date(calendarWeekStart)
          d.setDate(d.getDate() + e.dayIndex)
          return d.getDate() === calendarDayStart.getDate() && d.getMonth() === calendarDayStart.getMonth() && d.getFullYear() === calendarDayStart.getFullYear()
        })
      : viewMode === 'month'
        ? events
        : events

  const dayColumnCount = viewMode === 'day' ? 1 : viewMode === 'month' ? 7 : 7
  const weekStartForGrid = viewMode === 'week' ? calendarWeekStart : viewMode === 'day' ? getWeekStart(calendarDayStart) : getWeekStart(new Date(calendarMonthStart.getFullYear(), calendarMonthStart.getMonth(), 1))

  return (
    <div className="flex flex-col h-full overflow-hidden bg-white">
      {banner && (
        <div
          className={`shrink-0 px-4 py-2 text-sm ${
            banner.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          {banner.message}
        </div>
      )}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0 flex-wrap gap-2">
        <h1 className="text-lg font-bold text-gray-900 tracking-tight">CALENDAR</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex rounded-lg border border-gray-200 overflow-hidden">
            {(['day', 'week', 'month'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 text-xs font-medium capitalize ${
                  viewMode === mode ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <button type="button" onClick={goPrev} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900" aria-label="Previous">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <span className="min-w-[200px] text-center text-sm font-medium text-gray-700">{headerTitle}</span>
            <button type="button" onClick={goNext} className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900" aria-label="Next">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto scrollbar-hide px-6 pb-6 relative flex">
        {eventsLoading && (
          <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </div>
        )}

        {viewMode === 'month' ? (
          <div className="relative flex-1 min-w-0">
            <div className="grid grid-cols-7 gap-px border border-gray-200 rounded-lg bg-gray-200 overflow-hidden">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
                <div key={d} className="bg-gray-100 py-2 text-center text-xs font-semibold text-gray-600">
                  {d}
                </div>
              ))}
              {Array.from({ length: 42 }, (_, i) => {
                const firstDay = new Date(calendarMonthStart.getFullYear(), calendarMonthStart.getMonth(), 1)
                const weekday = firstDay.getDay()
                const offset = weekday === 0 ? 6 : weekday - 1
                const dayNum = i - offset + 1
                const cellDate = new Date(calendarMonthStart.getFullYear(), calendarMonthStart.getMonth(), dayNum)
                const isCurrentMonth = cellDate.getMonth() === calendarMonthStart.getMonth()
                const cellYear = cellDate.getFullYear()
                const cellMonth = cellDate.getMonth()
                const cellDay = cellDate.getDate()
                const cellDateStr = `${cellYear}-${String(cellMonth + 1).padStart(2, '0')}-${String(cellDay).padStart(2, '0')}`
                const dayEvents = events.filter((e) => e.startDateISO === cellDateStr)
                return (
                  <div
                    key={i}
                    className={`min-h-[80px] bg-white p-1 ${!isCurrentMonth ? 'text-gray-300' : ''}`}
                  >
                    <span className="text-sm font-medium">{cellDate.getDate()}</span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map((evt) => (
                        <button
                          key={evt.id}
                          type="button"
                          onClick={() => setSelectedEvent(evt)}
                          className="block w-full text-left text-[10px] truncate rounded px-1 py-0.5 bg-blue-100 text-blue-800 hover:bg-blue-200"
                        >
                          {evt.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && <span className="text-[10px] text-gray-500">+{dayEvents.length - 3}</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="relative flex-1 min-w-0" style={{ minWidth: viewMode === 'day' ? '200px' : '720px' }}>
            <div
              className="grid border border-gray-200 rounded-lg bg-gray-50 overflow-hidden relative"
              style={{
                gridTemplateColumns: `64px repeat(${dayColumnCount}, minmax(0, 1fr))`,
                gridTemplateRows: `40px repeat(${HOURS}, ${ROW_HEIGHT}px)`,
              }}
            >
              <div className="bg-gray-100 border-b border-r border-gray-200" />
              {Array.from({ length: dayColumnCount }, (_, i) => {
                const d = new Date(weekStartForGrid)
                d.setDate(d.getDate() + i)
                const dayName = d.toLocaleString('en-US', { weekday: 'short' })
                const dateNum = d.getDate()
                return (
                  <div
                    key={i}
                    className="flex flex-col items-center justify-center border-b border-r border-gray-200 bg-gray-100 py-2 last:border-r-0"
                  >
                    <span className="text-xs font-semibold text-gray-600 uppercase">{dayName}</span>
                    <span className="text-sm font-bold text-gray-900">{dateNum}</span>
                  </div>
                )
              })}
              {HOUR_LABELS.map((hour, rowIdx) => (
                <React.Fragment key={hour}>
                  <div
                    className="flex items-start justify-end pr-2 pt-1 border-b border-gray-200 bg-gray-50 text-xs text-gray-500 font-medium"
                    style={{ gridRow: rowIdx + 2 }}
                  >
                    {hour === 12 ? '12:00 PM' : hour < 12 ? `${hour}:00 AM` : `${hour - 12}:00 PM`}
                  </div>
                  {Array.from({ length: dayColumnCount }, (_, colIdx) => (
                    <div
                      key={colIdx}
                      className="border-b border-r border-gray-200 last:border-r-0 relative"
                      style={{ gridRow: rowIdx + 2 }}
                    />
                  ))}
                </React.Fragment>
              ))}

              {displayEvents
                .filter((evt) => evt.startHour >= 8 && evt.startHour < 8 + HOURS)
                .map((evt) => {
                  const startOffset = (evt.startHour - 8) * ROW_HEIGHT + (evt.startMinute / 60) * ROW_HEIGHT
                  const duration = (evt.endHour - evt.startHour) * ROW_HEIGHT + ((evt.endMinute - evt.startMinute) / 60) * ROW_HEIGHT
                  const top = 40 + startOffset
                  const dayColumnWidth = `calc((100% - 64px) / ${dayColumnCount})`
                  const colIdx = viewMode === 'day' ? 0 : evt.dayIndex
                  const leftOffset = `calc(64px + ${colIdx} * ${dayColumnWidth})`
                  return (
                    <div
                      key={evt.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedEvent(evt)}
                      onKeyDown={(e) => e.key === 'Enter' && setSelectedEvent(evt)}
                      className="absolute rounded-md px-2 py-1.5 text-xs font-medium text-white shadow-sm border border-white/20 overflow-hidden cursor-pointer hover:opacity-95 z-10"
                      style={{
                        top: `${top}px`,
                        left: leftOffset,
                        width: `calc(${dayColumnWidth} * 0.92)`,
                        height: `${Math.max(duration - 4, 24)}px`,
                        backgroundColor: evt.color === 'blue' ? '#3b82f6' : evt.color === 'green' ? '#22c55e' : '#f97316',
                      }}
                      title={evt.title}
                    >
                      <div className="flex items-start justify-between gap-1 h-full">
                        <span className="truncate leading-tight">{evt.title}</span>
                        {evt.hasAlert && <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-red-200" />}
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* Meeting detail panel - design matching reference: dark header, Company Profile, Primary Contact */}
        {selectedEvent && (
          <div className="shrink-0 w-[400px] max-w-full bg-white border-l border-gray-200 rounded-tl-2xl shadow-lg overflow-hidden flex flex-col ml-4">
            {/* Dark header: Line 1 = meeting title, Line 2 = time, Join meeting, Close */}
            <div className="bg-[#0B1220] text-white p-5 pb-4 relative flex-shrink-0">
              <button
                type="button"
                onClick={() => setSelectedEvent(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
                aria-label="Close"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="pr-8">
                <h2 className="text-base font-bold text-white leading-tight">
                  {selectedEvent.title}
                </h2>
                <p className="text-sm text-white/80 mt-1">
                  {formatEventDateTime(weekStartForGrid, selectedEvent)}
                </p>
                {joinUrl && (
                  <a
                    href={joinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-300 hover:text-blue-200"
                  >
                    Join meeting →
                  </a>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-hide p-5 space-y-6">
              {/* Company profile - user can fill/edit */}
              <section>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Company profile</h3>
                <p className="text-xs text-gray-500 mb-2">You can fill in or edit the information below.</p>
                <div className="space-y-2 text-sm">
                  <div>
                    <label className="block text-gray-500 mb-0.5">Industry</label>
                    <input
                      type="text"
                      value={companyInfo.industry ?? ''}
                      onChange={(e) => setCompanyInfo((p) => ({ ...p, industry: e.target.value }))}
                      placeholder="e.g. Manufacturing - Automotive Components"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Size & Revenue</label>
                    <input
                      type="text"
                      value={companyInfo.size_revenue ?? ''}
                      onChange={(e) => setCompanyInfo((p) => ({ ...p, size_revenue: e.target.value }))}
                      placeholder="e.g. Size: 45 employees | Revenue: €8-10M"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Location</label>
                    <input
                      type="text"
                      value={companyInfo.location ?? ''}
                      onChange={(e) => setCompanyInfo((p) => ({ ...p, location: e.target.value }))}
                      placeholder="e.g. Milan, Italy"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Founded</label>
                    <input
                      type="text"
                      value={companyInfo.founded ?? ''}
                      onChange={(e) => setCompanyInfo((p) => ({ ...p, founded: e.target.value }))}
                      placeholder="e.g. 2015"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Website</label>
                    <input
                      type="text"
                      value={companyInfo.website ?? ''}
                      onChange={(e) => setCompanyInfo((p) => ({ ...p, website: e.target.value }))}
                      placeholder="e.g. acmecorp.com"
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-500 mb-0.5">Company description</label>
                    <textarea
                      value={companyInfo.description ?? ''}
                      onChange={(e) => setCompanyInfo((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Brief description (2-3 lines)"
                      rows={3}
                      className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 placeholder:text-gray-400 resize-none"
                    />
                  </div>
                </div>
                {meetingContext?.company?.crm_missing_message && (
                  <p className="mt-2 text-xs text-amber-700 bg-amber-50 p-2 rounded">{meetingContext.company.crm_missing_message}</p>
                )}
              </section>

              {/* Primary contact - user can fill/edit */}
              <section>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Primary contact</h3>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-200 shrink-0 flex items-center justify-center">
                    <User className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1 space-y-2 text-sm min-w-0">
                    <div>
                      <label className="block text-gray-500 mb-0.5">Name</label>
                      <input
                        type="text"
                        value={mainContact.name ?? ''}
                        onChange={(e) => setMainContact((p) => ({ ...p, name: e.target.value }))}
                        placeholder="e.g. John Smith - Purchasing Director"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-0.5">Email</label>
                      <input
                        type="email"
                        value={mainContact.email ?? ''}
                        onChange={(e) => setMainContact((p) => ({ ...p, email: e.target.value }))}
                        placeholder="email@example.com"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-gray-500 mb-0.5">Job title</label>
                      <input
                        type="text"
                        value={mainContact.job_title ?? ''}
                        onChange={(e) => setMainContact((p) => ({ ...p, job_title: e.target.value }))}
                        placeholder="e.g. Purchasing Director"
                        className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>
              </section>

              {/* Meeting participants - filled by user, stored by event_id */}
              <section>
                <h3 className="text-sm font-bold text-gray-900 mb-3">Meeting participants</h3>
                {participantsLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : (
                  <>
                    <ul className="space-y-3 mb-3">
                      {meetingParticipants.map((p, index) => (
                        <li key={index} className="flex items-start gap-2 p-2 rounded-lg bg-gray-50 border border-gray-100">
                          <User className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-gray-900">{p.name}</p>
                            {p.email && <p className="text-sm text-gray-600 truncate">{p.email}</p>}
                            {(p.job_title || p.company) && (
                              <p className="text-xs text-gray-500">{[p.job_title, p.company].filter(Boolean).join(' · ')}</p>
                            )}
                            {p.notes && <p className="text-xs text-gray-600 mt-1">{p.notes}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveParticipant(index)}
                            className="p-1 text-gray-400 hover:text-red-600 rounded"
                            aria-label="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                    {showAddParticipant ? (
                      <div className="space-y-2 p-3 rounded-lg border border-gray-200 bg-white mb-3">
                        <input
                          type="text"
                          placeholder="Name *"
                          value={newParticipant.name}
                          onChange={(e) => setNewParticipant((prev) => ({ ...prev, name: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                        />
                        <input
                          type="email"
                          placeholder="Email"
                          value={newParticipant.email || ''}
                          onChange={(e) => setNewParticipant((prev) => ({ ...prev, email: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                        />
                        <input
                          type="text"
                          placeholder="Job title"
                          value={newParticipant.job_title || ''}
                          onChange={(e) => setNewParticipant((prev) => ({ ...prev, job_title: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                        />
                        <input
                          type="text"
                          placeholder="Company"
                          value={newParticipant.company || ''}
                          onChange={(e) => setNewParticipant((prev) => ({ ...prev, company: e.target.value }))}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded"
                        />
                        <textarea
                          placeholder="Notes"
                          value={newParticipant.notes || ''}
                          onChange={(e) => setNewParticipant((prev) => ({ ...prev, notes: e.target.value }))}
                          rows={2}
                          className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleAddParticipant}
                            disabled={!newParticipant.name.trim()}
                            className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            Add
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAddParticipant(false); setNewParticipant({ name: '' }) }}
                            className="px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddParticipant(true)}
                        className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-700 font-medium mb-2"
                      >
                        <UserPlus className="h-4 w-4" /> Add participant
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleSaveAll}
                      disabled={participantsSaving}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {participantsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save information
                    </button>
                  </>
                )}
              </section>

              {/* Before you join / Meeting Preparation (collapsed under Company) */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Before you join this meeting</h3>
                <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-sm">
                  {contextLoading ? (
                    <div className="flex items-center gap-2 text-gray-500">
                      <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                    </div>
                  ) : (
                    <>
                      <p><span className="font-medium text-gray-600">Key points:</span> {meetingContext?.meeting_preparation?.key_points?.length ? meetingContext.meeting_preparation.key_points.join('; ') : '—'}</p>
                      <p className="mt-1"><span className="font-medium text-gray-600">Risks or open questions:</span> {meetingContext?.meeting_preparation?.risks_or_questions?.length ? meetingContext.meeting_preparation.risks_or_questions.join('; ') : '—'}</p>
                      <p className="mt-1"><span className="font-medium text-gray-600">Suggested angle:</span> {meetingContext?.meeting_preparation?.suggested_angle || '—'}</p>
                    </>
                  )}
                </div>
              </section>

              {/* Deal context - Deal stage editable */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Deal context</h3>
                <div className="space-y-2 text-sm">
                  <label className="block text-gray-500 mb-0.5">Deal stage</label>
                  <select
                    value={dealStage}
                    onChange={(e) => setDealStage(e.target.value)}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-gray-900 bg-white"
                  >
                    <option value="">—</option>
                    <option value="Discovery">Discovery</option>
                    <option value="Demo">Demo</option>
                    <option value="Negotiation">Negotiation</option>
                    <option value="Closing">Closing</option>
                  </select>
                </div>
              </section>

              {/* Interaction history: past meetings with this contact email */}
              <section>
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Interaction history</h3>
                <p className="text-xs text-gray-500 mb-2">Meeting history for email: {contactEmail || '—'}</p>
                {historyLoading ? (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading...
                  </div>
                ) : meetingHistoryByEmail.length > 0 ? (
                  <ul className="space-y-2 text-sm">
                    {meetingHistoryByEmail.slice(0, 20).map((m) => {
                      const dateStr = m.event_start ? new Date(m.event_start).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'
                      return (
                        <li key={m.event_id} className="flex items-start gap-2">
                          <Video className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                          <span className="text-gray-500">{dateStr}</span>
                          <span className="text-gray-700">{m.event_title || '(No title)'}</span>
                        </li>
                      )
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-500">
                    {contactEmail ? 'No past meetings with this email.' : 'Enter email (Primary contact or Participants) to view meeting history.'}
                  </p>
                )}
              </section>

              {/* Last interaction snapshot */}
              {(meetingContext?.last_interaction?.summary || meetingContext?.last_interaction?.agreed_next_step) && (
                <section>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">Last interaction snapshot</h3>
                  <div className="rounded-lg bg-gray-50 border border-gray-100 p-3 space-y-2 text-sm">
                    {meetingContext.last_interaction?.summary && <p><span className="font-medium text-gray-600">Summary:</span> {meetingContext.last_interaction.summary}</p>}
                    {meetingContext.last_interaction?.agreed_next_step && <p><span className="font-medium text-gray-600">Agreed next step:</span> {meetingContext.last_interaction.agreed_next_step}</p>}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
