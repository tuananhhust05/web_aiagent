import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  Droplet,
  FileText,
  HelpCircle,
  Info,
  List,
  Loader2,
  MessageCircle,
  Mic,
  Monitor,
  MoreVertical,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  ThumbsUp,
  Trash2,
  TrendingUp,
  Upload,
  Users,
  Volume2,
  X,
  Zap,
  Clock,
  Radio as RadioIcon,
  Download,
  AlertCircle,
} from 'lucide-react'
import {
  calendarAPI,
  atlasAPI,
  meetingsAPI,
  vexaAPI,
  playbooksAPI,
  type GoogleCalendarEvent,
  type MeetingPlatform,
  type MeetingPlaybookAnalysis,
  type MeetingFeedback,
  type MeetingComment,
  type AtlasQnARecord,
  type AtlasKnowledgeDocument,
} from '../lib/api'

const KNOWLEDGE_CATEGORY_API_MAP: Record<string, string> = {
  product: 'product-info',
  pricing: 'pricing-plan',
  objection: 'objection-handling',
  competitive: 'competitive-intel',
  faqs: 'customer-faqs',
  policies: 'company-policies',
}
import { toast } from 'react-hot-toast'

type AtlasMainSection = 'calls' | 'insights' | 'todo' | 'qna' | 'knowledge' | 'record'

const timeframeOptions = ['Last week', 'Last 2 weeks', 'Last month', 'Last 3 months'] as const
type Timeframe = (typeof timeframeOptions)[number]

export interface CallListItem {
  id: string
  title: string
  date: string
  duration: string
  meetingLink?: string
  speakers?: number
  status?: string
  start?: string
  end?: string
}

function getDefaultTimeRange(): { time_min: string; time_max: string } {
  const now = new Date()
  const time_min = new Date(now)
  time_min.setDate(time_min.getDate() - 14)
  time_min.setHours(0, 0, 0, 0)
  const time_max = new Date(now)
  time_max.setDate(time_max.getDate() + 60)
  time_max.setHours(23, 59, 59, 999)
  return {
    time_min: time_min.toISOString(),
    time_max: time_max.toISOString(),
  }
}

function extractGoogleMeetId(link: string): string | null {
  try {
    const url = new URL(link)
    if (url.hostname.includes('meet.google.com')) {
      const pathParts = url.pathname.split('/').filter((p) => p)
      if (pathParts.length > 0) return pathParts[pathParts.length - 1]
    }
    return null
  } catch {
    const match = link.match(/meet\.google\.com\/([a-z-]+)/i)
    return match ? match[1] : null
  }
}

function extractTeamsInfo(link: string): { meetingId: string | null; passcode: string | null } {
  try {
    const url = new URL(link)
    if (url.hostname.includes('teams.live.com')) {
      const pathParts = url.pathname.split('/').filter((p) => p)
      const meetingId = pathParts.length > 1 ? pathParts[pathParts.length - 1] : null
      const passcode = url.searchParams.get('p')
      return { meetingId, passcode }
    }
    return { meetingId: null, passcode: null }
  } catch {
    const meetingMatch = link.match(/teams\.live\.com\/meet\/(\d+)/i)
    const passcodeMatch = link.match(/[?&]p=([^&]+)/i)
    return {
      meetingId: meetingMatch ? meetingMatch[1] : null,
      passcode: passcodeMatch ? passcodeMatch[1] : null,
    }
  }
}

const SECTION_PATH_MAP: Record<string, AtlasMainSection> = {
  calls: 'calls',
  insights: 'insights',
  todo: 'todo',
  qna: 'qna',
  knowledge: 'knowledge',
  record: 'record',
}

export default function AtlasMain() {
  const location = useLocation()
  const navigate = useNavigate()
  const pathSegment = location.pathname.split('/').pop() || 'calls'
  const section: AtlasMainSection = SECTION_PATH_MAP[pathSegment] ?? 'calls'

  const [callsList, setCallsList] = useState<CallListItem[]>([])
  const [callsLoading, setCallsLoading] = useState(false)
  const [activeCallId, setActiveCallId] = useState<string | null>(null)
  const [activeCallTab, setActiveCallTab] = useState<
    'summary' | 'playbook' | 'feedback' | 'comments'
  >('summary')
  const [summarySubOpen, setSummarySubOpen] = useState(true)
  const [summaryAccordionOpen, setSummaryAccordionOpen] = useState<Record<string, boolean>>({
    keyTakeaways: true,
    introductionOverview: true,
    currentChallenges: true,
    productFit: true,
    nextSteps: true,
    questionsObjections: true,
  })
  const [questionCardsOpen, setQuestionCardsOpen] = useState<Record<number, boolean>>({})
  const [nextStepChecked, setNextStepChecked] = useState<Record<number, boolean>>({})
  const [playbookTemplates, setPlaybookTemplates] = useState<
    Array<{ id: string; name: string; items: number; is_default: boolean }>
  >([])
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(null)
  const [selectedPlaybookName, setSelectedPlaybookName] = useState<string>('Standard Sales Playbook')
  const [playbookDropdownOpen, setPlaybookDropdownOpen] = useState(false)
  const [feedbackCoachOpen, setFeedbackCoachOpen] = useState<Record<string, boolean>>({
    didWell0: false,
    didWell1: false,
    didWell2: false,
    improve0: false,
    improve1: false,
    improve2: false,
  })
  const [_playbookTimeframe, _setPlaybookTimeframe] = useState<Timeframe>('Last week')
  const [_speakingTimeframe, _setSpeakingTimeframe] = useState<Timeframe>('Last week')
  const [_objectionTimeframe, _setObjectionTimeframe] = useState<Timeframe>('Last week')
  const [recordMode, setRecordMode] = useState<'join' | 'no_join'>('join')
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  const [insightsActiveTab, setInsightsActiveTab] = useState<'playbook' | 'speaking' | 'objection'>('playbook')
  const [insightsDateRange] = useState('Last week')
  const [todoActiveTab, setTodoActiveTab] = useState<'prioritized' | 'followups' | 'overdue'>('prioritized')
  const [todoRange, setTodoRange] = useState<'today' | 'week'>('today')
  const [knowledgeCategory, setKnowledgeCategory] = useState<
    'product' | 'pricing' | 'objection' | 'competitive' | 'faqs' | 'policies'
  >('product')
  const [_knowledgeSourceActive, _setKnowledgeSourceActive] = useState<Record<string, boolean>>({
    productOverview: true,
    technicalSpecs: true,
    featureRoadmap: true,
  })
  const [knowledgeDocumentsByCategory, setKnowledgeDocumentsByCategory] = useState<Record<string, AtlasKnowledgeDocument[]>>({})
  const [knowledgeDocumentsLoading, setKnowledgeDocumentsLoading] = useState<string | null>(null)
  const [knowledgeUploadModal, setKnowledgeUploadModal] = useState(false)
  const [knowledgeUploadFile, setKnowledgeUploadFile] = useState<File | null>(null)
  const [knowledgeUploading, setKnowledgeUploading] = useState(false)
  const knowledgeFileInputRef = useRef<HTMLInputElement>(null)
  const [isJoinMeetingModalOpen, setIsJoinMeetingModalOpen] = useState(false)
  const [joinMeetingLink, setJoinMeetingLink] = useState('')
  const [joinMeetingSubmitting, setJoinMeetingSubmitting] = useState(false)
  const [transcriptLines, setTranscriptLines] = useState<
    Array<{ speaker: string; role?: string; time: string; text: string; color: 'blue' | 'red' }>
  | null
  >(null)
  const [transcriptLoading, setTranscriptLoading] = useState(false)
  const [transcriptError, setTranscriptError] = useState<string | null>(null)
  const [transcriptSearch, setTranscriptSearch] = useState('')
  const [atlasInsightsLoading, setAtlasInsightsLoading] = useState(false)
  const [atlasInsightsError, setAtlasInsightsError] = useState<string | null>(null)
  const [atlasInsights, setAtlasInsights] = useState<{
    summary: {
      key_takeaways?: string[]
      introduction_and_overview?: string[]
      current_challenges?: string[]
      product_fit_and_capabilities?: string[]
    }
    next_steps: Array<{ assignee: string; description: string; time?: string | null }>
    questions_and_objections: Array<{ question: string; time?: string | null; answer: string }>
  } | null>(null)
  const [playbookAnalysis, setPlaybookAnalysis] = useState<MeetingPlaybookAnalysis | null>(null)
  const [playbookLoading, setPlaybookLoading] = useState(false)
  const [playbookError, setPlaybookError] = useState<string | null>(null)
  const [playbookRuleOpen, setPlaybookRuleOpen] = useState<Record<number, boolean>>({})
  const [feedbackData, setFeedbackData] = useState<MeetingFeedback | null>(null)
  const [feedbackLoading, setFeedbackLoading] = useState(false)
  const [feedbackError, setFeedbackError] = useState<string | null>(null)
  const [comments, setComments] = useState<MeetingComment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [commentsError, setCommentsError] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingCommentText, setEditingCommentText] = useState('')
  const [playbookScoresInsights, setPlaybookScoresInsights] = useState<{
    days: Array<{
      date: string
      label: string
      score_pct: number | null
      count: number
      dimension_scores?: Record<string, number> | null
    }>
  }>({ days: [] })
  const [playbookInsightsLoading, setPlaybookInsightsLoading] = useState(false)
  const [playbookInsightsError, setPlaybookInsightsError] = useState<string | null>(null)
  const [speakingScoresInsights, setSpeakingScoresInsights] = useState<{
    days: Array<{
      date: string
      label: string
      count: number
      speech_pace_wpm?: number | null
      talk_ratio_pct?: number | null
      longest_customer_monologue_sec?: number | null
      questions_asked_avg?: number | null
      filler_words_avg?: number | null
    }>
    averages: Record<string, number>
  }>({ days: [], averages: {} })
  type SpeakingMetricKey =
    | 'speech_pace_wpm'
    | 'talk_ratio_pct'
    | 'longest_customer_monologue_sec'
    | 'questions_asked_avg'
    | 'filler_words_avg'
  const [speakingMetricKey, setSpeakingMetricKey] = useState<
    SpeakingMetricKey
  >('speech_pace_wpm')
  type PlaybookMetricKey = 'overall' | 'Handled objections' | 'Personalized demo' | 'Intro Banter' | 'Set Agenda' | 'Demo told a story'
  const [playbookMetricKey, setPlaybookMetricKey] = useState<PlaybookMetricKey>('overall')
  const [speakingInsightsLoading, setSpeakingInsightsLoading] = useState(false)
  const [speakingInsightsError, setSpeakingInsightsError] = useState<string | null>(null)
  const [objectionInsights, setObjectionInsights] = useState<
    | {
        analyzed_from: string
        analyzed_to: string
        total_calls: number
        topics: Array<{
          topic: string
          pct_calls: number
          calls_count: number
          questions_count: number
          questions: Array<{
            meeting_id: string
            meeting_title?: string | null
            meeting_created_at?: string | null
            question: string
            time?: string | null
            answer: string
          }>
        }>
        generated_at: string
      }
    | null
  >(null)
  const [objectionInsightsLoading, setObjectionInsightsLoading] = useState(false)
  const [objectionInsightsError, setObjectionInsightsError] = useState<string | null>(null)
  const [objectionAnalyzing, setObjectionAnalyzing] = useState(false)
  const [qnaList, setQnaList] = useState<AtlasQnARecord[]>([])
  const [qnaTotal, setQnaTotal] = useState(0)
  const [qnaPage, setQnaPage] = useState(1)
  const qnaLimit = 50
  const [qnaLoading, setQnaLoading] = useState(false)
  const [qnaError, setQnaError] = useState<string | null>(null)
  const [qnaSearch, setQnaSearch] = useState('')
  const [qnaSearchDebounced, setQnaSearchDebounced] = useState('')
  const [qnaModalOpen, setQnaModalOpen] = useState(false)
  const [qnaEditingId, setQnaEditingId] = useState<string | null>(null)
  const [qnaFormQuestion, setQnaFormQuestion] = useState('')
  const [qnaFormAnswer, setQnaFormAnswer] = useState('')
  const [qnaDeletingId, setQnaDeletingId] = useState<string | null>(null)
  const [todoInsights, setTodoInsights] = useState<
    | {
        range_type: 'day' | 'week'
        analyzed_from: string
        analyzed_to: string
        total_calls: number
        total_items: number
        items: Array<{
          meeting_id: string
          meeting_title?: string | null
          meeting_created_at?: string | null
          assignee: string
          description: string
          time?: string | null
          status: 'open' | 'done'
          due_at?: string | null
        }>
        generated_at: string
      }
    | null
  >(null)
  const [todoInsightsLoading, setTodoInsightsLoading] = useState(false)
  const [todoInsightsError, setTodoInsightsError] = useState<string | null>(null)
  const [todoAnalyzing, setTodoAnalyzing] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setQnaSearchDebounced(qnaSearch), 400)
    return () => clearTimeout(t)
  }, [qnaSearch])

  useEffect(() => {
    if (section !== 'qna') return
    let cancelled = false
    setQnaLoading(true)
    setQnaError(null)
    atlasAPI
      .listQna({ search: qnaSearchDebounced || undefined, page: qnaPage, limit: qnaLimit })
      .then((res) => {
        if (!cancelled) {
          setQnaList(res.data.items)
          setQnaTotal(res.data.total)
        }
      })
      .catch((err) => {
        if (!cancelled) setQnaError(err.response?.data?.detail || err.message || 'Failed to load Q&A')
      })
      .finally(() => {
        if (!cancelled) setQnaLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [section, qnaSearchDebounced, qnaPage])

  const loadKnowledgeDocuments = async (cat: string) => {
    const apiCategory = KNOWLEDGE_CATEGORY_API_MAP[cat]
    if (!apiCategory) return
    try {
      setKnowledgeDocumentsLoading(cat)
      const res = await atlasAPI.getKnowledgeDocuments(apiCategory)
      const list = Array.isArray(res.data) ? res.data : []
      setKnowledgeDocumentsByCategory((prev) => ({ ...prev, [cat]: list }))
    } catch (e) {
      console.error('Failed to load knowledge documents:', e)
      toast.error('Failed to load documents')
    } finally {
      setKnowledgeDocumentsLoading(null)
    }
  }

  useEffect(() => {
    if (section === 'knowledge' && KNOWLEDGE_CATEGORY_API_MAP[knowledgeCategory]) {
      loadKnowledgeDocuments(knowledgeCategory)
    }
  }, [section, knowledgeCategory])

  const currentKnowledgeDocuments = knowledgeDocumentsByCategory[knowledgeCategory] ?? []
  useEffect(() => {
    const hasProcessing = currentKnowledgeDocuments.some((d) => d.status === 'processing')
    if (!hasProcessing || section !== 'knowledge') return
    const interval = setInterval(() => loadKnowledgeDocuments(knowledgeCategory), 5000)
    return () => clearInterval(interval)
  }, [section, knowledgeCategory, currentKnowledgeDocuments.map((d) => d.id + d.status).join(',')])

  useEffect(() => {
    if (section !== 'insights') return
    let cancelled = false
    setPlaybookInsightsLoading(true)
    setPlaybookInsightsError(null)
    meetingsAPI
      .getPlaybookScoresInsights({ days: 5 })
      .then((res) => {
        if (!cancelled) setPlaybookScoresInsights(res.data)
      })
      .catch((err) => {
        if (!cancelled) setPlaybookInsightsError(err.response?.data?.detail || err.message || 'Failed to load playbook scores')
      })
      .finally(() => {
        if (!cancelled) setPlaybookInsightsLoading(false)
      })

    setSpeakingInsightsLoading(true)
    setSpeakingInsightsError(null)
    meetingsAPI
      .getSpeakingScoresInsights({ days: 5 })
      .then((res) => {
        if (!cancelled) setSpeakingScoresInsights({ days: res.data.days || [], averages: res.data.averages || {} })
      })
      .catch((err) => {
        if (!cancelled) setSpeakingInsightsError(err.response?.data?.detail || err.message || 'Failed to load speaking scores')
      })
      .finally(() => {
        if (!cancelled) setSpeakingInsightsLoading(false)
      })

    // Load any cached objection insights snapshot (no analysis triggered here)
    setObjectionInsightsLoading(true)
    setObjectionInsightsError(null)
    meetingsAPI
      .getObjectionInsights()
      .then((res) => {
        if (!cancelled) setObjectionInsights(res.data)
      })
      .catch((err) => {
        if (!cancelled)
          setObjectionInsightsError(err.response?.data?.detail || err.message || 'Failed to load objection insights')
      })
      .finally(() => {
        if (!cancelled) setObjectionInsightsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [section])

  useEffect(() => {
    if (section !== 'todo') return
    setTodoInsightsLoading(true)
    setTodoInsightsError(null)
    const range_type = todoRange === 'today' ? 'day' : 'week'
    meetingsAPI
      .getTodoInsights({ range_type })
      .then((res) => {
        setTodoInsights(res.data)
      })
      .catch((err) => {
        setTodoInsightsError(err.response?.data?.detail || err.message || 'Failed to load to-do insights')
      })
      .finally(() => {
        setTodoInsightsLoading(false)
      })
  }, [section, todoRange])

  useEffect(() => {
    if (section !== 'calls') return
    let cancelled = false
    setCallsLoading(true)
    const { time_min, time_max } = getDefaultTimeRange()

    function meetingToCallItem(m: {
      id: string
      title: string
      link: string
      created_at?: string
      updated_at?: string
    }): CallListItem {
      const d = m.created_at || m.updated_at || ''
      const dateStr = d
        ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : '—'
      return {
        id: m.id,
        title: (m.title || '').trim() || m.id,
        date: dateStr,
        duration: '—',
        meetingLink: m.link,
      }
    }

    meetingsAPI
      .getMeetings({ limit: 100 })
      .then((res) => {
        if (cancelled) return
        const meetings = (res.data as { meetings?: Array<{ id: string; title: string; link: string; created_at?: string; updated_at?: string }> }).meetings ?? []
        const items = meetings.map(meetingToCallItem)
        setCallsList(items)
        setActiveCallId((prev) => {
          if (items.length === 0) return null
          if (prev && items.some((c) => c.id === prev)) return prev
          return items[0].id
        })
      })
      .catch(() => {
        if (!cancelled) setCallsList([])
      })
      .finally(() => {
        if (!cancelled) setCallsLoading(false)
      })

    // Load real Sales Playbook templates for dropdown
    playbooksAPI
      .list({ limit: 200 })
      .then((res) => {
        if (cancelled) return
        const templates = (res.data.templates || []).map((t) => ({
          id: t.id,
          name: t.name,
          items: (t.rules || []).length,
          is_default: t.is_default,
        }))
        setPlaybookTemplates(templates)
        const def = templates.find((t) => t.is_default) || templates[0]
        if (def) {
          setSelectedPlaybookId(def.id)
          setSelectedPlaybookName(def.name)
        }
      })
      .catch(() => {
        // Ignore; backend will still auto-generate a default on first analysis
      })

    calendarAPI
      .getEventsWithMeetingLink({ time_min, time_max })
      .then((res) => {
        if (cancelled) return
        const events = (res.data.events ?? []).filter((e: GoogleCalendarEvent) => e.id)
        const payload = events.map((e: GoogleCalendarEvent) => ({
          id: e.id,
          summary: e.summary,
          start: e.start ? { dateTime: e.start.dateTime, date: e.start.date } : undefined,
          end: e.end ? { dateTime: e.end.dateTime, date: e.end.date } : undefined,
        }))
        atlasAPI.syncCalendarEvents(payload).catch(() => {})
      })
      .catch(() => {})

    return () => {
      cancelled = true
    }
  }, [section])

  useEffect(() => {
    if (section !== 'calls' || !activeCallId) {
      setTranscriptLines(null)
      setTranscriptError(null)
      return
    }
    let cancelled = false
    setTranscriptLines(null)
    setTranscriptError(null)
    setTranscriptLoading(true)

    type TranscriptLineDb = { speaker: string; role?: string; time: string; text: string }
    function addColors(
      lines: TranscriptLineDb[]
    ): Array<{ speaker: string; role?: string; time: string; text: string; color: 'blue' | 'red' }> {
      const seen = new Map<string, 'blue' | 'red'>()
      let nextColor: 'blue' | 'red' = 'blue'
      return lines.map((line) => {
        const key = line.speaker
        if (!seen.has(key)) {
          seen.set(key, nextColor)
          nextColor = nextColor === 'blue' ? 'red' : 'blue'
        }
        return { ...line, color: seen.get(key)! }
      })
    }

    meetingsAPI
      .getMeetingTranscription(activeCallId, { refresh_ttl_seconds: 600 })
      .then((res) => {
        if (cancelled) return
        const lines = (res.data.transcript_lines ?? []) as TranscriptLineDb[]
        if (lines.length > 0) {
          setTranscriptLines(addColors(lines))
          return
        }
        // No transcript (neither Vexa nor cache)
        if (res.data.message) setTranscriptError(res.data.message)
      })
      .catch((err) => {
        if (!cancelled) {
          setTranscriptError(err.response?.data?.detail || err.message || 'Failed to load transcript')
        }
      })
      .finally(() => {
        if (!cancelled) setTranscriptLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [section, activeCallId])

  useEffect(() => {
    // Reset playbook analysis when switching meeting
    setPlaybookAnalysis(null)
    setPlaybookError(null)
    setPlaybookLoading(false)
    setPlaybookRuleOpen({})
  }, [activeCallId])

  const handleAnalyzePlaybook = async () => {
    if (section !== 'calls' || !activeCallId) return
    try {
      setPlaybookLoading(true)
      setPlaybookError(null)
      const res = await meetingsAPI.getMeetingPlaybookAnalysis(activeCallId, {
        force_refresh: true,
        template_id: selectedPlaybookId || undefined,
      })
      setPlaybookAnalysis(res.data)
      if (res.data.source === 'cache') {
        toast.success('Loaded previous playbook analysis')
      } else if (res.data.source === 'llm') {
        toast.success('Playbook analysis generated')
      } else if (res.data.source === 'none' && res.data.message) {
        setPlaybookError(res.data.message)
      }
    } catch (e: any) {
      console.error('Failed to analyze meeting against playbook', e)
      setPlaybookError(e.response?.data?.detail || 'Failed to analyze meeting against playbook')
      toast.error(e.response?.data?.detail || 'Failed to analyze meeting against playbook')
    } finally {
      setPlaybookLoading(false)
    }
  }

  // Auto-load cached playbook analysis when opening Playbook tab
  useEffect(() => {
    if (section !== 'calls') return
    if (activeCallTab !== 'playbook') return
    if (!activeCallId) return
    if (playbookAnalysis || playbookLoading) return
    // Only try to load when we already have transcript lines (LLM was possible)
    if (!transcriptLines || transcriptLines.length === 0 || transcriptLoading) return

    let cancelled = false
    setPlaybookError(null)

    meetingsAPI
      .getMeetingPlaybookAnalysis(activeCallId, {
        // Do NOT force refresh here – we want cached result if available
        template_id: selectedPlaybookId || undefined,
      })
      .then((res) => {
        if (cancelled) return
        setPlaybookAnalysis(res.data)
      })
      .catch((err: any) => {
        if (cancelled) return
        // If there's simply no analysis yet, keep UI empty; only surface real errors
        const detail = err?.response?.data?.detail
        if (detail && !String(detail).includes('no transcript')) {
          setPlaybookError(detail)
        }
      })

    return () => {
      cancelled = true
    }
  }, [
    section,
    activeCallTab,
    activeCallId,
    playbookAnalysis,
    playbookLoading,
    transcriptLines,
    transcriptLoading,
    selectedPlaybookId,
  ])

  // Auto-load Feedback tab data (metrics + AI coach) when opened
  useEffect(() => {
    if (section !== 'calls') return
    if (activeCallTab !== 'feedback') return
    if (!activeCallId) return
    // Need transcript to generate meaningful feedback
    if (!transcriptLines || transcriptLines.length === 0 || transcriptLoading) return

    let cancelled = false
    setFeedbackLoading(true)
    setFeedbackError(null)

    meetingsAPI
      .getMeetingFeedback(activeCallId)
      .then((res) => {
        if (cancelled) return
        setFeedbackData(res.data)
      })
      .catch((err: any) => {
        if (cancelled) return
        const detail = err?.response?.data?.detail
        setFeedbackError(detail || 'Failed to load feedback')
      })
      .finally(() => {
        if (!cancelled) setFeedbackLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [
    section,
    activeCallTab,
    activeCallId,
    transcriptLines,
    transcriptLoading,
  ])

  // Auto-load comments when opening Comments tab
  useEffect(() => {
    if (section !== 'calls') return
    if (activeCallTab !== 'comments') return
    if (!activeCallId) return

    let cancelled = false
    setCommentsLoading(true)
    setCommentsError(null)

    meetingsAPI
      .getMeetingComments(activeCallId)
      .then((res) => {
        if (cancelled) return
        setComments(res.data)
      })
      .catch((err: any) => {
        if (cancelled) return
        const detail = err?.response?.data?.detail
        setCommentsError(detail || 'Failed to load comments')
      })
      .finally(() => {
        if (!cancelled) setCommentsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [section, activeCallTab, activeCallId])

  const handleAddComment = async () => {
    if (!activeCallId) return
    const text = newComment.trim()
    if (!text) return
    try {
      const res = await meetingsAPI.createMeetingComment(activeCallId, { text })
      setComments((prev) => [...prev, res.data])
      setNewComment('')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to add comment')
    }
  }

  const handleStartEditComment = (c: MeetingComment) => {
    setEditingCommentId(c.id)
    setEditingCommentText(c.text)
  }

  const handleSaveEditComment = async () => {
    if (!activeCallId || !editingCommentId) return
    const text = editingCommentText.trim()
    if (!text) return
    try {
      const res = await meetingsAPI.updateMeetingComment(activeCallId, editingCommentId, { text })
      setComments((prev) => prev.map((c) => (c.id === res.data.id ? res.data : c)))
      setEditingCommentId(null)
      setEditingCommentText('')
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to update comment')
    }
  }

  const handleDeleteComment = async (commentId: string) => {
    if (!activeCallId) return
    try {
      await meetingsAPI.deleteMeetingComment(activeCallId, commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to delete comment')
    }
  }

  useEffect(() => {
    if (section !== 'calls' || !activeCallId) {
      setAtlasInsights(null)
      setAtlasInsightsError(null)
      return
    }
    // IMPORTANT: Only generate insights if we already have transcription lines.
    // If no transcription yet, keep UI empty and do NOT call LLM.
    if (transcriptLoading) return
    if (!transcriptLines || transcriptLines.length === 0) {
      setAtlasInsights(null)
      setAtlasInsightsError(null)
      setAtlasInsightsLoading(false)
      return
    }
    let cancelled = false
    setAtlasInsightsLoading(true)
    setAtlasInsightsError(null)
    meetingsAPI
      .getAtlasMeetingInsights(activeCallId)
      .then((res) => {
        if (cancelled) return
        const data = res.data
        setAtlasInsights({
          summary: data.summary || {},
          next_steps: data.next_steps || [],
          questions_and_objections: data.questions_and_objections || [],
        })
      })
      .catch((err) => {
        if (!cancelled) {
          setAtlasInsightsError(err.response?.data?.detail || err.message || 'Failed to load call insights')
        }
      })
      .finally(() => {
        if (!cancelled) setAtlasInsightsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [section, activeCallId, transcriptLoading, transcriptLines])

  useEffect(() => {
    const len = atlasInsights?.questions_and_objections?.length || 0
    setQuestionCardsOpen(() => {
      // initialize all to open when data changes
      const next: Record<number, boolean> = {}
      for (let i = 0; i < len; i++) next[i] = true
      return next
    })
  }, [atlasInsights?.questions_and_objections])

  const activeCall =
    callsList.find((c) => c.id === activeCallId) ?? callsList[0] ?? null

  const openRecordModal = () => setIsRecordModalOpen(true)
  const closeRecordModal = () => setIsRecordModalOpen(false)
  const openJoinMeetingModal = () => {
    setJoinMeetingLink('')
    setIsJoinMeetingModalOpen(true)
  }
  const closeJoinMeetingModal = () => {
    if (!joinMeetingSubmitting) setIsJoinMeetingModalOpen(false)
  }

  const handleJoinMeetingFromLink = async () => {
    const link = joinMeetingLink.trim()
    if (!link) {
      toast.error('Please paste a meeting link')
      return
    }
    const meetId = extractGoogleMeetId(link)
    const teamsInfo = extractTeamsInfo(link)
    if (meetId) {
      try {
        setJoinMeetingSubmitting(true)
        await vexaAPI.joinGoogleMeet(meetId)
        toast.success('Bot joined the meeting successfully!')
        setIsJoinMeetingModalOpen(false)
        setJoinMeetingLink('')
        try {
          await meetingsAPI.createMeeting({
            title: `Meeting ${meetId}`,
            platform: 'google_meet' as MeetingPlatform,
            link,
          })
        } catch {
          // optional: show in Call History; ignore if create fails
        }
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        toast.error(message || 'Failed to join meeting')
      } finally {
        setJoinMeetingSubmitting(false)
      }
      return
    }
    if (teamsInfo.meetingId && teamsInfo.passcode) {
      try {
        setJoinMeetingSubmitting(true)
        await vexaAPI.joinTeams(teamsInfo.meetingId, teamsInfo.passcode)
        toast.success('Bot joined the meeting successfully!')
        setIsJoinMeetingModalOpen(false)
        setJoinMeetingLink('')
        try {
          await meetingsAPI.createMeeting({
            title: `Teams meeting ${teamsInfo.meetingId}`,
            platform: 'teams' as MeetingPlatform,
            link,
          })
        } catch {
          // optional: show in Call History; ignore if create fails
        }
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        toast.error(message || 'Failed to join meeting')
      } finally {
        setJoinMeetingSubmitting(false)
      }
      return
    }
    if (teamsInfo.meetingId && !teamsInfo.passcode) {
      toast.error('Teams meeting link is missing passcode')
      return
    }
    toast.error('Invalid meeting link. Use a Google Meet or Microsoft Teams link.')
  }

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

  if (section === 'calls') {
    return (
      <>
        <div className="flex h-full bg-[#f5f5f7]">
          <div className="w-52 border-r border-gray-100 bg-white/80 backdrop-blur-sm p-4 space-y-3 overflow-y-auto shrink-0">
            <h2 className="text-[13px] font-semibold text-gray-900 mb-3 tracking-tight">Call History</h2>
            {callsLoading ? (
              <p className="text-xs text-gray-500 py-2">Loading meetings…</p>
            ) : callsList.length === 0 ? (
              <p className="text-xs text-gray-500 py-2 leading-relaxed">
                No meetings yet. Join a meeting from Record (paste link) or create one in Meetings.
              </p>
            ) : (
              callsList.map((call) => (
                <button
                  key={call.id}
                  onClick={() => setActiveCallId(call.id)}
                  className={`w-full text-left rounded-xl px-3 py-2.5 mb-1.5 flex flex-col gap-1 transition-all duration-200 ${
                    activeCallId === call.id
                      ? 'bg-white shadow-sm ring-1 ring-gray-200/80 text-gray-900'
                      : 'hover:bg-white/60 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900 truncate">{call.title || call.id}</span>
                    <ChevronRight className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                  </div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap">
                    <span>{call.date}</span>
                    <span>• {call.duration}</span>
                  </div>
                </button>
              ))
            )}
          </div>

          <div className="flex-1 flex min-h-0">
            {/* Left: call analysis */}
            <div className="flex-1 min-w-0 p-8 space-y-5 overflow-y-auto scrollbar-hide flex flex-col">
              <div>
                <button
                  onClick={() => navigate('/atlas/calls')}
                  className="text-[13px] text-gray-500 mb-2 flex items-center gap-1 hover:text-gray-700 transition-colors"
                >
                  <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                  <span>Calls</span>
                </button>
                {activeCall ? (
                  <>
                    <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">{activeCall.title || activeCall.id}</h1>
                    <div className="flex items-center gap-4 mt-3 flex-wrap text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        71% of sales playbook executed
                      </span>
                      <span>{activeCall.date}</span>
                      <span>{activeCall.duration}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-gray-400 shrink-0" />
                        2 speakers
                      </span>
                    </div>
                    {activeCall.meetingLink && (
                      <a
                        href={activeCall.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 mt-3 text-sm font-medium text-[#007AFF] hover:underline"
                      >
                        Join meeting →
                      </a>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 mt-1">Select a meeting from the list.</p>
                )}
              </div>

            {activeCall && (
              <>
                <div className="border-b border-gray-100">
                  <nav className="flex gap-8 text-[13px]">
                    {[
                      { id: 'summary', label: 'Summary' },
                      { id: 'playbook', label: 'Playbook' },
                      { id: 'feedback', label: 'Feedback' },
                      { id: 'comments', label: 'Comments' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveCallTab(tab.id as typeof activeCallTab)}
                        className={`pb-3 border-b-2 -mb-px transition-colors ${
                          activeCallTab === tab.id
                            ? 'border-gray-900 text-gray-900 font-medium'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                {activeCallTab === 'summary' && (
                  <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-3">
                      {activeCall.date} • {activeCall.duration} with client
                    </p>
                    {/* Summary (mục con) – chứa 4 mục bên trong */}
                    <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setSummarySubOpen((o) => !o)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <FileText className="h-5 w-5 text-gray-600 shrink-0" />
                        <span className="flex-1 font-medium text-gray-800">Summary</span>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-600 shrink-0 transition-transform ${
                            summarySubOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {summarySubOpen && (
                        <div className="border-t border-gray-100 bg-white px-4 pb-4 pt-3 space-y-2">
                          {/* Key Takeaways */}
                          <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                setSummaryAccordionOpen((s) => ({ ...s, keyTakeaways: !s.keyTakeaways }))
                              }
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <FileText className="h-5 w-5 text-gray-600 shrink-0" />
                              <span className="flex-1 font-medium text-gray-800">Key Takeaways</span>
                              <ChevronDown
                                className={`h-5 w-5 text-gray-600 shrink-0 transition-transform ${
                                  summaryAccordionOpen.keyTakeaways ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                            {summaryAccordionOpen.keyTakeaways && (
                              <div className="px-4 pb-4 pt-0 text-sm text-gray-700 border-t border-gray-100 bg-white">
                                {!transcriptLines || transcriptLines.length === 0 ? null : atlasInsightsLoading ? (
                                  <p className="text-xs text-gray-500 pt-3">Generating summary…</p>
                                ) : atlasInsightsError ? (
                                  <p className="text-xs text-red-600 pt-3">{atlasInsightsError}</p>
                                ) : (
                                  <ul className="list-disc list-inside space-y-1 pt-3">
                                    {(atlasInsights?.summary?.key_takeaways || []).map((t, idx) => (
                                      <li key={idx}>{t}</li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>
                          {/* Discussion Topics: Introduction and overview */}
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-3 mb-1">
                            Discussion Topics
                          </p>
                          <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                setSummaryAccordionOpen((s) => ({
                                  ...s,
                                  introductionOverview: !s.introductionOverview,
                                }))
                              }
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <FileText className="h-5 w-5 text-gray-600 shrink-0" />
                              <span className="flex-1 font-medium text-gray-800">
                                Introduction and overview
                              </span>
                              <ChevronDown
                                className={`h-5 w-5 text-gray-600 shrink-0 transition-transform ${
                                  summaryAccordionOpen.introductionOverview ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                            {summaryAccordionOpen.introductionOverview && (
                              <div className="px-4 pb-4 pt-0 text-sm text-gray-700 border-t border-gray-100 bg-white">
                                <ul className="list-disc list-inside space-y-1 pt-3">
                                  {(atlasInsights?.summary?.introduction_and_overview || []).map((t, idx) => (
                                    <li key={idx}>{t}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          {/* Current Challenges */}
                          <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                setSummaryAccordionOpen((s) => ({
                                  ...s,
                                  currentChallenges: !s.currentChallenges,
                                }))
                              }
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <FileText className="h-5 w-5 text-gray-600 shrink-0" />
                              <span className="flex-1 font-medium text-gray-800">Current Challenges</span>
                              <ChevronDown
                                className={`h-5 w-5 text-gray-600 shrink-0 transition-transform ${
                                  summaryAccordionOpen.currentChallenges ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                            {summaryAccordionOpen.currentChallenges && (
                              <div className="px-4 pb-4 pt-0 text-sm text-gray-700 border-t border-gray-100 bg-white">
                                <ul className="list-disc list-inside space-y-1 pt-3">
                                  {(atlasInsights?.summary?.current_challenges || []).map((t, idx) => (
                                    <li key={idx}>{t}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                          {/* Product Fit & Capabilities */}
                          <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                            <button
                              type="button"
                              onClick={() =>
                                setSummaryAccordionOpen((s) => ({ ...s, productFit: !s.productFit }))
                              }
                              className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                            >
                              <FileText className="h-5 w-5 text-gray-600 shrink-0" />
                              <span className="flex-1 font-medium text-gray-800">
                                Product Fit &amp; Capabilities
                              </span>
                              <ChevronDown
                                className={`h-5 w-5 text-gray-600 shrink-0 transition-transform ${
                                  summaryAccordionOpen.productFit ? 'rotate-180' : ''
                                }`}
                              />
                            </button>
                            {summaryAccordionOpen.productFit && (
                              <div className="px-4 pb-4 pt-0 text-sm text-gray-700 border-t border-gray-100 bg-white">
                                <ul className="list-disc list-inside space-y-1 pt-3">
                                  {(atlasInsights?.summary?.product_fit_and_capabilities || []).map((t, idx) => (
                                    <li key={idx}>{t}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Next Steps accordion */}
                    <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setSummaryAccordionOpen((s) => ({ ...s, nextSteps: !s.nextSteps }))
                        }
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <CheckSquare className="h-5 w-5 text-gray-600 shrink-0" />
                        <span className="flex-1 font-medium text-gray-800">Next Steps</span>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-600 shrink-0 transition-transform ${
                            summaryAccordionOpen.nextSteps ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {summaryAccordionOpen.nextSteps && (
                        <div className="px-4 pb-4 pt-3 space-y-2 border-t border-gray-100 bg-white">
                          {(atlasInsights?.next_steps || []).map((item, index) => (
                            <div
                              key={index}
                              className="flex items-start gap-3 rounded-lg bg-gray-100 border border-gray-200/80 px-4 py-3"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setNextStepChecked((prev) => ({
                                    ...prev,
                                    [index]: !prev[index],
                                  }))
                                }
                                className="mt-0.5 shrink-0 rounded border border-gray-400 w-4 h-4 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                              >
                                {nextStepChecked[index] && (
                                  <Check className="h-3 w-3 text-gray-700 stroke-[2.5]" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <span
                                  className={
                                    item.assignee === 'Anna'
                                      ? 'text-blue-600 font-medium'
                                      : 'text-amber-700 font-medium'
                                  }
                                >
                                  {item.assignee}
                                </span>
                                <span className="text-gray-700"> {item.description}</span>
                              </div>
                              <span className="text-xs text-gray-500 shrink-0 mt-0.5">
                                {item.time || '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {/* Questions and Objections accordion */}
                    <div className="rounded-xl bg-white shadow-sm border border-gray-100 overflow-hidden">
                      <button
                        type="button"
                        onClick={() =>
                          setSummaryAccordionOpen((s) => ({
                            ...s,
                            questionsObjections: !s.questionsObjections,
                          }))
                        }
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                      >
                        <HelpCircle className="h-5 w-5 text-gray-600 shrink-0" />
                        <span className="flex-1 font-medium text-gray-800">
                          Questions and Objections
                        </span>
                        <ChevronDown
                          className={`h-5 w-5 text-gray-600 shrink-0 transition-transform ${
                            summaryAccordionOpen.questionsObjections ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      {summaryAccordionOpen.questionsObjections && (
                        <div className="px-4 pb-4 pt-3 space-y-2 border-t border-gray-100">
                          {(atlasInsights?.questions_and_objections || []).map((item, index) => (
                            <div
                              key={index}
                              className="rounded-lg bg-gray-100 border border-gray-200/80 overflow-hidden"
                            >
                              <button
                                type="button"
                                onClick={() =>
                                  setQuestionCardsOpen((prev) => ({
                                    ...prev,
                                    [index]: !prev[index],
                                  }))
                                }
                                className="w-full flex items-center gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
                              >
                                <span className="flex-1 font-medium text-gray-800 text-sm">
                                  {item.question}
                                </span>
                                <ChevronDown
                                  className={`h-5 w-5 text-gray-600 shrink-0 transition-transform ${
                                    questionCardsOpen[index] ? 'rotate-180' : ''
                                  }`}
                                />
                              </button>
                              {questionCardsOpen[index] && (
                                <div className="px-4 pb-4 pt-0 text-sm text-gray-700 border-t border-gray-100">
                                  <p className="text-blue-600 text-xs font-medium pt-3 mb-1">
                                    Your answer{item.time ? ` at ${item.time}` : ''}
                                  </p>
                                  <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

            {activeCallTab === 'playbook' && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPlaybookDropdownOpen((o) => !o)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-800 hover:bg-gray-50 w-full sm:w-auto"
                    >
                      <List className="h-4 w-4 text-gray-500 shrink-0" />
                      <span className="flex-1 text-left">
                        {playbookAnalysis?.template_name || selectedPlaybookName}
                      </span>
                      {playbookDropdownOpen ? (
                        <ChevronUp className="h-4 w-4 text-gray-500 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
                      )}
                    </button>
                    {playbookDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 min-w-[280px] rounded-lg border border-gray-200 bg-white shadow-lg z-20 overflow-hidden">
                        <div className="px-4 py-2.5 border-b border-gray-100">
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                            Sales Playbook Templates
                          </p>
                        </div>
                        <div className="py-1">
                          {playbookTemplates.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setSelectedPlaybookId(opt.id)
                                setSelectedPlaybookName(opt.name)
                                setPlaybookDropdownOpen(false)
                              }}
                              className="w-full text-left px-4 py-2.5 text-sm flex items-center justify-between gap-2 hover:bg-gray-50"
                            >
                              <span
                                className={
                                  (playbookAnalysis?.template_name || selectedPlaybookName) ===
                                  opt.name
                                    ? 'font-medium text-blue-600'
                                    : 'text-gray-700'
                                }
                              >
                                {opt.name}
                              </span>
                              <span className="text-xs text-gray-500 shrink-0">
                                {opt.items} items
                              </span>
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-gray-100">
                          <button
                            type="button"
                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                          >
                            <List className="h-4 w-4 text-gray-500 shrink-0" />
                            Edit Templates
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {typeof playbookAnalysis?.overall_score === 'number' && (
                      <div className="hidden sm:flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5">
                        <CheckCircle2 className="h-4 w-4 text-blue-600" />
                        <div className="text-xs text-blue-900">
                          <span className="font-semibold">
                            {playbookAnalysis.overall_score}% playbook executed
                          </span>
                          {playbookAnalysis.coaching_summary && (
                            <span className="ml-1 text-[10px]">
                              — {playbookAnalysis.coaching_summary}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={handleAnalyzePlaybook}
                      disabled={playbookLoading}
                      className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      {playbookLoading ? 'Analyzing…' : 'Analyze this meeting'}
                    </button>
                  </div>
                </div>

                {playbookError && (
                  <div className="text-xs text-red-600">{playbookError}</div>
                )}

                {playbookAnalysis?.dimension_scores && Object.keys(playbookAnalysis.dimension_scores).length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                    {[
                      'Handled objections',
                      'Personalized demo',
                      'Intro Banter',
                      'Set Agenda',
                      'Demo told a story',
                    ].map((dim) => {
                      const pct = playbookAnalysis.dimension_scores?.[dim]
                      if (pct == null) return null
                      return (
                        <div
                          key={dim}
                          className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-center"
                        >
                          <p className="text-[11px] text-gray-600 truncate" title={dim}>
                            {dim}
                          </p>
                          <p className="text-sm font-semibold text-blue-600">{pct}%</p>
                        </div>
                      )
                    })}
                  </div>
                )}

                {playbookAnalysis && playbookAnalysis.rules.length > 0 ? (
                  <ul className="space-y-2">
                    {playbookAnalysis.rules.map((rule, index) => (
                      <li
                        key={rule.rule_id || rule.label || index}
                        className="rounded-lg border border-gray-200 bg-white"
                      >
                        <button
                          type="button"
                          onClick={() =>
                            setPlaybookRuleOpen((prev) => ({
                              ...prev,
                              [index]: !prev[index],
                            }))
                          }
                          className="w-full flex items-center gap-3 px-4 py-3 text-left"
                        >
                          {rule.passed ? (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600">
                              <Check className="h-4 w-4 stroke-[2.5]" />
                            </span>
                          ) : (
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                              <X className="h-4 w-4 stroke-[2.5]" />
                            </span>
                          )}
                          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-gray-800">{rule.label}</span>
                            {!rule.passed && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                                Key Driver
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0 text-xs text-blue-600">
                            <span>See how</span>
                            <ChevronDown
                              className={`h-4 w-4 transition-transform ${
                                playbookRuleOpen[index] ? 'rotate-180' : ''
                              }`}
                            />
                          </div>
                        </button>
                        {playbookRuleOpen[index] && (
                          <div className="border-t border-gray-100 px-4 py-3 text-xs space-y-2 bg-gray-50/60">
                            <div>
                              <div className="font-medium text-gray-700 mb-1">
                                What you said
                              </div>
                              <div className="rounded-md border border-gray-200 bg-white px-3 py-2 min-h-[34px] text-gray-700">
                                {rule.what_you_said && rule.what_you_said.trim()
                                  ? rule.what_you_said
                                  : 'No relevant quote found in transcript.'}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-gray-700 mb-1">
                                What you should say
                              </div>
                              <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 min-h-[34px] text-gray-800">
                                {rule.what_you_should_say && rule.what_you_should_say.trim()
                                  ? rule.what_you_should_say
                                  : '—'}
                              </div>
                            </div>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="rounded-lg border border-dashed border-gray-300 bg-white px-4 py-6 text-sm text-gray-500">
                    Click <span className="font-medium">“Analyze this meeting”</span> to compare the
                    transcript with your Sales Playbook and mark which rules were followed.
                  </div>
                )}
              </div>
            )}

            {activeCallTab === 'feedback' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-gray-600 shrink-0" />
                    <h3 className="text-sm font-semibold text-gray-900">Performance Metrics</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    {typeof feedbackData?.quality_score === 'number' && (
                      <div className="flex items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 py-1.5">
                        <TrendingUp className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="text-xs font-semibold text-blue-900">
                          {feedbackData.quality_score}% call quality
                        </span>
                      </div>
                    )}
                    <button
                    type="button"
                    onClick={async () => {
                      if (!activeCallId || !transcriptLines || transcriptLines.length === 0) {
                        toast.error('Transcript is required before analyzing feedback.')
                        return
                      }
                      try {
                        setFeedbackLoading(true)
                        setFeedbackError(null)
                        const res = await meetingsAPI.getMeetingFeedback(activeCallId, {
                          force_refresh: true,
                        })
                        setFeedbackData(res.data)
                        toast.success('Feedback analysis updated')
                      } catch (e: any) {
                        setFeedbackError(e.response?.data?.detail || 'Failed to analyze feedback')
                        toast.error(e.response?.data?.detail || 'Failed to analyze feedback')
                      } finally {
                        setFeedbackLoading(false)
                      }
                    }}
                    disabled={feedbackLoading}
                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  >
                    {feedbackLoading ? 'Analyzing…' : 'Analyze feedback'}
                  </button>
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white overflow-hidden divide-y divide-gray-100">
                  {feedbackLoading && (
                    <div className="px-4 py-3 text-xs text-gray-500">Loading metrics…</div>
                  )}
                  {!feedbackLoading && feedbackError && (
                    <div className="px-4 py-3 text-xs text-red-600">{feedbackError}</div>
                  )}
                  {!feedbackLoading &&
                    !feedbackError &&
                    (feedbackData?.metrics || []).map((metric, index) => {
                      const color =
                        metric.status_level === 'great'
                          ? 'text-green-600'
                          : metric.status_level === 'poor'
                            ? 'text-red-600'
                            : 'text-amber-600'
                      return (
                        <div
                          key={index}
                          className="flex items-center justify-between gap-4 px-4 py-3 bg-gray-50/80"
                        >
                          <div className="flex-1 min-w-0">
                            <span className="text-sm text-gray-700">{metric.label}: </span>
                            <span className={`text-sm font-medium ${color}`}>{metric.status}</span>
                          </div>
                          <div className="shrink-0">
                            {metric.has_link && metric.link_url ? (
                              <a
                                href={metric.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-blue-600 underline hover:text-blue-700"
                              >
                                {metric.value}
                              </a>
                            ) : (
                              <span className="text-sm text-gray-700">{metric.value}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  {!feedbackLoading &&
                    !feedbackError &&
                    (!feedbackData || feedbackData.metrics.length === 0) && (
                      <div className="px-4 py-3 text-xs text-gray-500">
                        Metrics will appear here once feedback has been generated from the
                        transcript.
                      </div>
                    )}
                </div>
                {/* AI Sales Coach feedback */}
                <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden mt-6">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                    <Sparkles className="h-5 w-5 text-gray-600 shrink-0" />
                    <h3 className="text-sm font-semibold text-gray-900">
                      AI Sales Coach feedback
                    </h3>
                  </div>
                  <div className="p-4 space-y-5">
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <ThumbsUp className="h-5 w-5 text-amber-500 shrink-0" />
                        <h4 className="text-sm font-medium text-gray-900">What you did well</h4>
                      </div>
                      <ul className="space-y-2">
                        {(feedbackData?.did_well || []).map((item, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              onClick={() =>
                                setFeedbackCoachOpen((s) => ({
                                  ...s,
                                  [`didWell${i}`]: !s[`didWell${i}` as keyof typeof s],
                                }))
                              }
                              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-gray-200 bg-white text-left text-sm text-gray-800 hover:bg-gray-50"
                            >
                              <span>{item.title}</span>
                              <ChevronDown
                                className={`h-4 w-4 text-blue-600 shrink-0 transition-transform ${
                                  feedbackCoachOpen[`didWell${i}` as keyof typeof feedbackCoachOpen]
                                    ? 'rotate-180'
                                    : ''
                                }`}
                              />
                            </button>
                            {feedbackCoachOpen[`didWell${i}` as keyof typeof feedbackCoachOpen] &&
                              item.details && (
                                <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 text-xs text-gray-600">
                                  {item.details}
                                </div>
                              )}
                          </li>
                        ))}
                        {!feedbackLoading &&
                          (!feedbackData || feedbackData.did_well.length === 0) && (
                            <li className="text-xs text-gray-500 px-1">
                              Positive coaching points will appear here after feedback is generated.
                            </li>
                          )}
                      </ul>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="h-5 w-5 text-orange-500 shrink-0" />
                        <h4 className="text-sm font-medium text-gray-900">
                          Where you can improve
                        </h4>
                      </div>
                      <ul className="space-y-2">
                        {(feedbackData?.improve || []).map((item, i) => (
                          <li key={i}>
                            <button
                              type="button"
                              onClick={() =>
                                setFeedbackCoachOpen((s) => ({
                                  ...s,
                                  [`improve${i}`]: !s[`improve${i}` as keyof typeof s],
                                }))
                              }
                              className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-lg border border-gray-200 bg-white text-left text-sm text-gray-800 hover:bg-gray-50"
                            >
                              <span>{item.title}</span>
                              <ChevronDown
                                className={`h-4 w-4 text-blue-600 shrink-0 transition-transform ${
                                  feedbackCoachOpen[`improve${i}` as keyof typeof feedbackCoachOpen]
                                    ? 'rotate-180'
                                    : ''
                                }`}
                              />
                            </button>
                            {feedbackCoachOpen[`improve${i}` as keyof typeof feedbackCoachOpen] &&
                              item.details && (
                                <div className="mt-1 ml-4 pl-4 border-l-2 border-gray-200 text-xs text-gray-600">
                                  {item.details}
                                </div>
                              )}
                          </li>
                        ))}
                        {!feedbackLoading &&
                          (!feedbackData || feedbackData.improve.length === 0) && (
                            <li className="text-xs text-gray-500 px-1">
                              Coaching opportunities will appear here after feedback is generated.
                            </li>
                          )}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeCallTab === 'comments' && (
              <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Comments</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {commentsLoading && (
                    <div className="text-xs text-gray-500 px-1">Loading comments…</div>
                  )}
                  {commentsError && (
                    <div className="text-xs text-red-600 px-1">{commentsError}</div>
                  )}
                  {!commentsLoading && comments.length === 0 && !commentsError && (
                    <div className="flex flex-col items-center justify-center py-6 px-4 border border-dashed border-gray-300 rounded-lg bg-white">
                      <div className="relative flex items-center justify-center mb-3">
                        <MessageCircle
                          className="h-10 w-10 text-blue-200 stroke-[1.5]"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                        <MessageCircle
                          className="absolute h-6 w-6 text-blue-500 stroke-[1.5]"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </div>
                      <p className="text-sm font-semibold text-gray-800 mb-1 text-center">
                        No comments yet
                      </p>
                      <p className="text-xs text-gray-500 text-center max-w-xs">
                        Use the box below to leave internal notes or coaching feedback for this
                        meeting.
                      </p>
                    </div>
                  )}
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-gray-500">
                          <span className="font-medium text-gray-800">{c.author}</span>{' '}
                          <span className="mx-1">•</span>
                          <span>
                            {new Date(c.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleStartEditComment(c)}
                            className="text-xs text-gray-400 hover:text-gray-700 px-1"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-xs text-red-400 hover:text-red-600 px-1"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                      {editingCommentId === c.id ? (
                        <div className="space-y-2 mt-1">
                          <textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            rows={2}
                            className="w-full text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                          <div className="flex items-center justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(null)
                                setEditingCommentText('')
                              }}
                              className="px-2 py-0.5 rounded-md border border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEditComment}
                              className="px-2 py-0.5 rounded-md bg-blue-600 text-white hover:bg-blue-700"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-800 text-sm mt-0.5">{c.text}</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 border-t border-gray-200 pt-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Add a comment
                  </label>
                  <div className="flex items-end gap-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      placeholder="Write an internal note or coaching suggestion for this meeting..."
                      className="flex-1 text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-3 py-2 rounded-md bg-blue-600 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}
              </>
            )}
            </div>

            {/* Right: transcript & media */}
            {activeCall && (
              <div className="w-[420px] border-l border-gray-100 bg-white/80 backdrop-blur-sm flex flex-col shrink-0 overflow-hidden shadow-sm">
                <div className="flex items-center justify-end p-3 border-b border-gray-100">
                  <button
                    type="button"
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-4 border-b border-gray-200 space-y-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                      aria-label="Play"
                    >
                      <Play className="h-4 w-4 ml-0.5" />
                    </button>
                    <span className="text-sm text-gray-500 tabular-nums">00:00</span>
                    <span className="text-sm text-gray-400">/</span>
                    <span className="text-sm text-gray-600 tabular-nums">{activeCall.duration.replace(/\s/g, '')}</span>
                    <div className="flex-1" />
                    <button type="button" className="p-2 text-gray-500 hover:text-gray-700 rounded" aria-label="Screen share">
                      <Monitor className="h-4 w-4" />
                    </button>
                    <button type="button" className="p-2 text-gray-500 hover:text-gray-700 rounded" aria-label="Volume">
                      <Volume2 className="h-4 w-4" />
                    </button>
                  </div>
                  <button type="button" className="text-xs text-blue-600 hover:text-blue-700">
                    Show video
                  </button>
                </div>
                <div className="px-4 py-2 border-b border-gray-200">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transcript"
                      value={transcriptSearch}
                      onChange={(e) => setTranscriptSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 relative">
                  {transcriptLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-[#007AFF]" />
                    </div>
                  ) : transcriptError ? (
                    <div className="py-8 text-center">
                      <p className="text-sm text-red-600">{transcriptError}</p>
                      <p className="text-xs text-gray-500 mt-1">Transcription will be fetched when available.</p>
                    </div>
                  ) : transcriptLines && transcriptLines.length > 0 ? (
                    <ul className="space-y-4">
                      {transcriptLines
                        .filter(
                          (line) =>
                            !transcriptSearch.trim() ||
                            line.speaker.toLowerCase().includes(transcriptSearch.trim().toLowerCase()) ||
                            line.text.toLowerCase().includes(transcriptSearch.trim().toLowerCase())
                        )
                        .map((line, i) => (
                          <li key={i} className="flex gap-3">
                            <span
                              className={`shrink-0 mt-1.5 h-2 w-2 rounded-full ${
                                line.color === 'blue' ? 'bg-blue-500' : 'bg-red-500'
                              }`}
                              aria-hidden
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-gray-800">
                                <span className="font-medium">
                                  {line.speaker}
                                  {line.role && (
                                    <span className="font-normal text-gray-500"> ({line.role})</span>
                                  )}
                                </span>
                                <span className="text-gray-500 tabular-nums ml-1">{line.time}</span>
                              </p>
                              <p className="text-sm text-gray-700 mt-0.5">{line.text}</p>
                            </div>
                          </li>
                        ))}
                    </ul>
                  ) : (
                    <div className="py-8 text-center text-sm text-gray-500">
                      No transcript yet. Transcription is loaded when you open this call.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </>
    )
  }

  if (section === 'insights') {
    const insightsTabs = [
      { id: 'playbook' as const, label: 'Sales Playbook' },
      { id: 'speaking' as const, label: 'Speaking Skills' },
      { id: 'objection' as const, label: 'Objection Handling' },
    ]
    type ValueColor = 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'gray'

    const playbookDimensionKeys = [
      'Handled objections',
      'Personalized demo',
      'Intro Banter',
      'Set Agenda',
      'Demo told a story',
    ] as const
    const days = playbookScoresInsights.days
    const nDays = days.length
    const overallAvgPct =
      nDays === 0
        ? null
        : Math.round(
            days.reduce((sum, d) => sum + (d.score_pct != null ? d.score_pct : 0), 0) / nDays
          )
    const dimensionAvgPct: Record<string, number> = {}
    playbookDimensionKeys.forEach((dim) => {
      dimensionAvgPct[dim] =
        nDays === 0
          ? 0
          : Math.round(
              days.reduce((sum, d) => sum + (d.dimension_scores?.[dim] ?? 0), 0) / nDays
            )
    })
    const valueColorFromPct = (pct: number): ValueColor => {
      if (pct >= 80) return 'blue'
      if (pct >= 60) return 'green'
      if (pct >= 50) return 'yellow'
      if (pct >= 30) return 'orange'
      if (pct > 0) return 'red'
      return 'gray'
    }
    const basePlaybookMetrics: Array<{
      name: string
      metricKey: PlaybookMetricKey
      showBar: boolean
    }> = [
      { name: 'Overall', metricKey: 'overall', showBar: true },
      { name: 'Handled objections', metricKey: 'Handled objections', showBar: false },
      { name: 'Personalized demo', metricKey: 'Personalized demo', showBar: false },
      { name: 'Intro Banter', metricKey: 'Intro Banter', showBar: false },
      { name: 'Set Agenda', metricKey: 'Set Agenda', showBar: false },
      { name: 'Demo told a story', metricKey: 'Demo told a story', showBar: false },
    ]
    const playbookMetrics = basePlaybookMetrics.map((m) => ({
      name: m.name,
      metricKey: m.metricKey,
      value: '0%',
      unit: 'Avg.',
      showBar: m.showBar,
      blueUnderline: m.metricKey === playbookMetricKey,
      valueColor: 'gray' as const,
    }))
    const playbookMetricsWithData = basePlaybookMetrics.map((m) => {
      const key = m.metricKey
      const rawPct =
        key === 'overall'
          ? overallAvgPct
          : dimensionAvgPct[key] ?? 0
      return {
        name: m.name,
        metricKey: m.metricKey,
        value: `${rawPct != null ? rawPct : 0}%`,
        unit: 'Avg.',
        showBar: m.showBar,
        blueUnderline: m.metricKey === playbookMetricKey,
        valueColor: valueColorFromPct(rawPct ?? 0) as ValueColor,
      }
    })
    const playbookChartData = playbookScoresInsights.days.map((d) => {
      const raw =
        playbookMetricKey === 'overall'
          ? d.score_pct
          : (d.dimension_scores || {})[playbookMetricKey] ?? null
      return {
        label: d.label,
        y: raw != null ? raw : 0,
      }
    })
    const speakingMetricConfigs: Record<
      'speech_pace_wpm' | 'talk_ratio_pct' | 'longest_customer_monologue_sec' | 'questions_asked_avg' | 'filler_words_avg',
      { field: string; title: string; maxY: number; ticks: number[] }
    > = {
      speech_pace_wpm: {
        field: 'speech_pace_wpm',
        title: 'Words per minute across calls',
        maxY: 200,
        ticks: [0, 50, 100, 150, 200],
      },
      talk_ratio_pct: {
        field: 'talk_ratio_pct',
        title: 'Talk ratio across calls',
        maxY: 100,
        ticks: [0, 25, 50, 75, 100],
      },
      longest_customer_monologue_sec: {
        field: 'longest_customer_monologue_sec',
        title: 'Longest customer monologue across calls (sec)',
        maxY: 300,
        ticks: [0, 75, 150, 225, 300],
      },
      questions_asked_avg: {
        field: 'questions_asked_avg',
        title: 'Questions asked per call (avg)',
        maxY: 10,
        ticks: [0, 2, 4, 6, 8],
      },
      filler_words_avg: {
        field: 'filler_words_avg',
        title: 'Filler words per call (avg)',
        maxY: 400,
        ticks: [0, 100, 200, 300, 400],
      },
    }
    const currentSpeakingConfig =
      speakingMetricConfigs[speakingMetricKey] ?? speakingMetricConfigs.speech_pace_wpm

    const baseSpeakingMetrics = [
      { name: 'Speech pace', metricKey: 'speech_pace_wpm' as const, value: '0', unit: 'wpm Avg.', showBar: true, blueUnderline: false, valueColor: 'gray' as const },
      { name: 'Talk ratio', metricKey: 'talk_ratio_pct' as const, value: '0%', unit: 'Avg.', showBar: true, blueUnderline: false, valueColor: 'gray' as const },
      { name: 'Longest customer monologue', metricKey: 'longest_customer_monologue_sec' as const, value: '0', unit: 'sec. Avg.', showBar: false, blueUnderline: false, valueColor: 'gray' as const },
      { name: 'Questions asked', metricKey: 'questions_asked_avg' as const, value: '0', unit: 'Avg.', showBar: false, blueUnderline: false, valueColor: 'gray' as const },
      { name: 'Filler words', metricKey: 'filler_words_avg' as const, value: '0', unit: 'Avg.', showBar: false, blueUnderline: false, valueColor: 'gray' as const },
    ]
    const speakingMetrics = baseSpeakingMetrics.map((m) => ({
      ...m,
      blueUnderline: m.metricKey === speakingMetricKey,
    }))
    const avg = speakingScoresInsights.averages || {}
    const speakingHasData =
      speakingScoresInsights.days.some(
        (d) =>
          d.count > 0 &&
          (d.speech_pace_wpm != null ||
            d.talk_ratio_pct != null ||
            d.longest_customer_monologue_sec != null ||
            d.questions_asked_avg != null ||
            d.filler_words_avg != null),
      ) || Object.keys(avg).length > 0
    const speakingColor = (key: string, val: number): 'blue' | 'green' | 'yellow' | 'orange' | 'red' | 'gray' => {
      if (key === 'speech_pace_wpm') return val >= 100 && val <= 180 ? 'green' : val >= 80 && val < 100 ? 'yellow' : val > 180 ? 'orange' : val < 80 ? 'red' : 'gray'
      if (key === 'talk_ratio_pct') return valueColorFromPct(val)
      if (key === 'longest_customer_monologue_sec') return val <= 45 ? 'green' : val <= 90 ? 'yellow' : 'orange'
      if (key === 'questions_asked_avg') return val >= 5 ? 'green' : val >= 2 ? 'yellow' : 'gray'
      if (key === 'filler_words_avg') return val <= 20 ? 'green' : val <= 40 ? 'yellow' : val <= 60 ? 'orange' : 'red'
      return 'gray'
    }
    const speakingMetricsWithData = baseSpeakingMetrics.map((m) => {
      const key = m.metricKey
      const rawVal =
        key === 'speech_pace_wpm'
          ? avg.speech_pace_wpm
          : key === 'talk_ratio_pct'
            ? avg.talk_ratio_pct
            : key === 'longest_customer_monologue_sec'
              ? avg.longest_customer_monologue_sec
              : key === 'questions_asked_avg'
                ? avg.questions_asked_avg
                : avg.filler_words_avg
      const formattedValue =
        key === 'talk_ratio_pct'
          ? rawVal != null
            ? `${Math.round(rawVal)}%`
            : '0%'
          : rawVal != null
            ? String(Math.round(rawVal))
            : '0'
      return {
        ...m,
        value: formattedValue,
        valueColor: speakingColor(key, rawVal ?? 0),
        blueUnderline: key === speakingMetricKey,
      }
    })
    const speakingChartData = speakingScoresInsights.days.map((d) => {
      const field = currentSpeakingConfig.field as keyof (typeof speakingScoresInsights)['days'][number]
      const raw = (d as any)[field]
      return {
        label: d.label,
        y: raw != null ? Number(raw) : 0,
      }
    })
    const objectionMetrics = [
      { name: 'Overall', value: '0%', unit: 'Avg.', showBar: true, blueUnderline: true, valueColor: 'gray' as const },
      { name: 'Objections addressed', value: '0%', unit: 'Avg.', showBar: false, blueUnderline: false, valueColor: 'gray' as const },
    ]
    const insightsSubtitle = {
      playbook:
        'The graph below measures your playbook performance for each call, over time. Click a metric card to change the graph.',
      speaking:
        'The graph below measures speaking skills for each call, over time. Click a metric card to change the graph.',
      objection:
        "Below is a list of the questions and objections you've been asked most often across your calls, grouped by topic.",
    }
    const metricsByTab =
      insightsActiveTab === 'playbook'
        ? playbookMetrics
        : insightsActiveTab === 'speaking'
          ? speakingMetrics
          : objectionMetrics
    const displayMetrics =
      insightsActiveTab === 'playbook' && nDays > 0
        ? playbookMetricsWithData
        : insightsActiveTab === 'playbook'
          ? playbookMetrics
          : insightsActiveTab === 'speaking' && speakingHasData
            ? speakingMetricsWithData
            : metricsByTab
    const valueColorClass = (c: string) =>
      c === 'blue'
        ? 'text-blue-600'
        : c === 'green'
          ? 'text-emerald-600'
          : c === 'yellow'
            ? 'text-amber-500'
            : c === 'orange'
              ? 'text-orange-500'
              : c === 'red'
                ? 'text-red-600'
                : 'text-gray-700'

    return (
      <div className="p-8 h-full overflow-y-auto relative bg-[#f5f5f7]">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 tracking-tight">Insights across calls</h1>
            <p className="text-[13px] text-gray-600 mt-1.5 leading-relaxed max-w-xl">
              {insightsSubtitle[insightsActiveTab]}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {}}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200/80 bg-white text-[13px] text-gray-700 hover:bg-gray-50 shrink-0 shadow-sm transition-colors"
          >
            <Calendar className="h-4 w-4 text-gray-500" />
            {insightsDateRange}
            <ChevronDown className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        <nav className="flex gap-8 border-b border-gray-100 mb-6">
          {insightsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setInsightsActiveTab(tab.id)}
              className={`pb-3 border-b-2 -mb-px text-[13px] transition-colors ${
                insightsActiveTab === tab.id
                  ? 'border-gray-900 text-gray-900 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {insightsActiveTab === 'objection' ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                % of calls in which prospects raised questions about each topic
              </p>
              <button
                type="button"
                onClick={() => {
                  // Khi bấm Analyze: xoá snapshot cũ trên UI, reset lỗi và chạy phân tích lại
                  setObjectionAnalyzing(true)
                  setObjectionInsightsError(null)
                  setObjectionInsights(null)
                  meetingsAPI
                    .analyzeObjectionInsights({ days: 5 })
                    .then((res) => {
                      setObjectionInsights(res.data)
                    })
                    .catch((err) => {
                      setObjectionInsightsError(
                        err.response?.data?.detail || err.message || 'Failed to analyze objections',
                      )
                    })
                    .finally(() => setObjectionAnalyzing(false))
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-gray-200 bg-white text-[12px] text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              >
                {objectionAnalyzing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[#007AFF]" />
                ) : (
                  <Sparkles className="h-3.5 w-3.5 text-[#007AFF]" />
                )}
                Analyze last 5 days
              </button>
            </div>
            {objectionInsightsError && (
              <p className="text-[13px] text-red-600 mb-2">{objectionInsightsError}</p>
            )}
            {objectionInsightsLoading && !objectionInsights && (
              <div className="flex items-center justify-center h-40 text-[13px] text-gray-500">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading objection insights…
              </div>
            )}
            {!objectionInsightsLoading &&
              objectionInsights &&
              objectionInsights.topics &&
              objectionInsights.topics.length === 0 && (
                <div className="flex items-center justify-center h-40 text-[13px] text-gray-500">
                  No objections found in the last 5 days. Analyze more calls to see patterns here.
                </div>
              )}
            {!objectionInsightsLoading &&
              objectionInsights &&
              objectionInsights.topics &&
              objectionInsights.topics.length > 0 && (
                <ul className="space-y-3">
                  {objectionInsights.topics.map((topic) => (
                    <li key={topic.topic} className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
                      <details open className="group">
                        <summary className="list-none flex items-center gap-3 px-4 py-3.5 cursor-pointer hover:bg-gray-50">
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-1 text-[13px] font-medium ${
                              topic.pct_calls >= 75
                                ? 'bg-emerald-50 text-emerald-600'
                                : topic.pct_calls >= 50
                                  ? 'bg-amber-50 text-amber-600'
                                  : 'bg-sky-50 text-sky-600'
                            }`}
                          >
                            {Math.round(topic.pct_calls)}%
                          </span>
                          <span className="flex-1 text-[13px] font-medium text-gray-900">{topic.topic}</span>
                          <span className="text-[11px] text-gray-500">
                            {topic.calls_count} calls · {topic.questions_count} questions
                          </span>
                          <ChevronDown className="h-4 w-4 text-gray-400 shrink-0 transition-transform group-open:rotate-180" />
                        </summary>
                        <div className="border-t border-gray-100 bg-gray-50/70">
                          <ul className="divide-y divide-gray-100">
                            {topic.questions.map((q) => (
                              <li key={`${q.meeting_id}-${q.question.slice(0, 40)}`} className="px-4 py-3.5">
                                <p className="text-[12px] text-gray-500 mb-1">
                                  <span className="font-medium text-gray-700">
                                    {q.meeting_title || 'Call'}
                                  </span>
                                  {q.time && (
                                    <span>
                                      {' '}
                                      at{' '}
                                      <span className="text-[#007AFF] font-medium">
                                        {q.time}
                                      </span>
                                    </span>
                                  )}
                                </p>
                                <p className="text-[13px] text-gray-900 mb-1">{q.question}</p>
                                {q.answer && (
                                  <p className="text-[12px] text-gray-600">
                                    Suggested answer:&nbsp;
                                    <span className="text-gray-800">{q.answer}</span>
                                  </p>
                                )}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </details>
                    </li>
                  ))}
                </ul>
              )}
          </>
        ) : (
          <>
            {insightsActiveTab === 'playbook' && (playbookInsightsLoading || playbookInsightsError) && (
              <div className="mb-3 flex items-center gap-2 text-[13px]">
                {playbookInsightsLoading && (
                  <span className="flex items-center gap-1.5 text-gray-500">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading 5-day averages…
                  </span>
                )}
                {playbookInsightsError && !playbookInsightsLoading && (
                  <span className="text-red-600">{playbookInsightsError}</span>
                )}
              </div>
            )}
            {/* Thông số: cùng layout grid thẻ như Speaking Skills cho cả Sales Playbook và Speaking */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
              {displayMetrics.map((m) => {
                const metricKey = (m as any).metricKey as
                  | SpeakingMetricKey
                  | PlaybookMetricKey
                  | undefined
                const isSpeakingMetric = insightsActiveTab === 'speaking' && !!metricKey && (['speech_pace_wpm','talk_ratio_pct','longest_customer_monologue_sec','questions_asked_avg','filler_words_avg'] as SpeakingMetricKey[]).includes(metricKey as SpeakingMetricKey)
                const isPlaybookMetric = insightsActiveTab === 'playbook' && !!metricKey && (['overall','Handled objections','Personalized demo','Intro Banter','Set Agenda','Demo told a story'] as PlaybookMetricKey[]).includes(metricKey as PlaybookMetricKey)
                return (
                  <div
                    key={m.name}
                    className={`flex flex-col rounded-xl border bg-white shadow-sm py-4 px-4 transition-colors border-gray-100 hover:border-gray-200 ${
                      isSpeakingMetric || isPlaybookMetric ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (isSpeakingMetric && metricKey) {
                        setSpeakingMetricKey(metricKey as SpeakingMetricKey)
                      } else if (isPlaybookMetric && metricKey) {
                        setPlaybookMetricKey(metricKey as PlaybookMetricKey)
                      }
                    }}
                  >
                  <div className="flex items-center justify-center gap-1 mb-2">
                    <span className="text-[12px] font-medium text-gray-800 truncate text-center">{m.name}</span>
                    <button type="button" className="p-0.5 text-gray-400 hover:text-gray-600 rounded-full shrink-0" aria-label="Info">
                      <Info className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <p className={`text-xl font-semibold tabular-nums text-center ${valueColorClass((m as { valueColor?: string }).valueColor ?? 'gray')}`}>
                    {(insightsActiveTab === 'playbook' && playbookInsightsLoading) || (insightsActiveTab === 'speaking' && speakingInsightsLoading) ? '—' : m.value}
                  </p>
                  <p className="text-[11px] text-gray-600 mt-0.5 text-center">{m.unit}</p>
                  {m.blueUnderline && (
                    <div className="mt-3 h-0.5 bg-[#007AFF] rounded-full w-full shrink-0 mx-auto" />
                  )}
                </div>
                )
              })}
            </div>

            <div className="relative min-h-[620px] rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col overflow-hidden">
              {insightsActiveTab === 'playbook' ? (
                <>
                  <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-[#007AFF] text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                    <h3 className="text-[13px] font-medium text-gray-900">
                      Average % of playbook completed across calls (last 5 days)
                    </h3>
                  </div>
                  <div className="flex px-5 pb-5 pt-1">
                    {playbookInsightsLoading && (
                      <div className="flex-1 flex items-center justify-center h-[400px] text-[13px] text-gray-500">
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading playbook scores…
                        </span>
                      </div>
                    )}
                    {!playbookInsightsLoading && playbookInsightsError && (
                      <div className="flex-1 flex items-center justify-center h-[400px] text-[13px] text-red-600">
                        {playbookInsightsError}
                      </div>
                    )}
                    {!playbookInsightsLoading && !playbookInsightsError && (
                      <>
                        <div className="flex flex-col justify-between h-[400px] text-[11px] text-gray-400 mr-3 shrink-0 tabular-nums font-medium">
                          <span>100%</span>
                          <span>75%</span>
                          <span>50%</span>
                          <span>25%</span>
                          <span>0%</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="h-[400px] w-full">
                            <svg viewBox="0 0 640 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                              <defs>
                                <linearGradient id="chartFillPlaybook" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="rgb(0 122 255 / 0.08)" />
                                  <stop offset="100%" stopColor="rgb(0 122 255 / 0)" />
                                </linearGradient>
                              </defs>
                              {playbookChartData.length === 0 ? (
                                <g>
                                  <text x="320" y="120" textAnchor="middle" className="text-sm fill-gray-400">
                                    No playbook scores for the last 5 days. Analyze meetings in Calls to see scores here.
                                  </text>
                                </g>
                              ) : (
                                (() => {
                                  const pts = playbookChartData
                                  const w = 600
                                  const viewH = 240
                                  const padLeft = 20
                                  const padTop = 15
                                  const padBottom = 25
                                  const chartH = viewH - padTop - padBottom
                                  const xScale = (i: number) => padLeft + (i / Math.max(pts.length - 1, 1)) * w
                                  const yScale = (v: number) => padTop + chartH - (v / 100) * chartH
                                  const x = (i: number) => xScale(i)
                                  const y = (i: number) => yScale(pts[i].y)
                                  let smoothD = `M ${x(0)} ${y(0)}`
                                  for (let i = 0; i < pts.length - 1; i++) {
                                    const dx = x(i + 1) - x(i)
                                    const cp1x = x(i) + dx / 3
                                    const cp2x = x(i + 1) - dx / 3
                                    smoothD += ` C ${cp1x} ${y(i)} ${cp2x} ${y(i + 1)} ${x(i + 1)} ${y(i + 1)}`
                                  }
                                  const areaD = `${smoothD} L ${x(pts.length - 1)} ${padTop + chartH} L ${x(0)} ${padTop + chartH} Z`
                                  return (
                                    <g>
                                      {[0, 25, 50, 75, 100].map((pct) => {
                                        const yPos = padTop + chartH - (pct / 100) * chartH
                                        return (
                                          <line
                                            key={pct}
                                            x1={padLeft}
                                            y1={yPos}
                                            x2={padLeft + w}
                                            y2={yPos}
                                            stroke="#e5e7eb"
                                            strokeWidth="0.6"
                                            strokeDasharray="4 3"
                                          />
                                        )
                                      })}
                                      <path d={areaD} fill="url(#chartFillPlaybook)" />
                                      <path
                                        d={smoothD}
                                        fill="none"
                                        stroke="#007AFF"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      {pts.map((p, i) => (
                                        <circle
                                          key={i}
                                          cx={xScale(i)}
                                          cy={yScale(p.y)}
                                          r="3"
                                          fill="#007AFF"
                                          stroke="white"
                                          strokeWidth="1.5"
                                        />
                                      ))}
                                    </g>
                                  )
                                })()
                              )}
                            </svg>
                          </div>
                          <div className="flex justify-between mt-2 text-[11px] text-gray-500 tabular-nums font-medium">
                            {playbookChartData.map((p, i) => (
                              <span key={i}>{p.label}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 shrink-0 ml-2 self-center">
                          <button type="button" className="p-1.5 rounded-lg text-gray-400 hover:text-[#007AFF] hover:bg-gray-50" aria-label="Filter">
                            <Droplet className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" className="p-1.5 rounded-lg text-gray-400 hover:text-[#007AFF] hover:bg-gray-50" aria-label="Export">
                            <Droplet className="h-3.5 w-3.5" />
                          </button>
                          <button type="button" className="p-1.5 rounded-lg text-gray-400 hover:text-[#007AFF] hover:bg-gray-50" aria-label="Add">
                            <Plus className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : insightsActiveTab === 'speaking' ? (
                <>
                  <div className="px-5 pt-4 pb-2 flex items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-[#007AFF] text-white">
                      <Check className="h-2.5 w-2.5 stroke-[3]" />
                    </span>
                    <h3 className="text-[13px] font-medium text-gray-900">
                      {currentSpeakingConfig.title}
                    </h3>
                  </div>
                  <div className="flex px-5 pb-5 pt-1">
                    {speakingInsightsLoading && (
                      <div className="flex-1 flex items-center justify-center h-[400px] text-[13px] text-gray-500">
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading speaking scores…
                        </span>
                      </div>
                    )}
                    {!speakingInsightsLoading && speakingInsightsError && (
                      <div className="flex-1 flex items-center justify-center h-[400px] text-[13px] text-red-600">
                        {speakingInsightsError}
                      </div>
                    )}
                    {!speakingInsightsLoading && !speakingInsightsError && !speakingHasData && (
                      <div className="flex-1 flex items-center justify-center h-[400px]">
                        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm max-w-sm">
                          <TrendingUp className="h-12 w-12 text-[#007AFF] mx-auto mb-4" />
                          <p className="text-base font-semibold text-gray-900 mb-2 tracking-tight">No speaking metrics yet</p>
                          <p className="text-sm text-gray-500 mb-4">Analyze feedback in Calls to see Speech pace, Talk ratio, and more here.</p>
                        </div>
                      </div>
                    )}
                    {!speakingInsightsLoading && !speakingInsightsError && speakingHasData && (
                    <>
                    <div className="flex flex-col justify-between h-[400px] text-[11px] text-gray-400 mr-3 shrink-0 tabular-nums font-medium">
                      {[...currentSpeakingConfig.ticks].sort((a, b) => b - a).map((val) => (
                        <span key={val}>{val}</span>
                      ))}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="h-[400px] w-full">
                        <svg viewBox="0 0 640 240" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
                          <defs>
                            <linearGradient id="chartFillSpeaking" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="rgb(0 122 255 / 0.08)" />
                              <stop offset="100%" stopColor="rgb(0 122 255 / 0)" />
                            </linearGradient>
                          </defs>
                          {speakingChartData.length === 0 ? (
                            <g>
                              <text x="320" y="120" textAnchor="middle" className="text-sm fill-gray-400">
                                No speaking scores for the last 5 days. Analyze feedback in Calls to see scores here.
                              </text>
                            </g>
                          ) : (
                            (() => {
                              const pts = speakingChartData
                              const minY = 0
                              const maxY = 200
                              const w = 600
                              const viewH = 240
                              const padLeft = 20
                              const padTop = 15
                              const padBottom = 25
                              const chartH = viewH - padTop - padBottom
                              const clamp = (v: number) => Math.min(Math.max(v, minY), maxY)
                              const xScale = (i: number) => padLeft + (i / Math.max(pts.length - 1, 1)) * w
                              const yScale = (v: number) => padTop + chartH - (clamp(v) / maxY) * chartH
                              const x = (i: number) => xScale(i)
                              const y = (i: number) => yScale(pts[i].y)
                              let smoothD = `M ${x(0)} ${y(0)}`
                              for (let i = 0; i < pts.length - 1; i++) {
                                const dx = x(i + 1) - x(i)
                                const cp1x = x(i) + dx / 3
                                const cp2x = x(i + 1) - dx / 3
                                smoothD += ` C ${cp1x} ${y(i)} ${cp2x} ${y(i + 1)} ${x(i + 1)} ${y(i + 1)}`
                              }
                              const areaD = `${smoothD} L ${x(pts.length - 1)} ${padTop + chartH} L ${x(0)} ${padTop + chartH} Z`
                              return (
                                <g>
                                  {[0, 50, 100, 150, 200].map((val) => {
                                    const yPos = yScale(val)
                                    return (
                                      <line
                                        key={val}
                                        x1={padLeft}
                                        y1={yPos}
                                        x2={padLeft + w}
                                        y2={yPos}
                                        stroke="#e5e7eb"
                                        strokeWidth="0.6"
                                        strokeDasharray="4 3"
                                      />
                                    )
                                  })}
                                  <path d={areaD} fill="url(#chartFillSpeaking)" />
                                  <path
                                    d={smoothD}
                                    fill="none"
                                    stroke="#007AFF"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                  />
                                  {pts.map((p, i) => (
                                    <circle
                                      key={i}
                                      cx={xScale(i)}
                                      cy={yScale(p.y)}
                                      r="3"
                                      fill="#007AFF"
                                      stroke="white"
                                      strokeWidth="1.5"
                                    />
                                  ))}
                                </g>
                              )
                            })()
                          )}
                        </svg>
                      </div>
                      <div className="flex justify-between mt-2 text-[11px] text-gray-500 tabular-nums font-medium">
                        {speakingChartData.map((p, i) => (
                          <span key={i}>{p.label}</span>
                        ))}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0 ml-2 self-center">
                      <button type="button" className="p-1.5 rounded-lg text-gray-400 hover:text-[#007AFF] hover:bg-gray-50" aria-label="Filter">
                        <Droplet className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg text-gray-400 hover:text-[#007AFF] hover:bg-gray-50" aria-label="Export">
                        <Droplet className="h-3.5 w-3.5" />
                      </button>
                      <button type="button" className="p-1.5 rounded-lg text-gray-400 hover:text-[#007AFF] hover:bg-gray-50" aria-label="Add">
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="absolute left-8 top-8 bottom-8 flex flex-col justify-between text-xs text-gray-400">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                  </div>
                  <div className="flex-1 flex items-center justify-center ml-12 mr-12">
                    <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center shadow-sm max-w-sm">
                      <TrendingUp className="h-12 w-12 text-[#007AFF] mx-auto mb-4" />
                      <p className="text-base font-semibold text-gray-900 mb-4 tracking-tight">Not ready to add calls yet?</p>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#007AFF] text-white text-[13px] font-medium hover:opacity-90 transition-opacity"
                      >
                        Try demo mode
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    )
  }

  if (section === 'todo') {
    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="px-10 pt-12 pb-8">
          {/* Header: 48px spacing below title area */}
          <div className="flex items-start justify-between gap-6 mb-12">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">To Do Ready</h1>
              <p className="mt-2 text-sm text-gray-500">
                AI-generated action items from your calls and deals.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0" style={{ marginRight: 40 }}>
              <button
                type="button"
                onClick={() => setTodoRange('today')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  todoRange === 'today'
                    ? 'bg-[#3B82F6] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Today
                {todoRange === 'today' && <ChevronRight className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => setTodoRange('week')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  todoRange === 'week'
                    ? 'bg-[#3B82F6] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                This Week
                {todoRange === 'week' && <ChevronRight className="h-4 w-4" />}
              </button>
              <button
                type="button"
                onClick={() => {
                  const range_type = todoRange === 'today' ? 'day' : 'week'
                  setTodoAnalyzing(true)
                  setTodoInsightsError(null)
                  setTodoInsights(null)
                  meetingsAPI
                    .analyzeTodoInsights({ range_type })
                    .then((res) => {
                      setTodoInsights(res.data)
                    })
                    .catch((err) => {
                      setTodoInsightsError(
                        err.response?.data?.detail || err.message || 'Failed to analyze to-do items',
                      )
                    })
                    .finally(() => {
                      setTodoAnalyzing(false)
                    })
                }}
                className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              >
                {todoAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-[#3B82F6]" />
                ) : (
                  <Sparkles className="h-4 w-4 text-[#3B82F6]" />
                )}
                Analyze
              </button>
            </div>
          </div>

          {/* Tabs: 48px below header */}
          <div className="border-b border-gray-200 mb-12">
            <nav className="flex gap-8 text-sm">
              {[
                { id: 'prioritized', label: 'Prioritized Prospects' },
                { id: 'followups', label: 'Follow-ups' },
                { id: 'overdue', label: 'Overdue' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setTodoActiveTab(tab.id as typeof todoActiveTab)}
                  className={`pb-3 -mb-px border-b-2 transition-colors ${
                    todoActiveTab === tab.id
                      ? 'border-[#3B82F6] text-gray-900 font-medium'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content section label */}
          <div className="text-[11px] font-medium text-gray-400 tracking-[0.12em] uppercase mb-3">
            Content section
          </div>
          {/* Single PROSPECT dropdown */}
          <button
            type="button"
            className="w-full max-w-md flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <span className="uppercase tracking-wide text-gray-600">Prospect</span>
            <ChevronDown className="h-4 w-4 text-gray-500 shrink-0" />
          </button>

          {/* To-do list area: filter by tab (Prioritized = all, Follow-ups = open & not overdue, Overdue = open & past due) */}
          {(() => {
            const now = new Date()
            const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
            const todoItems = todoInsights?.items ?? []
            const prioritizedItems = todoItems
            const followupsItems = todoItems.filter((it) => {
              if (it.status !== 'open') return false
              if (!it.due_at) return true
              const due = new Date(it.due_at)
              return due >= startOfToday
            })
            const overdueItems = todoItems.filter((it) => {
              if (it.status !== 'open') return false
              if (!it.due_at) return false
              return new Date(it.due_at) < now
            })
            const displayItems =
              todoActiveTab === 'prioritized'
                ? prioritizedItems
                : todoActiveTab === 'followups'
                  ? followupsItems
                  : overdueItems
            const emptyMessages = {
              prioritized: 'No next-step tasks found for this range. Click Analyze to generate from your meeting transcripts.',
              followups: 'No follow-up tasks due. Open items with a due date in the future appear here.',
              overdue: 'No overdue tasks. Open items past their due date appear here.',
            }
            return (
              <div className="mt-8 min-h-[280px] rounded-xl border border-gray-100 bg-gray-50/50 p-4">
                {todoInsightsError && (
                  <div className="mb-3 text-sm text-red-600">{todoInsightsError}</div>
                )}
                {(todoInsightsLoading || todoAnalyzing) && !todoInsights && (
                  <div className="flex items-center justify-center py-16 text-sm text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Analyzing your meetings to generate next steps…
                  </div>
                )}
                {!todoInsightsLoading && !todoAnalyzing && todoInsights && todoInsights.total_items === 0 && (
                  <div className="flex items-center justify-center py-16 text-sm text-gray-500">
                    {emptyMessages.prioritized}
                  </div>
                )}
                {!todoInsightsLoading && todoInsights && todoInsights.total_items > 0 && displayItems.length === 0 && (
                  <div className="flex items-center justify-center py-16 text-sm text-gray-500">
                    {emptyMessages[todoActiveTab]}
                  </div>
                )}
                {!todoInsightsLoading && todoInsights && displayItems.length > 0 && (
                  <div className="space-y-3">
                    {displayItems.map((item) => (
                      <div
                        key={`${item.meeting_id}-${item.description.slice(0, 40)}-${item.time ?? ''}`}
                        className={`flex items-start gap-3 rounded-xl bg-white px-4 py-3 shadow-sm border ${todoActiveTab === 'overdue' ? 'border-red-100' : 'border-gray-100'}`}
                      >
                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${todoActiveTab === 'overdue' ? 'bg-red-500' : 'bg-[#3B82F6]'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{item.description}</p>
                          <p className="mt-0.5 text-[12px] text-gray-500">
                            From{' '}
                            <span className="font-medium text-gray-700">
                              {item.meeting_title || 'Call'}
                            </span>
                            {item.time && (
                              <span>
                                {' '}
                                at{' '}
                                <span className="text-[#3B82F6] font-medium">{item.time}</span>
                              </span>
                            )}
                          </p>
                        </div>
                        <button
                          type="button"
                          className="mt-1 inline-flex items-center rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-500 hover:bg-gray-50"
                        >
                          Mark done
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>
      </div>
    )
  }

  if (section === 'qna') {
    return (
      <div className="h-full overflow-y-auto px-10 py-8 bg-[#f5f5f7]">
        <div className="flex items-start justify-between gap-6 mb-6">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
              Rolling Q&amp;A Repository
            </h1>
            <p className="mt-1.5 text-sm text-gray-500">
              Centralized database of prospect questions with AI-generated answers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setQnaEditingId(null); setQnaFormQuestion(''); setQnaFormAnswer(''); setQnaModalOpen(true) }}
            className="inline-flex items-center gap-2 rounded-xl bg-[#007AFF] px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Question Manually
          </button>
        </div>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-xl">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={qnaSearch}
              onChange={(e) => setQnaSearch(e.target.value)}
              placeholder="Search questions, answers, or keywords..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-[#007AFF] focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
            />
          </div>
        </div>

        {qnaError && <div className="mb-4 text-sm text-red-600">{qnaError}</div>}

        <div className="rounded-2xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="grid grid-cols-[2fr,3fr,1fr,80px] bg-gray-50 border-b border-gray-200 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-500 px-4 py-2.5">
            <div>Prospect Question</div>
            <div>AI Answer</div>
            <div className="text-right pr-2">Usage</div>
            <div className="text-right pr-2">Actions</div>
          </div>
          {qnaLoading ? (
            <div className="flex items-center justify-center py-12 text-gray-500">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Loading…
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {qnaList.map((row) => (
                <div key={row.id} className="grid grid-cols-[2fr,3fr,1fr,80px] px-4 py-4 text-sm items-center gap-2">
                  <div className="pr-4 text-gray-900 min-w-0">
                    <p className="font-medium truncate" title={row.question}>{row.question}</p>
                  </div>
                  <div className="pr-4 text-gray-700 leading-relaxed min-w-0 line-clamp-2" title={row.answer}>
                    {row.answer}
                    {row.status && (
                      <span className={`ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${row.status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {row.status === 'verified' ? <Check className="mr-1 h-3 w-3 inline" /> : <AlertTriangle className="mr-1 h-3 w-3 inline" />}
                        {row.status === 'verified' ? 'Verified' : row.status}
                      </span>
                    )}
                  </div>
                  <div className="pl-2 text-[12px] text-gray-600 text-right">
                    <div className="font-medium text-gray-800">{row.usage_count} used</div>
                    <div className="text-gray-500">
                      {row.last_used_at ? (() => {
                        try {
                          const d = new Date(row.last_used_at)
                          const diffMins = Math.floor((Date.now() - d.getTime()) / 60000)
                          if (diffMins < 60) return `${diffMins}m ago`
                          const diffHours = Math.floor(diffMins / 60)
                          if (diffHours < 24) return `${diffHours}h ago`
                          const diffDays = Math.floor(diffHours / 24)
                          return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
                        } catch { return '—' }
                      })() : '—'}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => { setQnaEditingId(row.id); setQnaFormQuestion(row.question); setQnaFormAnswer(row.answer); setQnaModalOpen(true) }}
                      className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-[#007AFF]"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Delete this Q&A?\n\n"${row.question.slice(0, 60)}${row.question.length > 60 ? '…' : ''}"`)) {
                          setQnaDeletingId(row.id)
                          atlasAPI.deleteQna(row.id)
                            .then(() => { toast.success('Q&A deleted'); return atlasAPI.listQna({ search: qnaSearchDebounced || undefined, page: qnaPage, limit: qnaLimit }) })
                            .then((res) => { setQnaList(res.data.items); setQnaTotal(res.data.total) })
                            .catch((err) => toast.error(err.response?.data?.detail || 'Failed to delete'))
                            .finally(() => setQnaDeletingId(null))
                        }
                      }}
                      disabled={qnaDeletingId === row.id}
                      className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                      aria-label="Delete"
                    >
                      {qnaDeletingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {!qnaLoading && qnaList.length === 0 && (
            <div className="py-12 text-center text-sm text-gray-500">No Q&A yet. Click &quot;Add Question Manually&quot; to add one.</div>
          )}
          <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-2.5 text-[11px] text-gray-500">
            <span>Page {qnaPage} of {Math.max(1, Math.ceil(qnaTotal / qnaLimit))} ({qnaTotal} total)</span>
            <div className="inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQnaPage((p) => Math.max(1, p - 1))}
                disabled={qnaPage <= 1}
                className="h-6 w-6 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-3 w-3" />
              </button>
              <button
                type="button"
                onClick={() => setQnaPage((p) => Math.min(Math.max(1, Math.ceil(qnaTotal / qnaLimit)), p + 1))}
                disabled={qnaPage >= Math.max(1, Math.ceil(qnaTotal / qnaLimit))}
                className="h-6 w-6 rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 disabled:opacity-50 flex items-center justify-center"
                aria-label="Next page"
              >
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {qnaModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => { setQnaModalOpen(false); setQnaEditingId(null); setQnaFormQuestion(''); setQnaFormAnswer('') }}>
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">{qnaEditingId ? 'Edit Q&A' : 'Add Question Manually'}</h2>
                <button type="button" onClick={() => { setQnaModalOpen(false); setQnaEditingId(null); setQnaFormQuestion(''); setQnaFormAnswer('') }} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Prospect Question</label>
                  <textarea value={qnaFormQuestion} onChange={(e) => setQnaFormQuestion(e.target.value)} rows={2} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" placeholder="e.g. How does your platform integrate with Salesforce?" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">AI Answer</label>
                  <textarea value={qnaFormAnswer} onChange={(e) => setQnaFormAnswer(e.target.value)} rows={4} className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-[#007AFF] focus:ring-1 focus:ring-[#007AFF]" placeholder="Your answer or AI-generated answer…" />
                </div>
              </div>
              <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-200">
                <button type="button" onClick={() => { setQnaModalOpen(false); setQnaEditingId(null); setQnaFormQuestion(''); setQnaFormAnswer('') }} className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">Cancel</button>
                <button
                  type="button"
                  onClick={async () => {
                    const q = (qnaFormQuestion || '').trim()
                    const a = (qnaFormAnswer || '').trim()
                    if (!q) { toast.error('Question is required'); return }
                    try {
                      if (qnaEditingId) {
                        await atlasAPI.updateQna(qnaEditingId, { question: q, answer: a })
                        toast.success('Q&A updated')
                      } else {
                        await atlasAPI.createQna({ question: q, answer: a })
                        toast.success('Q&A added')
                      }
                      setQnaModalOpen(false); setQnaEditingId(null); setQnaFormQuestion(''); setQnaFormAnswer('')
                      const res = await atlasAPI.listQna({ search: qnaSearchDebounced || undefined, page: qnaPage, limit: qnaLimit })
                      setQnaList(res.data.items); setQnaTotal(res.data.total)
                    } catch (e: any) {
                      toast.error(e.response?.data?.detail || 'Failed to save Q&A')
                    }
                  }}
                  className="px-4 py-2 rounded-xl bg-[#007AFF] text-white hover:opacity-90"
                >
                  {qnaEditingId ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (section === 'knowledge') {
    const knowledgeCategories = [
      { id: 'product' as const, label: 'Product Info' },
      { id: 'pricing' as const, label: 'Pricing & Plans' },
      { id: 'objection' as const, label: 'Objection Handling' },
      { id: 'competitive' as const, label: 'Competitive Intel' },
      { id: 'faqs' as const, label: 'Customer FAQs' },
      { id: 'policies' as const, label: 'Company Policies' },
    ]
    return (
      <div className="h-full overflow-y-auto bg-[#f5f5f7]">
        <div className="px-10 pt-10 pb-6">
          <div className="flex items-start justify-between gap-6 mb-10">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-gray-900">
                Knowledge Configuration
              </h1>
              <p className="mt-2 text-sm text-gray-500 max-w-xl">
                Train Atlas AI with your company information to provide intelligent assistance during calls.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setKnowledgeUploadModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#007AFF] px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:opacity-90"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                <RefreshCw className="h-4 w-4" />
                Sync CRM
              </button>
            </div>
          </div>

          <div className="flex gap-6 min-h-[420px]">
            <aside className="w-[200px] shrink-0 rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
              <nav className="p-2">
                {knowledgeCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setKnowledgeCategory(cat.id)}
                    className={`w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition-colors ${
                      knowledgeCategory === cat.id
                        ? 'bg-blue-50 text-[#007AFF] border-l-2 border-[#007AFF] -ml-0.5 pl-3.5'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex-1">{cat.label}</span>
                  </button>
                ))}
              </nav>
            </aside>

            <div className="flex-1 min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-md">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search Documents"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-[#007AFF] focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
                  />
                </div>
              </div>
              {knowledgeDocumentsLoading === knowledgeCategory ? (
                <div className="rounded-xl border border-gray-100 bg-white p-12 text-center">
                  <Loader2 className="h-10 w-10 text-[#007AFF] animate-spin mx-auto mb-3" />
                  <p className="text-sm text-gray-500">Loading documents...</p>
                </div>
              ) : currentKnowledgeDocuments.length === 0 ? (
                <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
                  <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    No {knowledgeCategories.find((c) => c.id === knowledgeCategory)?.label ?? knowledgeCategory} documents yet
                  </p>
                  <p className="text-xs text-gray-500 mb-4">Upload PDFs to train Atlas for this knowledge category.</p>
                  <button
                    type="button"
                    onClick={() => setKnowledgeUploadModal(true)}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#007AFF] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90"
                  >
                    <Upload className="h-4 w-4" />
                    Upload Document
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentKnowledgeDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="h-10 w-10 shrink-0 rounded-lg bg-gray-100 flex items-center justify-center">
                          <FileText className="h-5 w-5 text-gray-600" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-900 truncate">{doc.name}</span>
                            {doc.status === 'processed' && <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />}
                            {doc.status === 'processing' && <Loader2 className="h-4 w-4 text-[#007AFF] animate-spin shrink-0" />}
                            {doc.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />}
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            {doc.total_chunks != null && doc.total_chunks > 0 && ` · ${doc.total_chunks} chunks`}
                            {doc.size ? ` · ${doc.size < 1024 ? doc.size + ' B' : doc.size < 1024 * 1024 ? (doc.size / 1024).toFixed(1) + ' KB' : (doc.size / (1024 * 1024)).toFixed(2) + ' MB'}` : ''}
                            {doc.status === 'failed' && doc.error_message && ` · ${doc.error_message}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={async () => {
                            const apiCat = KNOWLEDGE_CATEGORY_API_MAP[knowledgeCategory]
                            if (!apiCat) return
                            try {
                              const res = await atlasAPI.downloadKnowledgeDocument(apiCat, doc.id)
                              const url = window.URL.createObjectURL(new Blob([res.data]))
                              const a = document.createElement('a')
                              a.href = url
                              a.download = doc.name || 'document.pdf'
                              a.click()
                              window.URL.revokeObjectURL(url)
                            } catch (e: any) {
                              toast.error(e.response?.data?.detail || 'Download failed')
                            }
                          }}
                          className="p-2 rounded-lg text-gray-500 hover:text-[#007AFF] hover:bg-blue-50"
                          title="Download"
                        >
                          <Download className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!confirm('Delete this document? Chunks will be removed from knowledge base.')) return
                            const apiCat = KNOWLEDGE_CATEGORY_API_MAP[knowledgeCategory]
                            if (!apiCat) return
                            try {
                              await atlasAPI.deleteKnowledgeDocument(apiCat, doc.id)
                              toast.success('Document deleted')
                              loadKnowledgeDocuments(knowledgeCategory)
                            } catch (e: any) {
                              toast.error(e.response?.data?.detail || 'Delete failed')
                            }
                          }}
                          className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between border-t border-gray-200 pt-4 text-sm text-gray-500">
                <span>
                  {currentKnowledgeDocuments.length} {knowledgeCategories.find((c) => c.id === knowledgeCategory)?.label ?? knowledgeCategory} document{currentKnowledgeDocuments.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>

          {knowledgeUploadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Upload {knowledgeCategories.find((c) => c.id === knowledgeCategory)?.label ?? knowledgeCategory} Document
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setKnowledgeUploadModal(false)
                      setKnowledgeUploadFile(null)
                      if (knowledgeFileInputRef.current) knowledgeFileInputRef.current.value = ''
                    }}
                    className="p-2 rounded-lg text-gray-500 hover:bg-gray-100"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <div className="p-6">
                  <div
                    onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDragLeave={(e) => { e.preventDefault(); e.stopPropagation() }}
                    onDrop={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const f = e.dataTransfer.files?.[0]
                      const name = f?.name?.toLowerCase() ?? ''
                      if (name.endsWith('.pdf') || name.endsWith('.docx')) setKnowledgeUploadFile(f!)
                      else toast.error('Only PDF and DOCX files are supported')
                    }}
                    className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center"
                  >
                    {!knowledgeUploadFile ? (
                      <>
                        <p className="text-sm text-gray-600 mb-3">Drag & drop a PDF or DOCX, or click to choose</p>
                        <input
                          ref={knowledgeFileInputRef}
                          type="file"
                          accept=".pdf,.docx"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0]
                            if (!f) return
                            const name = f.name.toLowerCase()
                            if (name.endsWith('.pdf') || name.endsWith('.docx')) setKnowledgeUploadFile(f)
                            else toast.error('Only PDF and DOCX files are supported')
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => knowledgeFileInputRef.current?.click()}
                          className="rounded-xl bg-[#007AFF] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
                        >
                          Choose File
                        </button>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium text-gray-900 truncate">{knowledgeUploadFile.name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {(knowledgeUploadFile.size / 1024).toFixed(1)} KB
                        </p>
                        <div className="flex items-center justify-center gap-2 mt-4">
                          <button
                            type="button"
                            disabled={knowledgeUploading}
                            onClick={async () => {
                              const apiCat = KNOWLEDGE_CATEGORY_API_MAP[knowledgeCategory]
                              if (!apiCat) return
                              setKnowledgeUploading(true)
                              try {
                                await atlasAPI.uploadKnowledgeDocument(apiCat, knowledgeUploadFile)
                                toast.success('Document uploaded. Processing in background.')
                                setKnowledgeUploadModal(false)
                                setKnowledgeUploadFile(null)
                                if (knowledgeFileInputRef.current) knowledgeFileInputRef.current.value = ''
                                loadKnowledgeDocuments(knowledgeCategory)
                              } catch (e: any) {
                                toast.error(e.response?.data?.detail || 'Upload failed')
                              } finally {
                                setKnowledgeUploading(false)
                              }
                            }}
                            className="rounded-xl bg-[#007AFF] px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
                          >
                            {knowledgeUploading ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                Uploading...
                              </>
                            ) : (
                              'Upload'
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={knowledgeUploading}
                            onClick={() => {
                              setKnowledgeUploadFile(null)
                              if (knowledgeFileInputRef.current) knowledgeFileInputRef.current.value = ''
                            }}
                            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">PDF or DOCX. Content will be chunked and stored in Atlas {knowledgeCategories.find((c) => c.id === knowledgeCategory)?.label ?? knowledgeCategory} knowledge base.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  // record
  return (
    <>
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
            onClick={recordMode === 'join' ? openJoinMeetingModal : openRecordModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <RadioIcon className="h-4 w-4" />
            <span>{recordMode === 'join' ? 'Join Meeting' : 'Record'}</span>
          </button>
        </div>
      </div>

      {isJoinMeetingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Join Meeting</h2>
                <p className="text-xs text-gray-500">
                  Paste your Google Meet or Microsoft Teams link. Atlas will join as a participant to record.
                </p>
              </div>
              <button
                type="button"
                onClick={closeJoinMeetingModal}
                disabled={joinMeetingSubmitting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label htmlFor="join-meeting-link" className="block text-sm font-medium text-gray-700 mb-1">
                Meeting link
              </label>
              <input
                id="join-meeting-link"
                type="url"
                value={joinMeetingLink}
                onChange={(e) => setJoinMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/xxx-xxxx-xxx or Teams link"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeJoinMeetingModal}
                disabled={joinMeetingSubmitting}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleJoinMeetingFromLink}
                disabled={joinMeetingSubmitting || !joinMeetingLink.trim()}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {joinMeetingSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Joining…
                  </>
                ) : (
                  'Join'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

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
    </>
  )
}
