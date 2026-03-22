import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Check,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  FileText,
  HelpCircle,
  Info,
  Loader2,
  MessageCircle,
  MessageSquare,
  Mic,
  Monitor,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  ThumbsUp,
  Trash2,
  TrendingUp,
  TrendingDown,
  Minus,
  Upload,
  Users,
  Volume2,
  X,
  Zap,
  Clock,
  Radio as RadioIcon,
  Download,
  AlertCircle,
  XCircle,
  Brain,
  Eye,
  Lightbulb,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ListChecks,
  Filter,
  User as _User,
  Bot,
} from 'lucide-react'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts'
import { cn } from '../lib/utils'
import { useAuth } from '../hooks/useAuth'
import {
  calendarAPI,
  atlasAPI,
  meetingsAPI,
  vexaAPI,
  playbooksAPI,
  enablementAPI,
  getVexaBotJoinErrorMessage,
  type GoogleCalendarEvent,
  type MeetingPlatform,
  type MeetingPlaybookAnalysis,
  type MeetingFeedback,
  type MeetingComment,
  type AtlasQnARecord,
  type AtlasKnowledgeDocument,
  type EnablementFeedbackResponse,
  type PlaybookTemplateRule,
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
  insights: 'calls',
  performance: 'insights',
  todo: 'todo',
  qna: 'qna',
  knowledge: 'knowledge',
  record: 'record',
}

export default function AtlasMain() {
  const { user } = useAuth()
  const location = useLocation()
  const pathSegment = location.pathname.split('/').pop() || 'calls'
  const section: AtlasMainSection = SECTION_PATH_MAP[pathSegment] ?? 'calls'

  const [callListCollapsed, setCallListCollapsed] = useState(false)
  const [transcriptCollapsed, setTranscriptCollapsed] = useState(false)
  const [callsList, setCallsList] = useState<CallListItem[]>([])
  const [callsLoading, setCallsLoading] = useState(false)
  const [activeCallId, setActiveCallId] = useState<string | null>(null)
  const [activeCallTab, setActiveCallTab] = useState<
    'summary' | 'playbook' | 'feedback' | 'comments' | 'templates'
  >('feedback')
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
  // Template detail editing state
  const [templateDetailRules, setTemplateDetailRules] = useState<PlaybookTemplateRule[]>([])
  const [templateDetailLoading, setTemplateDetailLoading] = useState(false)
  const [templateDetailSaving, setTemplateDetailSaving] = useState(false)
  const [templateEditingName, setTemplateEditingName] = useState(false)
  const [templateNameDraft, setTemplateNameDraft] = useState('')
  const [editingRuleIndex, setEditingRuleIndex] = useState<number | null>(null)
  const [editingRuleLabel, setEditingRuleLabel] = useState('')
  const [editingRuleDescription, setEditingRuleDescription] = useState('')
  const [addingNewRule, setAddingNewRule] = useState(false)
  const [newRuleLabel, setNewRuleLabel] = useState('')
  const [newRuleDescription, setNewRuleDescription] = useState('')
  const [_playbookTimeframe, _setPlaybookTimeframe] = useState<Timeframe>('Last week')
  const [_speakingTimeframe, _setSpeakingTimeframe] = useState<Timeframe>('Last week')
  const [_objectionTimeframe, _setObjectionTimeframe] = useState<Timeframe>('Last week')
  const [recordMode, setRecordMode] = useState<'join' | 'no_join'>('join')
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false)
  // Local client-side recording state (Don't Join Meeting mode)
  const [isLocalRecording, setIsLocalRecording] = useState(false)
  const [recordingElapsed, setRecordingElapsed] = useState(0)
  const [recordingError, setRecordingError] = useState<string | null>(null)
  const [recordedPreviewUrl, setRecordedPreviewUrl] = useState<string | null>(null)
  const [recordedFileExt, setRecordedFileExt] = useState<string>('wav')
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [localTranscriptLoading, setLocalTranscriptLoading] = useState(false)
  const [transcriptResult, setTranscriptResult] = useState<string | null>(null)
  const [transcriptPopupOpen, setTranscriptPopupOpen] = useState(false)
  const [saveRecordingLoading, setSaveRecordingLoading] = useState(false)
  const [saveRecordingModalOpen, setSaveRecordingModalOpen] = useState(false)
  const [saveRecordingTitle, setSaveRecordingTitle] = useState('')
  const [insightsActiveTab, setInsightsActiveTab] = useState<'playbook' | 'speaking' | 'objection'>('playbook')
  const [insightsDays, setInsightsDays] = useState<7 | 14 | 30>(7)
  const [insightsDropdownOpen, setInsightsDropdownOpen] = useState(false)
  const insightsDropdownRef = useRef<HTMLDivElement>(null)
  const [expandedObjectionTopics, setExpandedObjectionTopics] = useState<Record<string, boolean>>({})
  const [todoActiveTab, setTodoActiveTab] = useState<'prioritized' | 'followups' | 'overdue'>('prioritized')
  const [todoRange, setTodoRange] = useState<'today' | 'week'>('week')
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
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const recordingTimerRef = useRef<number | null>(null)

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
  
  // Enablement feedback state (longitudinal, cross-meeting)
  const [enablementFeedback, setEnablementFeedback] = useState<EnablementFeedbackResponse | null>(null)
  const [enablementLoading, setEnablementLoading] = useState(false)
  const [enablementError, setEnablementError] = useState<string | null>(null)
  const [enablementCardsExpanded, setEnablementCardsExpanded] = useState<Record<string, boolean>>({})

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const startLocalRecording = async () => {
    try {
      setRecordingError(null)
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setRecordingError('Your browser does not support audio recording.')
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      
      // Prefer formats that Whisper API supports well
      // Order: wav > mp3 > ogg > webm (webm often not supported by Whisper)
      let mimeType = ''
      const preferredTypes = ['audio/wav', 'audio/mp3', 'audio/ogg', 'audio/webm;codecs=opus', 'audio/webm']
      for (const type of preferredTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type
          break
        }
      }
      console.log('[Recording] Using mimeType:', mimeType || 'default')
      
      const mediaRecorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)
      const chunks: BlobPart[] = []
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunks.push(event.data)
        }
      }
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const recordedMime = mediaRecorder.mimeType || 'audio/webm'
        const blob = new Blob(chunks, { type: recordedMime })
        // Convert to WAV using Web Audio API for better compatibility with Whisper API
        let finalBlob = blob
        let finalExt = recordedMime.includes('wav') ? 'wav' : 'webm'
        try {
          const audioCtx = new AudioContext()
          const arrayBuffer = await blob.arrayBuffer()
          const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
          const wavBlob = audioBufferToWav(audioBuffer)
          finalBlob = wavBlob
          finalExt = 'wav'
          audioCtx.close()
          console.log('[Recording] Successfully converted to WAV format')
        } catch (convErr) {
          // If WAV conversion fails, log and use original blob
          console.warn('[Recording] WAV conversion failed, using original format:', convErr)
          toast.error('Could not convert to WAV. Transcription may fail.')
        }
        const url = URL.createObjectURL(finalBlob)
        setRecordedPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev)
          return url
        })
        setRecordedFileExt(finalExt)
        setRecordedBlob(finalBlob)
        setIsLocalRecording(false)
        if (recordingTimerRef.current !== null) {
          window.clearInterval(recordingTimerRef.current)
          recordingTimerRef.current = null
        }
      }
      mediaRecorderRef.current = mediaRecorder
      setIsLocalRecording(true)
      setRecordingElapsed(0)
      mediaRecorder.start()
      recordingTimerRef.current = window.setInterval(() => {
        setRecordingElapsed((prev) => prev + 1)
      }, 1000)
    } catch (err) {
      console.error('Error starting local recording', err)
      setRecordingError('Could not access microphone. Please check your browser permissions.')
    }
  }

  // Helper: convert AudioBuffer to WAV Blob
  const audioBufferToWav = (buffer: AudioBuffer): Blob => {
    const numChannels = buffer.numberOfChannels
    const sampleRate = buffer.sampleRate
    const format = 1 // PCM
    const bitDepth = 16
    const bytesPerSample = bitDepth / 8
    const blockAlign = numChannels * bytesPerSample
    const dataLength = buffer.length * blockAlign
    const bufferLength = 44 + dataLength
    const arrayBuffer = new ArrayBuffer(bufferLength)
    const view = new DataView(arrayBuffer)
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i))
      }
    }
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + dataLength, true)
    writeString(8, 'WAVE')
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true)
    view.setUint16(20, format, true)
    view.setUint16(22, numChannels, true)
    view.setUint32(24, sampleRate, true)
    view.setUint32(28, sampleRate * blockAlign, true)
    view.setUint16(32, blockAlign, true)
    view.setUint16(34, bitDepth, true)
    writeString(36, 'data')
    view.setUint32(40, dataLength, true)
    // Interleave channels
    const channels: Float32Array[] = []
    for (let ch = 0; ch < numChannels; ch++) {
      channels.push(buffer.getChannelData(ch))
    }
    let offset = 44
    for (let i = 0; i < buffer.length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, channels[ch][i]))
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff
        view.setInt16(offset, intSample, true)
        offset += 2
      }
    }
    return new Blob([arrayBuffer], { type: 'audio/wav' })
  }

  const stopLocalRecording = () => {
    const mr = mediaRecorderRef.current
    if (mr && mr.state !== 'inactive') {
      mr.stop()
    }
  }

  const handleTranscriptRecording = async () => {
    if (!recordedBlob) {
      toast.error('No recording available to transcribe.')
      return
    }
    try {
      setLocalTranscriptLoading(true)
      setTranscriptResult(null)
      const response = await atlasAPI.transcribeAudio(recordedBlob, `recording.${recordedFileExt}`, 'en')
      setTranscriptResult(response.data.text || '')
      setTranscriptPopupOpen(true)
    } catch (err) {
      console.error('Transcription error:', err)
      toast.error('Failed to transcribe recording.')
    } finally {
      setLocalTranscriptLoading(false)
    }
  }

  const openSaveRecordingModal = () => {
    const now = new Date()
    setSaveRecordingTitle(`Recording - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`)
    setSaveRecordingModalOpen(true)
  }

  const closeSaveRecordingModal = () => {
    setSaveRecordingModalOpen(false)
  }

  const handleSaveRecording = async () => {
    if (!recordedBlob) {
      toast.error('No recording available to save.')
      return
    }
    if (!saveRecordingTitle.trim()) {
      toast.error('Please enter a title for the recording.')
      return
    }
    try {
      setSaveRecordingLoading(true)
      // 1. Call transcript API via backend proxy
      const transcriptResponse = await atlasAPI.transcribeAudio(recordedBlob, `recording.${recordedFileExt}`, 'en')
      const transcriptText = transcriptResponse.data.text || ''

      // 2. Create meeting with user-provided title
      const createRes = await meetingsAPI.createMeeting({
        title: saveRecordingTitle.trim(),
        description: 'Recorded from browser microphone',
        platform: 'google_meet',
        link: '',
      })
      const meetingId = createRes.data.id

      // 3. Update meeting with transcript_lines
      const transcriptLines = transcriptText
        ? [{ speaker: 'Speaker', role: undefined, time: '00:00', text: transcriptText }]
        : []
      await meetingsAPI.updateMeeting(meetingId, { transcript_lines: transcriptLines })

      // 4. Refresh calls list
      const listRes = await meetingsAPI.getMeetings()
      const newList = (listRes.data.meetings || []).map((m: { id: string; title: string; created_at?: string; link?: string }) => ({
        id: m.id,
        title: m.title,
        date: m.created_at ? new Date(m.created_at).toLocaleDateString() : '',
        duration: '-',
        meetingLink: m.link,
      }))
      setCallsList(newList)

      toast.success('Recording saved to Call History!')
      // Close modals
      closeSaveRecordingModal()
      closeRecordModal()
    } catch (err) {
      console.error('Save recording error:', err)
      toast.error('Failed to save recording.')
    } finally {
      setSaveRecordingLoading(false)
    }
  }

  useEffect(() => {
    // Cleanup on unmount to stop recording/timers if still running
    return () => {
      const mr = mediaRecorderRef.current
      if (mr && mr.state !== 'inactive') {
        mr.stop()
      }
      if (recordingTimerRef.current !== null) {
        window.clearInterval(recordingTimerRef.current)
      }
      if (recordedPreviewUrl) {
        URL.revokeObjectURL(recordedPreviewUrl)
      }
    }
  }, [])
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
  const [playbookScoresPrev, setPlaybookScoresPrev] = useState<{
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
  const [speakingScoresPrev, setSpeakingScoresPrev] = useState<{
    averages: Record<string, number>
  }>({ averages: {} })
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
  const [reanalyzing, setReanalyzing] = useState(false)
  const [speakingInsightsError, setSpeakingInsightsError] = useState<string | null>(null)
  type ObjectionQuestionItem = {
    meeting_id: string
    meeting_title?: string | null
    meeting_created_at?: string | null
    question: string
    time?: string | null
    answer: string
    user_actual_answer?: string | null
    suggested_answer?: string | null
    match_score?: number | null
    key_points_covered?: string[]
    learning_opportunities?: string[]
  }
  type ObjectionTopicItem = {
    topic: string
    pct_calls: number
    calls_count: number
    questions_count: number
    questions: ObjectionQuestionItem[]
  }
  type ObjectionInsightsData = {
    analyzed_from: string
    analyzed_to: string
    total_calls: number
    topics: ObjectionTopicItem[]
    generated_at: string
  }
  const [objectionInsights, setObjectionInsights] = useState<ObjectionInsightsData | null>(null)
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
    const handler = (e: MouseEvent) => {
      if (insightsDropdownRef.current && !insightsDropdownRef.current.contains(e.target as Node)) {
        setInsightsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    if (section !== 'insights') return
    let cancelled = false
    setPlaybookInsightsLoading(true)
    setPlaybookInsightsError(null)
    Promise.all([
      meetingsAPI.getPlaybookScoresInsights({ days: insightsDays }),
      meetingsAPI.getPlaybookScoresInsights({ days: insightsDays, offset_days: insightsDays }),
    ])
      .then(([curr, prev]) => {
        if (!cancelled) {
          setPlaybookScoresInsights(curr.data)
          setPlaybookScoresPrev({ days: prev.data.days || [] })
        }
      })
      .catch((err) => {
        if (!cancelled) setPlaybookInsightsError(err.response?.data?.detail || err.message || 'Failed to load playbook scores')
      })
      .finally(() => {
        if (!cancelled) setPlaybookInsightsLoading(false)
      })

    setSpeakingInsightsLoading(true)
    setSpeakingInsightsError(null)
    Promise.all([
      meetingsAPI.getSpeakingScoresInsights({ days: insightsDays }),
      meetingsAPI.getSpeakingScoresInsights({ days: insightsDays, offset_days: insightsDays }),
    ])
      .then(([curr, prev]) => {
        if (!cancelled) {
          setSpeakingScoresInsights({ days: curr.data.days || [], averages: curr.data.averages || {} })
          setSpeakingScoresPrev({ averages: prev.data.averages || {} })
        }
      })
      .catch((err) => {
        if (!cancelled) setSpeakingInsightsError(err.response?.data?.detail || err.message || 'Failed to load speaking scores')
      })
      .finally(() => {
        if (!cancelled) setSpeakingInsightsLoading(false)
      })

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
  }, [section, insightsDays])

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
      .getMeetingTranscription(activeCallId, { refresh_ttl_seconds: 0 })
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

  // Load full template detail (with rules) when a template is selected in Templates tab
  useEffect(() => {
    if (!selectedPlaybookId || activeCallTab !== 'templates') return
    let cancelled = false
    setTemplateDetailLoading(true)
    setEditingRuleIndex(null)
    setAddingNewRule(false)
    setTemplateEditingName(false)
    playbooksAPI
      .get(selectedPlaybookId)
      .then((res) => {
        if (!cancelled) {
          setTemplateDetailRules(res.data.rules || [])
        }
      })
      .catch(() => {
        if (!cancelled) setTemplateDetailRules([])
      })
      .finally(() => {
        if (!cancelled) setTemplateDetailLoading(false)
      })
    return () => { cancelled = true }
  }, [selectedPlaybookId, activeCallTab])

  // Helper: refresh templates list after mutations
  const refreshPlaybookTemplates = async () => {
    try {
      const res = await playbooksAPI.list({ limit: 200 })
      const templates = (res.data.templates || []).map((t: any) => ({
        id: t.id,
        name: t.name,
        items: (t.rules || []).length,
        is_default: t.is_default,
      }))
      setPlaybookTemplates(templates)
      return templates
    } catch {
      return playbookTemplates
    }
  }

  // Save rules to backend
  const handleSaveTemplateRules = async (rules: PlaybookTemplateRule[]) => {
    if (!selectedPlaybookId) return
    setTemplateDetailSaving(true)
    try {
      await playbooksAPI.update(selectedPlaybookId, { rules })
      setTemplateDetailRules(rules)
      await refreshPlaybookTemplates()
      toast.success('Rules saved')
    } catch {
      toast.error('Failed to save rules')
    } finally {
      setTemplateDetailSaving(false)
    }
  }

  // Rename template
  const handleRenameTemplate = async () => {
    if (!selectedPlaybookId || !templateNameDraft.trim()) return
    setTemplateDetailSaving(true)
    try {
      await playbooksAPI.update(selectedPlaybookId, { name: templateNameDraft.trim() })
      setSelectedPlaybookName(templateNameDraft.trim())
      await refreshPlaybookTemplates()
      setTemplateEditingName(false)
      toast.success('Template renamed')
    } catch {
      toast.error('Failed to rename template')
    } finally {
      setTemplateDetailSaving(false)
    }
  }

  // Delete template
  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await playbooksAPI.delete(templateId)
      const updated = await refreshPlaybookTemplates()
      if (selectedPlaybookId === templateId) {
        const first = updated[0]
        setSelectedPlaybookId(first?.id || null)
        setSelectedPlaybookName(first?.name || '')
        setTemplateDetailRules([])
      }
      toast.success('Template deleted')
    } catch {
      toast.error('Failed to delete template')
    }
  }

  const handleAnalyzePlaybook = async (overrideTemplateId?: string) => {
    if (section !== 'calls' || !activeCallId) return
    try {
      setPlaybookLoading(true)
      setPlaybookError(null)
      const templateId = overrideTemplateId || selectedPlaybookId || undefined
      const res = await meetingsAPI.getMeetingPlaybookAnalysis(activeCallId, {
        force_refresh: true,
        template_id: templateId,
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

  // Auto-load enablement feedback (longitudinal) when opening Feedback tab
  useEffect(() => {
    if (section !== 'calls') return
    if (activeCallTab !== 'feedback') return
    if (!user?.id) return

    let cancelled = false
    setEnablementLoading(true)
    setEnablementError(null)

    enablementAPI
      .getFeedback({ days: 30, min_calls: 5, force_refresh: false })
      .then((res) => {
        if (cancelled) return
        setEnablementFeedback(res.data)
      })
      .catch((err: any) => {
        if (cancelled) return
        const detail = err?.response?.data?.detail
        setEnablementError(detail || 'Failed to load overall performance feedback')
      })
      .finally(() => {
        if (!cancelled) setEnablementLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [section, activeCallTab, user?.id])

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

  const handleReanalyzeMeeting = async () => {
    if (!activeCallId) return
    setReanalyzing(true)
    try {
      const res = await meetingsAPI.reanalyzeMeeting(activeCallId)
      const data = res.data
      toast.success(data.message || 'Meeting re-analyzed successfully')
      
      // Refresh insights, feedback, playbook data
      if (data.insights_regenerated) {
        const insightsRes = await meetingsAPI.getAtlasMeetingInsights(activeCallId)
        setAtlasInsights({
          summary: insightsRes.data.summary || {},
          next_steps: insightsRes.data.next_steps || [],
          questions_and_objections: insightsRes.data.questions_and_objections || [],
        })
      }
      if (data.feedback_regenerated) {
        const feedbackRes = await meetingsAPI.getMeetingFeedback(activeCallId)
        setFeedbackData(feedbackRes.data)
      }
      if (data.playbook_regenerated) {
        const playbookRes = await meetingsAPI.getMeetingPlaybookAnalysis(activeCallId)
        setPlaybookAnalysis(playbookRes.data)
      }
      if (data.qna_extracted_count > 0) {
        toast.success(`Extracted ${data.qna_extracted_count} Q&A from call`, { duration: 4000 })
      }
    } catch (e: any) {
      toast.error(e.response?.data?.detail || 'Failed to re-analyze meeting')
    } finally {
      setReanalyzing(false)
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
      .getAtlasMeetingInsights(activeCallId, { force_refresh: true })
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
        toast.error(getVexaBotJoinErrorMessage(err))
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
        toast.error(getVexaBotJoinErrorMessage(err))
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
    // Don't Join Meeting: fake SilkChart-like UI, recording from microphone on client
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-700">
          Atlas will record audio from your microphone in this browser tab. In a future version,
          desktop recording from computer speakers will be supported.
        </p>
        <div className="flex flex-col items-center gap-4">
          <button
            type="button"
            onClick={isLocalRecording ? stopLocalRecording : startLocalRecording}
            className={`relative flex items-center justify-center h-16 w-16 rounded-full border-4 ${
              isLocalRecording
                ? 'border-red-200 bg-red-500 text-white'
                : 'border-blue-200 bg-blue-600 text-white'
            } shadow-md transition-colors`}
          >
            <span className="text-xs font-semibold">
              {isLocalRecording ? 'STOP' : 'REC'}
            </span>
            {isLocalRecording && (
              <span className="absolute -top-2 -right-2 h-3 w-3 rounded-full bg-red-500 animate-pulse" />
            )}
          </button>
          <div className="flex flex-col items-center gap-1">
            <span className="text-xs uppercase tracking-wide text-gray-500">
              Recording time
            </span>
            <span className="font-mono text-sm text-gray-900">
              {formatRecordingTime(recordingElapsed)}
            </span>
          </div>
          <div className="flex items-end gap-1 h-10">
            {Array.from({ length: 16 }).map((_, i) => (
              <div
                // eslint-disable-next-line react/no-array-index-key
                key={i}
                className={`w-1 rounded-sm ${
                  isLocalRecording ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                }`}
                style={{ height: `${4 + ((i * 7) % 20)}px` }}
              />
            ))}
          </div>
        </div>
        {recordedPreviewUrl && (
          <div className="w-full pt-3 border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-1">Preview last recording</p>
            <audio controls src={recordedPreviewUrl} className="w-full" />
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <a
                href={recordedPreviewUrl}
                download={`atlas-recording-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.${recordedFileExt}`}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                <Download className="h-3 w-3" />
                Download
              </a>
              <button
                type="button"
                onClick={handleTranscriptRecording}
                disabled={localTranscriptLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
              >
                {localTranscriptLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Transcribing…
                  </>
                ) : (
                  <>
                    <FileText className="h-3 w-3" />
                    Transcript
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={openSaveRecordingModal}
                disabled={saveRecordingLoading}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 disabled:opacity-50"
              >
                {saveRecordingLoading ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-3 w-3" />
                    Save
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Transcript result popup */}
        {transcriptPopupOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Transcript Result</h3>
                <button
                  type="button"
                  onClick={() => setTranscriptPopupOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 whitespace-pre-wrap">
                {transcriptResult || '(No transcript text)'}
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setTranscriptPopupOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
        {recordingError && (
          <p className="text-xs text-red-600">
            {recordingError}
          </p>
        )}

        {/* Save recording modal - enter title */}
        {saveRecordingModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 space-y-4">
              <div className="flex items-start justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Save Recording</h3>
                <button
                  type="button"
                  onClick={closeSaveRecordingModal}
                  disabled={saveRecordingLoading}
                  className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div>
                <label htmlFor="save-recording-title" className="block text-sm font-medium text-gray-700 mb-1">
                  Meeting Title
                </label>
                <input
                  id="save-recording-title"
                  type="text"
                  value={saveRecordingTitle}
                  onChange={(e) => setSaveRecordingTitle(e.target.value)}
                  placeholder="Enter a title for this recording"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={closeSaveRecordingModal}
                  disabled={saveRecordingLoading}
                  className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRecording}
                  disabled={saveRecordingLoading || !saveRecordingTitle.trim()}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                >
                  {saveRecordingLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Saving…
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (section === 'calls') {
    return (
      <>
        <div className="flex flex-1 overflow-hidden bg-background">

        {/* Call List Sidebar */}
        <div
          className={`h-screen border-r border-border bg-card overflow-hidden transition-all duration-300 ease-in-out flex flex-col ${
            callListCollapsed ? 'w-[56px] min-w-[56px]' : 'w-[240px] min-w-[240px]'
          }`}
        >
          {callListCollapsed ? (
            <>
              <div className="flex justify-center p-3 border-b border-border">
                <button onClick={() => setCallListCollapsed(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <PanelLeftOpen className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 flex flex-col items-center gap-1.5 py-3 px-1.5 overflow-y-auto atlas-scrollbar">
                {callsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mt-2" />
                ) : (
                  callsList.map((call, idx) => (
                    <button
                      key={call.id}
                      onClick={() => setActiveCallId(call.id)}
                      className={`flex h-10 w-10 items-center justify-center rounded-lg transition-colors text-[13px] font-semibold ${
                        activeCallId === call.id
                          ? 'bg-forskale-teal/10 text-forskale-teal border border-forskale-teal/30'
                          : 'text-foreground hover:bg-accent'
                      }`}
                      title={call.title}
                    >
                      {idx + 1}
                    </button>
                  ))
                )}
              </div>
              <div className="flex justify-center pb-3">
                <ChevronLeft className="h-4 w-4 text-muted-foreground" />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-sm font-heading font-bold text-foreground tracking-tight">Call History</h2>
                <button onClick={() => setCallListCollapsed(true)} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                  <PanelLeftClose className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto atlas-scrollbar px-2 py-3 space-y-1">
                {callsLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : callsList.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-2 leading-relaxed">
                    No meetings yet. Join a meeting from Record or create one in Meetings.
                  </p>
                ) : (
                  callsList.map((call) => (
                    <button
                      key={call.id}
                      onClick={() => setActiveCallId(call.id)}
                      className={`w-full relative flex items-center justify-between px-3 py-3 rounded-lg text-left transition-all group ${
                        activeCallId === call.id
                          ? 'forskale-gradient-subtle border border-forskale-teal shadow-card'
                          : 'border border-transparent hover:bg-accent hover:border-border'
                      }`}
                    >
                      {activeCallId === call.id && (
                        <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-forskale-teal" />
                      )}
                      <div className="min-w-0 flex-1 pl-1">
                        <div className="text-[13px] font-semibold text-foreground truncate">{call.title || call.id}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{call.date}</div>
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                )}
              </div>
            </>
          )}
        </div>

        {/* Left: call analysis */}
        <div className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-in-out">
              {/* Header */}
              <div className="px-8 pt-6 pb-0 border-b border-border bg-card">
                <button
                  onClick={() => setCallListCollapsed((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors mb-4"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Calls
                </button>

                {activeCall ? (
                  <>
                    <div className="flex items-center justify-between mb-4 gap-4">
                      <h1 className="text-2xl font-heading font-bold text-foreground tracking-tight leading-tight">{activeCall.title || activeCall.id}</h1>
                      <button
                        type="button"
                        onClick={handleReanalyzeMeeting}
                        disabled={reanalyzing}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white text-sm font-semibold rounded-lg shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.5)] active:translate-y-0 transition-all shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
                      >
                        {reanalyzing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4" />
                            Analyze
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                      {typeof playbookAnalysis?.overall_score === 'number' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[hsl(var(--forskale-green)/0.08)] border border-[hsl(var(--forskale-green)/0.2)] text-status-great font-semibold">
                          <span className="w-1.5 h-1.5 rounded-full bg-status-great" />
                          {playbookAnalysis.overall_score}% of sales playbook executed
                        </span>
                      )}
                      <span>{activeCall.date}</span>
                      <span className="inline-flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> 2 speakers
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1 mb-4">Select a meeting from the list.</p>
                )}

                {activeCall && (
                  <div className="flex gap-8">
                    {[
                      { id: 'feedback', label: 'Feedback' },
                      { id: 'playbook', label: 'Playbook' },
                      { id: 'summary', label: 'Summary' },
                      { id: 'templates', label: 'Templates' },
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveCallTab(tab.id as typeof activeCallTab)}
                        className={`relative pb-3 text-sm font-semibold transition-colors ${
                          activeCallTab === tab.id
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {tab.label}
                        {activeCallTab === tab.id && (
                          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue rounded-full" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto atlas-scrollbar p-8 bg-background transition-all duration-300 ease-in-out">

            {activeCall && (
              <>

                {/* ── Full meeting re-analysis overlay ── */}
                {reanalyzing && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card rounded-2xl shadow-2xl border border-border p-8 max-w-md w-full mx-4 space-y-6 animate-slide-up">
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue opacity-20 animate-ping" />
                          <div className="relative w-14 h-14 rounded-full bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue flex items-center justify-center">
                            <Sparkles className="h-7 w-7 text-white animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-lg font-heading font-bold text-foreground">Analyzing Meeting</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Running full AI analysis — insights, feedback, playbook, and Q&A extraction. This may take up to a minute.
                        </p>
                      </div>
                      <div className="space-y-3">
                        {[
                          { icon: FileText, label: 'Generating call insights & summary', delay: '0s' },
                          { icon: TrendingUp, label: 'Analyzing performance metrics', delay: '0.4s' },
                          { icon: Brain, label: 'Evaluating playbook compliance', delay: '0.8s' },
                          { icon: HelpCircle, label: 'Extracting Q&A from transcript', delay: '1.2s' },
                          { icon: CheckCircle2, label: 'Finalizing analysis', delay: '1.6s' },
                        ].map((step, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-secondary/60 border border-border/50 opacity-0"
                            style={{ animation: `fadeSlideIn 0.5s ease forwards ${step.delay}` }}
                          >
                            <step.icon className="h-4 w-4 text-forskale-teal shrink-0" />
                            <span className="text-sm text-foreground font-medium flex-1">{step.label}</span>
                            <Loader2 className="h-3.5 w-3.5 text-forskale-teal animate-spin shrink-0" />
                          </div>
                        ))}
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue"
                          style={{ animation: 'progressShimmer 4s ease-in-out infinite' }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                {reanalyzing && (
                  <style>{`
                    @keyframes fadeSlideIn {
                      from { opacity: 0; transform: translateY(8px); }
                      to   { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes progressShimmer {
                      0%   { width: 5%; }
                      50%  { width: 75%; }
                      100% { width: 95%; }
                    }
                    @keyframes slide-up {
                      from { opacity: 0; transform: translateY(24px) scale(0.97); }
                      to   { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .animate-slide-up {
                      animation: slide-up 0.35s ease-out;
                    }
                  `}</style>
                )}

                {activeCallTab === 'summary' && (
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground mb-3">
                      {activeCall.date} • {activeCall.duration} with client
                    </div>

                    {/* Summary */}
                    <div className="border border-border rounded-xl bg-card shadow-card transition-all hover:shadow-card-md">
                      <button
                        type="button"
                        onClick={() => setSummarySubOpen((o) => !o)}
                        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
                      >
                        <FileText className="h-4 w-4 text-forskale-teal" />
                        <span className="text-sm font-semibold text-foreground flex-1">Summary</span>
                        {summarySubOpen ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      {summarySubOpen && (
                        <div className="px-4 pb-4 border-t border-border pt-3 space-y-3 animate-fade-in">
                          {/* Key Takeaways */}
                          <div className="border border-border rounded-xl bg-card shadow-card transition-all hover:shadow-card-md">
                            <button
                              type="button"
                              onClick={() =>
                                setSummaryAccordionOpen((s) => ({ ...s, keyTakeaways: !s.keyTakeaways }))
                              }
                              className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
                            >
                              <Lightbulb className="h-4 w-4 text-forskale-teal" />
                              <span className="text-sm font-semibold text-foreground flex-1">Key Takeaways</span>
                              {summaryAccordionOpen.keyTakeaways ? (
                                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                              ) : (
                                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                              )}
                            </button>
                            {summaryAccordionOpen.keyTakeaways && (
                              <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in">
                                {!transcriptLines || transcriptLines.length === 0 ? null : atlasInsightsLoading ? (
                                  <p className="text-xs text-muted-foreground">Generating summary…</p>
                                ) : atlasInsightsError ? (
                                  <p className="text-xs text-destructive">{atlasInsightsError}</p>
                                ) : (
                                  <ul className="space-y-1.5">
                                    {(atlasInsights?.summary?.key_takeaways || []).map((t, idx) => (
                                      <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-forskale-green shrink-0" />
                                        {t}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Discussion Topics */}
                          <div>
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1 py-2">
                              Discussion Topics
                            </div>
                            <div className="space-y-2">
                              {/* Introduction and overview */}
                              <div className="border border-border rounded-xl bg-card shadow-card transition-all hover:shadow-card-md">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSummaryAccordionOpen((s) => ({
                                      ...s,
                                      introductionOverview: !s.introductionOverview,
                                    }))
                                  }
                                  className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
                                >
                                  <FileText className="h-4 w-4 text-forskale-teal" />
                                  <span className="text-sm font-semibold text-foreground flex-1">
                                    Introduction and overview
                                  </span>
                                  {summaryAccordionOpen.introductionOverview ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                  )}
                                </button>
                                {summaryAccordionOpen.introductionOverview && (
                                  <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in">
                                    <ul className="space-y-1.5">
                                      {(atlasInsights?.summary?.introduction_and_overview || []).map((t, idx) => (
                                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-forskale-green shrink-0" />
                                          {t}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              {/* Current Challenges */}
                              <div className="border border-border rounded-xl bg-card shadow-card transition-all hover:shadow-card-md">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSummaryAccordionOpen((s) => ({
                                      ...s,
                                      currentChallenges: !s.currentChallenges,
                                    }))
                                  }
                                  className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
                                >
                                  <FileText className="h-4 w-4 text-forskale-teal" />
                                  <span className="text-sm font-semibold text-foreground flex-1">Current Challenges</span>
                                  {summaryAccordionOpen.currentChallenges ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                  )}
                                </button>
                                {summaryAccordionOpen.currentChallenges && (
                                  <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in">
                                    <ul className="space-y-1.5">
                                      {(atlasInsights?.summary?.current_challenges || []).map((t, idx) => (
                                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-forskale-green shrink-0" />
                                          {t}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                              {/* Product Fit & Capabilities */}
                              <div className="border border-border rounded-xl bg-card shadow-card transition-all hover:shadow-card-md">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setSummaryAccordionOpen((s) => ({ ...s, productFit: !s.productFit }))
                                  }
                                  className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
                                >
                                  <FileText className="h-4 w-4 text-forskale-teal" />
                                  <span className="text-sm font-semibold text-foreground flex-1">
                                    Product Fit &amp; Capabilities
                                  </span>
                                  {summaryAccordionOpen.productFit ? (
                                    <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                                  ) : (
                                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                                  )}
                                </button>
                                {summaryAccordionOpen.productFit && (
                                  <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in">
                                    <ul className="space-y-1.5">
                                      {(atlasInsights?.summary?.product_fit_and_capabilities || []).map((t, idx) => (
                                        <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2">
                                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-forskale-green shrink-0" />
                                          {t}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Next Steps */}
                    <div className="border border-border rounded-xl bg-card shadow-card transition-all hover:shadow-card-md">
                      <button
                        type="button"
                        onClick={() =>
                          setSummaryAccordionOpen((s) => ({ ...s, nextSteps: !s.nextSteps }))
                        }
                        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
                      >
                        <CheckSquare className="h-4 w-4 text-forskale-teal" />
                        <span className="text-sm font-semibold text-foreground flex-1">Next Steps</span>
                        {summaryAccordionOpen.nextSteps ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      {summaryAccordionOpen.nextSteps && (
                        <div className="px-4 pb-4 pt-3 border-t border-border space-y-2 animate-fade-in">
                          {(atlasInsights?.next_steps || []).map((item, index) => (
                            <div key={index} className="flex items-start gap-3 py-1.5">
                              <input
                                type="checkbox"
                                checked={!!nextStepChecked[index]}
                                onChange={() =>
                                  setNextStepChecked((prev) => ({
                                    ...prev,
                                    [index]: !prev[index],
                                  }))
                                }
                                className="mt-1 rounded border-border accent-forskale-teal"
                              />
                              <div className="flex-1">
                                <span className="text-sm text-forskale-green font-medium">{item.assignee}</span>
                                <span className="text-sm text-foreground ml-1">{item.description}</span>
                              </div>
                              {item.time && (
                                <span className="text-xs text-muted-foreground shrink-0">{item.time}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Questions and Objections */}
                    <div className="border border-border rounded-xl bg-card shadow-card transition-all hover:shadow-card-md">
                      <button
                        type="button"
                        onClick={() =>
                          setSummaryAccordionOpen((s) => ({
                            ...s,
                            questionsObjections: !s.questionsObjections,
                          }))
                        }
                        className="w-full flex items-center gap-2.5 px-4 py-3.5 text-left"
                      >
                        <HelpCircle className="h-4 w-4 text-forskale-teal" />
                        <span className="text-sm font-semibold text-foreground flex-1">
                          Questions and Objections
                        </span>
                        {summaryAccordionOpen.questionsObjections ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                        )}
                      </button>
                      {summaryAccordionOpen.questionsObjections && (
                        <div className="px-4 pb-4 pt-3 border-t border-border space-y-2 animate-fade-in">
                          {(atlasInsights?.questions_and_objections || []).map((item, index) => (
                            <div key={index} className="bg-secondary rounded-lg">
                              <button
                                type="button"
                                onClick={() =>
                                  setQuestionCardsOpen((prev) => ({
                                    ...prev,
                                    [index]: !prev[index],
                                  }))
                                }
                                className="w-full flex items-center justify-between px-3 py-2.5 text-left"
                              >
                                <span className="text-sm text-foreground">{item.question}</span>
                                {questionCardsOpen[index] ? (
                                  <ChevronUp className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                                ) : (
                                  <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 ml-2" />
                                )}
                              </button>
                              {questionCardsOpen[index] && (
                                <div className="px-3 pb-3 space-y-1 animate-fade-in">
                                  <div className="text-xs text-forskale-green font-medium">
                                    Your answer{item.time ? ` at ${item.time}` : ''}
                                  </div>
                                  <div className="text-sm text-muted-foreground">{item.answer}</div>
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
              <div className="space-y-5 relative">

                {/* ── Analyzing overlay / popup ── */}
                {playbookLoading && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-card rounded-2xl shadow-2xl border border-border p-8 max-w-md w-full mx-4 space-y-6 animate-slide-up">
                      {/* Header */}
                      <div className="flex flex-col items-center gap-3 text-center">
                        <div className="relative">
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue opacity-20 animate-ping" />
                          <div className="relative w-14 h-14 rounded-full bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue flex items-center justify-center">
                            <Brain className="h-7 w-7 text-white animate-pulse" />
                          </div>
                        </div>
                        <h3 className="text-lg font-heading font-bold text-foreground">Analyzing Playbook</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          AI is evaluating the transcript against your sales playbook rules. This may take a moment for longer calls.
                        </p>
                      </div>

                      {/* Animated steps */}
                      <div className="space-y-3">
                        {[
                          { icon: FileText, label: 'Fetching transcript', delay: '0s' },
                          { icon: Zap, label: 'Preprocessing & chunking', delay: '0.3s' },
                          { icon: Sparkles, label: 'Analyzing chunks with AI', delay: '0.6s' },
                          { icon: Brain, label: 'Merging results', delay: '0.9s' },
                          { icon: CheckCircle2, label: 'Finalizing playbook analysis', delay: '1.2s' },
                        ].map((step, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-secondary/60 border border-border/50 opacity-0"
                            style={{ animation: `fadeSlideIn 0.5s ease forwards ${step.delay}` }}
                          >
                            <step.icon className="h-4 w-4 text-forskale-teal shrink-0" />
                            <span className="text-sm text-foreground font-medium flex-1">{step.label}</span>
                            <Loader2 className="h-3.5 w-3.5 text-forskale-teal animate-spin shrink-0" />
                          </div>
                        ))}
                      </div>

                      {/* Progress shimmer */}
                      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue"
                          style={{ animation: 'progressShimmer 3s ease-in-out infinite' }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Keyframe styles for the popup */}
                {playbookLoading && (
                  <style>{`
                    @keyframes fadeSlideIn {
                      from { opacity: 0; transform: translateY(8px); }
                      to   { opacity: 1; transform: translateY(0); }
                    }
                    @keyframes progressShimmer {
                      0%   { width: 5%; }
                      50%  { width: 80%; }
                      100% { width: 95%; }
                    }
                    @keyframes slide-up {
                      from { opacity: 0; transform: translateY(24px) scale(0.97); }
                      to   { opacity: 1; transform: translateY(0) scale(1); }
                    }
                    .animate-slide-up {
                      animation: slide-up 0.35s ease-out;
                    }
                  `}</style>
                )}

                {/* Playbook header card */}
                <div className="bg-card rounded-xl border border-border shadow-card">
                  <div className="flex items-center gap-3 p-4 flex-wrap">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setPlaybookDropdownOpen((o) => !o)}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-accent w-[180px]"
                    >
                      <span className="flex-1 text-left truncate">
                        {playbookAnalysis?.template_name || selectedPlaybookName}
                      </span>
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    </button>
                    {playbookDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 min-w-[240px] rounded-lg border border-border bg-card shadow-card-md z-20 overflow-hidden">
                        <div className="py-1">
                          {playbookTemplates.map((opt) => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setSelectedPlaybookId(opt.id)
                                setSelectedPlaybookName(opt.name)
                                setPlaybookDropdownOpen(false)
                                handleAnalyzePlaybook(opt.id)
                              }}
                              className="w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 hover:bg-accent"
                            >
                              <span className={(playbookAnalysis?.template_name || selectedPlaybookName) === opt.name ? 'font-medium text-forskale-teal' : 'text-foreground'}>
                                {opt.name}
                              </span>
                              <span className="text-[11px] text-muted-foreground shrink-0">{opt.items} items</span>
                            </button>
                          ))}
                        </div>
                        <div className="border-t border-border">
                          <button type="button" onClick={() => { setPlaybookDropdownOpen(false); setActiveCallTab('templates'); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-accent">
                            <ListChecks className="h-3.5 w-3.5" /> Edit Templates
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                    {typeof playbookAnalysis?.overall_score === 'number' && (
                      <span className="flex items-center gap-1.5 shrink-0">
                        <Check className="h-4 w-4 text-status-great" />
                        <span className="text-sm font-semibold text-status-great">{playbookAnalysis.overall_score}% playbook executed</span>
                      </span>
                    )}
                    <div className="ml-auto flex shrink-0 gap-2">
                      <button type="button" onClick={() => handleAnalyzePlaybook()} disabled={playbookLoading}
                        className="px-3 py-1.5 bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white text-xs font-semibold rounded-lg shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.5)] active:translate-y-0 transition-all disabled:opacity-60">
                        {playbookLoading ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin inline mr-1.5" />
                            Analyzing…
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-3.5 w-3.5 inline mr-1.5" />
                            Analyze this meeting
                          </>
                        )}
                      </button>
                      <button className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-medium text-foreground hover:bg-accent transition-colors h-7">
                        <Download className="h-3.5 w-3.5" /> Download playbook
                      </button>
                    </div>
                  </div>
                  {playbookAnalysis?.coaching_summary && (
                    <div className="px-4 pb-4 border-t border-border pt-3 animate-fade-in">
                      <span className="text-xs text-muted-foreground">— {playbookAnalysis.coaching_summary}</span>
                    </div>
                  )}
                </div>

                {playbookError && (
                  <div className="text-xs text-destructive">{playbookError}</div>
                )}

                {playbookAnalysis?.dimension_scores && Object.keys(playbookAnalysis.dimension_scores).length > 0 && (
                  <div className="flex gap-3 flex-wrap">
                    {['Handled objections', 'Personalized demo', 'Intro Banter', 'Set Agenda', 'Demo told a story'].map((dim) => {
                      const pct = playbookAnalysis.dimension_scores?.[dim]
                      if (pct == null) return null
                      return (
                        <div key={dim} className={`rounded-xl border px-4 py-2.5 text-center min-w-[120px] bg-card shadow-card transition-all hover:-translate-y-0.5 hover:shadow-card-md ${pct >= 80 ? 'border-[hsl(var(--forskale-green)/0.2)]' : pct >= 20 ? 'border-[hsl(var(--forskale-cyan)/0.2)]' : 'border-border'}`}>
                          <div className="text-[11px] text-muted-foreground">{dim}</div>
                          <div className={`text-lg font-bold font-heading ${pct >= 80 ? 'text-status-great' : pct >= 20 ? 'text-status-okay' : 'text-muted-foreground'}`}>{pct}%</div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {playbookAnalysis && playbookAnalysis.rules.length > 0 ? (
                  <div className="space-y-2">
                    {playbookAnalysis.rules.map((rule, index) => (
                      <div
                        key={rule.rule_id || rule.label || index}
                        className="border border-border rounded-xl overflow-hidden bg-card shadow-card transition-all hover:shadow-card-md"
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
                            <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 shrink-0" />
                          )}
                          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
                            <span className="text-sm text-foreground flex-1 font-medium">{rule.label}</span>
                            {!rule.passed && (
                              <span className="inline-flex items-center rounded-full text-[10px] h-5 px-2 border border-[hsl(var(--forskale-green)/0.3)] text-status-great bg-[hsl(var(--badge-green-bg))]">
                                Key Driver
                              </span>
                            )}
                          </div>
                          {playbookRuleOpen[index] ? (
                            <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                          )}
                        </button>
                        {playbookRuleOpen[index] && (
                          <div className="border-t border-border px-4 py-3 text-xs space-y-3 animate-fade-in">
                            <div>
                              <div className="font-medium text-muted-foreground mb-1.5">
                                What you said
                              </div>
                              <div className="bg-secondary rounded-lg p-3 text-xs text-foreground leading-relaxed">
                                {rule.what_you_said && rule.what_you_said.trim()
                                  ? rule.what_you_said
                                  : 'No relevant quote found in transcript.'}
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-muted-foreground mb-1.5">
                                What you should say
                              </div>
                              <div className="bg-[hsl(var(--badge-green-bg))] rounded-lg p-3 text-xs text-foreground leading-relaxed border border-[hsl(var(--forskale-green)/0.2)]">
                                {rule.what_you_should_say && rule.what_you_should_say.trim()
                                  ? rule.what_you_should_say
                                  : '—'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-secondary/50 px-4 py-6 text-sm text-muted-foreground">
                    Click <span className="font-medium">“Analyze this meeting”</span> to compare the
                    transcript with your Sales Playbook and mark which rules were followed.
                  </div>
                )}
              </div>
            )}

            {activeCallTab === 'feedback' && (
              <div className="space-y-8">
                {/* Performance Metrics */}
                <section>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <TrendingUp className="h-4 w-4 text-forskale-teal" />
                      <h2 className="text-lg font-heading font-bold text-foreground">Performance Metrics</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      {typeof feedbackData?.quality_score === 'number' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg forskale-gradient-subtle border border-[hsl(var(--forskale-teal)/0.2)] text-xs font-semibold text-forskale-teal">
                          <Sparkles className="h-3.5 w-3.5" />
                          {feedbackData.quality_score}% call quality
                        </span>
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
                        className="px-3 py-1.5 bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white text-xs font-semibold rounded-lg shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.5)] active:translate-y-0 transition-all disabled:opacity-60"
                      >
                        {feedbackLoading ? 'Analyzing…' : 'Analyze feedback'}
                      </button>
                    </div>
                  </div>
                  {feedbackLoading && (
                    <div className="text-xs text-muted-foreground">Loading metrics…</div>
                  )}
                  {!feedbackLoading && feedbackError && (
                    <div className="text-xs text-destructive">{feedbackError}</div>
                  )}
                  {!feedbackLoading &&
                    !feedbackError &&
                    (feedbackData?.metrics || []).length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {(feedbackData?.metrics || []).map((metric, index) => {
                          const rating =
                            metric.status_level === 'great'
                              ? 'Great!'
                              : metric.status_level === 'poor'
                                ? 'Needs work'
                                : 'Okay'
                          const ratingColor =
                            metric.status_level === 'great'
                              ? 'text-status-great'
                              : metric.status_level === 'poor'
                                ? 'text-status-needs-work'
                                : 'text-status-okay'
                          return (
                            <div
                              key={index}
                              className="bg-card border border-border rounded-xl p-5 cursor-pointer transition-all duration-300 shadow-card hover:border-forskale-teal hover:shadow-card-md hover:-translate-y-0.5"
                            >
                              <div className="flex flex-col items-center justify-center text-center gap-2 min-h-[80px]">
                                <span className="text-sm font-semibold text-foreground leading-tight">{metric.label}</span>
                                <span className={`text-base font-bold font-heading ${ratingColor}`}>{rating}</span>
                              </div>
                              {metric.value && (
                                <div className="mt-3 pt-3 border-t border-border">
                                  <p className="text-xs text-muted-foreground text-center leading-relaxed">
                                    {metric.has_link && metric.link_url ? (
                                      <a href={metric.link_url} target="_blank" rel="noopener noreferrer" className="text-forskale-teal underline hover:text-forskale-green">
                                        {metric.value}
                                      </a>
                                    ) : (
                                      metric.value
                                    )}
                                  </p>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  {!feedbackLoading &&
                    !feedbackError &&
                    (!feedbackData || feedbackData.metrics.length === 0) && (
                      <div className="text-xs text-muted-foreground">
                        Metrics will appear here once feedback has been generated from the
                        transcript.
                      </div>
                    )}
                </section>
                {/* AI Sales Coach feedback */}
                <section>
                  <div className="flex items-center gap-2.5 mb-5">
                    <Sparkles className="h-4 w-4 text-forskale-teal" />
                    <h2 className="text-lg font-heading font-bold text-foreground">AI Sales Coach feedback</h2>
                  </div>

                  <div className="mb-5">
                    <div className="flex items-center gap-2 mb-3">
                      <ThumbsUp className="h-3.5 w-3.5 text-forskale-green" />
                      <span className="text-[15px] font-semibold text-foreground">What you did well</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(feedbackData?.did_well || []).map((item, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-5 transition-all duration-300 shadow-card hover:border-forskale-teal hover:shadow-card-md hover:-translate-y-0.5">
                          <div className="flex gap-3">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-forskale-green" />
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-foreground leading-tight mb-1.5">{item.title}</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">{item.details || ''}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!feedbackLoading &&
                        (!feedbackData || feedbackData.did_well.length === 0) && (
                          <div className="text-xs text-muted-foreground px-1">
                            Positive coaching points will appear here after feedback is generated.
                          </div>
                        )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-3.5 w-3.5 text-forskale-cyan" />
                      <span className="text-[15px] font-semibold text-foreground">Where you can improve</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(feedbackData?.improve || []).map((item, i) => (
                        <div key={i} className="bg-card border border-border rounded-xl p-5 transition-all duration-300 shadow-card hover:border-forskale-teal hover:shadow-card-md hover:-translate-y-0.5">
                          <div className="flex gap-3">
                            <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 bg-forskale-cyan" />
                            <div className="min-w-0">
                              <h4 className="text-sm font-semibold text-foreground leading-tight mb-1.5">{item.title}</h4>
                              <p className="text-xs text-muted-foreground leading-relaxed">{item.details || ''}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {!feedbackLoading &&
                        (!feedbackData || feedbackData.improve.length === 0) && (
                          <div className="text-xs text-muted-foreground px-1">
                            Coaching opportunities will appear here after feedback is generated.
                          </div>
                        )}
                    </div>
                  </div>
                </section>

                {/* Section 2: Overall Performance (Longitudinal, cross-meeting feedback) */}
                <section className="space-y-4 pt-6 border-t border-border">
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2.5">
                      <Brain className="h-4 w-4 text-forskale-teal" />
                      <h2 className="text-lg font-heading font-bold text-foreground">Overall Performance</h2>
                    </div>
                    <span className="text-xs text-muted-foreground">Last 30 days • Cross-meeting insights</span>
                  </div>

                  {enablementLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4">
                      <Loader2 className="h-8 w-8 animate-spin text-forskale-teal mb-2" />
                      <p className="text-sm text-muted-foreground">Loading performance insights...</p>
                    </div>
                  ) : enablementError ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-destructive/30 bg-destructive/5">
                      <AlertCircle className="h-8 w-8 text-destructive mb-2" />
                      <p className="text-sm text-destructive mb-2">{enablementError}</p>
                    </div>
                  ) : !enablementFeedback || enablementFeedback.total_calls_analyzed === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border border-dashed border-border bg-secondary/50">
                      <Info className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-foreground text-center mb-1">Not enough data yet</p>
                      <p className="text-xs text-muted-foreground text-center max-w-sm">
                        Complete at least 5 calls to receive personalized coaching insights across your meetings
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Overall Summary */}
                      {(enablementFeedback.overall_quality_trend || enablementFeedback.top_strength || enablementFeedback.top_opportunity) && (
                        <div className="rounded-xl forskale-gradient-subtle border border-[hsl(var(--forskale-teal)/0.2)] p-5">
                          {enablementFeedback.overall_quality_trend && (
                            <div className="flex items-center gap-2 mb-2">
                              {enablementFeedback.overall_quality_trend === 'improving' ? (
                                <TrendingUp className="h-4 w-4 text-status-great" />
                              ) : enablementFeedback.overall_quality_trend === 'declining' ? (
                                <TrendingDown className="h-4 w-4 text-destructive" />
                              ) : (
                                <Minus className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="text-sm font-medium text-foreground">
                                Performance is <span className="capitalize">{enablementFeedback.overall_quality_trend}</span>
                              </span>
                            </div>
                          )}
                          {enablementFeedback.top_strength && (
                            <p className="text-sm text-foreground mb-1">
                              <span className="font-medium text-status-great">Strength:</span> {enablementFeedback.top_strength}
                            </p>
                          )}
                          {enablementFeedback.top_opportunity && (
                            <p className="text-sm text-foreground">
                              <span className="font-medium text-forskale-cyan">Opportunity:</span> {enablementFeedback.top_opportunity}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            Based on {enablementFeedback.total_calls_analyzed} calls analyzed
                          </p>
                        </div>
                      )}

                      {/* Risk Signals */}
                      {enablementFeedback.risk_signals.length > 0 && (
                        <div>
                          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1 py-2 flex items-center gap-1.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                            Risk Signals
                          </h4>
                          <div className="space-y-2">
                            {enablementFeedback.risk_signals.map((card) => (
                              <div key={card.id} className="border border-border rounded-xl overflow-hidden bg-card shadow-card transition-all hover:shadow-card-md">
                                <button
                                  onClick={() => setEnablementCardsExpanded((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
                                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                                >
                                  <div className="p-1.5 rounded-lg text-destructive bg-destructive/10 shrink-0 mt-0.5">
                                    <AlertTriangle className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="text-sm font-medium text-foreground">{card.title}</h5>
                                      <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                                        {Math.round(card.confidence * 100)}%
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{card.description}</p>
                                  </div>
                                  <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${enablementCardsExpanded[card.id] ? 'rotate-180' : ''}`} />
                                </button>
                                {enablementCardsExpanded[card.id] && (
                                  <div className="border-t border-border bg-secondary/30 px-4 py-3 space-y-3 animate-fade-in">
                                    <div>
                                      <p className="text-xs font-medium text-foreground mb-1.5">Evidence</p>
                                      <div className="text-xs text-muted-foreground space-y-1">
                                        <div>Calls analyzed: <span className="font-medium text-foreground">{card.evidence.calls_analyzed}</span></div>
                                        {card.evidence.calls_above_threshold !== undefined && (
                                          <div>Pattern appears in: <span className="font-medium text-foreground">{card.evidence.calls_above_threshold} calls</span></div>
                                        )}
                                      </div>
                                    </div>
                                    {card.suggestions.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1">
                                          <Sparkles className="h-3 w-3 text-forskale-teal" />
                                          Suggestions
                                        </p>
                                        <ul className="space-y-1.5">
                                          {card.suggestions.map((suggestion, idx) => (
                                            <li key={idx} className="text-xs text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-destructive">
                                              {suggestion}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Improvement Opportunities */}
                      {enablementFeedback.improvements.length > 0 && (
                        <div>
                          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1 py-2 flex items-center gap-1.5">
                            <Lightbulb className="h-3.5 w-3.5 text-forskale-cyan" />
                            Improvement Opportunities
                          </h4>
                          <div className="space-y-2">
                            {enablementFeedback.improvements.map((card) => (
                              <div key={card.id} className="border border-border rounded-xl overflow-hidden bg-card shadow-card transition-all hover:shadow-card-md">
                                <button
                                  onClick={() => setEnablementCardsExpanded((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
                                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                                >
                                  <div className="p-1.5 rounded-lg text-forskale-cyan bg-[hsl(var(--forskale-cyan)/0.1)] shrink-0 mt-0.5">
                                    <Lightbulb className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="text-sm font-medium text-foreground">{card.title}</h5>
                                      <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                                        {Math.round(card.confidence * 100)}%
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{card.description}</p>
                                  </div>
                                  <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${enablementCardsExpanded[card.id] ? 'rotate-180' : ''}`} />
                                </button>
                                {enablementCardsExpanded[card.id] && (
                                  <div className="border-t border-border bg-secondary/30 px-4 py-3 space-y-3 animate-fade-in">
                                    <div>
                                      <p className="text-xs font-medium text-foreground mb-1.5">Evidence</p>
                                      <div className="text-xs text-muted-foreground space-y-1">
                                        <div>Calls analyzed: <span className="font-medium text-foreground">{card.evidence.calls_analyzed}</span></div>
                                        {card.evidence.calls_above_threshold !== undefined && (
                                          <div>Pattern appears in: <span className="font-medium text-foreground">{card.evidence.calls_above_threshold} calls</span></div>
                                        )}
                                      </div>
                                    </div>
                                    {card.suggestions.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1">
                                          <Sparkles className="h-3 w-3 text-forskale-teal" />
                                          Suggestions
                                        </p>
                                        <ul className="space-y-1.5">
                                          {card.suggestions.map((suggestion, idx) => (
                                            <li key={idx} className="text-xs text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-forskale-cyan">
                                              {suggestion}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Observations */}
                      {enablementFeedback.observations.length > 0 && (
                        <div>
                          <h4 className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium px-1 py-2 flex items-center gap-1.5">
                            <Eye className="h-3.5 w-3.5 text-forskale-teal" />
                            Observations
                          </h4>
                          <div className="space-y-2">
                            {enablementFeedback.observations.map((card) => (
                              <div key={card.id} className="border border-border rounded-xl overflow-hidden bg-card shadow-card transition-all hover:shadow-card-md">
                                <button
                                  onClick={() => setEnablementCardsExpanded((prev) => ({ ...prev, [card.id]: !prev[card.id] }))}
                                  className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-accent/50 transition-colors"
                                >
                                  <div className="p-1.5 rounded-lg text-forskale-teal bg-[hsl(var(--forskale-teal)/0.1)] shrink-0 mt-0.5">
                                    <Eye className="h-4 w-4" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                      <h5 className="text-sm font-medium text-foreground">{card.title}</h5>
                                      <span className="text-[10px] text-muted-foreground px-2 py-0.5 rounded-full bg-secondary">
                                        {Math.round(card.confidence * 100)}%
                                      </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground">{card.description}</p>
                                  </div>
                                  <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${enablementCardsExpanded[card.id] ? 'rotate-180' : ''}`} />
                                </button>
                                {enablementCardsExpanded[card.id] && (
                                  <div className="border-t border-border bg-secondary/30 px-4 py-3 space-y-3 animate-fade-in">
                                    <div>
                                      <p className="text-xs font-medium text-foreground mb-1.5">Evidence</p>
                                      <div className="text-xs text-muted-foreground space-y-1">
                                        <div>Calls analyzed: <span className="font-medium text-foreground">{card.evidence.calls_analyzed}</span></div>
                                        {card.evidence.calls_above_threshold !== undefined && (
                                          <div>Pattern appears in: <span className="font-medium text-foreground">{card.evidence.calls_above_threshold} calls</span></div>
                                        )}
                                        {card.evidence.metric_average !== undefined && (
                                          <div>Average: <span className="font-medium text-foreground">{typeof card.evidence.metric_average === 'number' ? card.evidence.metric_average.toFixed(2) : card.evidence.metric_average}</span></div>
                                        )}
                                      </div>
                                    </div>
                                    {card.suggestions.length > 0 && (
                                      <div>
                                        <p className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1">
                                          <Sparkles className="h-3 w-3 text-forskale-teal" />
                                          Suggestions
                                        </p>
                                        <ul className="space-y-1.5">
                                          {card.suggestions.map((suggestion, idx) => (
                                            <li key={idx} className="text-xs text-muted-foreground pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-forskale-teal">
                                              {suggestion}
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </section>
              </div>
            )}

            {activeCallTab === 'comments' && (
              <div className="flex flex-col gap-4 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <MessageCircle className="h-4 w-4 text-forskale-teal" />
                    <h3 className="text-lg font-heading font-bold text-foreground">Comments</h3>
                  </div>
                </div>
                <div className="space-y-3">
                  {commentsLoading && (
                    <div className="text-xs text-muted-foreground px-1">Loading comments…</div>
                  )}
                  {commentsError && (
                    <div className="text-xs text-destructive px-1">{commentsError}</div>
                  )}
                  {!commentsLoading && comments.length === 0 && !commentsError && (
                    <div className="flex flex-col items-center justify-center py-6 px-4 border border-dashed border-border rounded-xl bg-secondary/50">
                      <div className="relative flex items-center justify-center mb-3">
                        <MessageCircle
                          className="h-10 w-10 text-forskale-teal/20 stroke-[1.5]"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                        <MessageCircle
                          className="absolute h-6 w-6 text-forskale-teal stroke-[1.5]"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </div>
                      <p className="text-sm font-semibold text-foreground mb-1 text-center">
                        No comments yet
                      </p>
                      <p className="text-xs text-muted-foreground text-center max-w-xs">
                        Use the box below to leave internal notes or coaching feedback for this
                        meeting.
                      </p>
                    </div>
                  )}
                  {comments.map((c) => (
                    <div
                      key={c.id}
                      className="rounded-xl border border-border bg-card px-4 py-3 text-sm flex flex-col gap-1 shadow-card"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">{c.author}</span>{' '}
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
                            className="text-xs text-muted-foreground hover:text-foreground px-1 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(c.id)}
                            className="text-xs text-destructive/60 hover:text-destructive px-1 transition-colors"
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
                            className="w-full text-sm border border-border rounded-lg px-2 py-1 bg-secondary focus:outline-none focus:ring-1 focus:ring-forskale-teal/30 focus:border-forskale-teal"
                          />
                          <div className="flex items-center justify-end gap-2 text-xs">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCommentId(null)
                                setEditingCommentText('')
                              }}
                              className="px-2 py-0.5 rounded-lg border border-border text-muted-foreground hover:bg-accent transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEditComment}
                              className="px-2 py-0.5 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white hover:-translate-y-0.5 transition-all"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-foreground text-sm mt-0.5">{c.text}</div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-2 border-t border-border pt-3">
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Add a comment
                  </label>
                  <div className="flex items-end gap-2">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={2}
                      placeholder="Write an internal note or coaching suggestion for this meeting..."
                      className="flex-1 text-sm border border-border rounded-lg px-3 py-2 bg-secondary focus:outline-none focus:ring-1 focus:ring-forskale-teal/30 focus:border-forskale-teal"
                    />
                    <button
                      type="button"
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="px-3 py-2 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-xs font-semibold text-white hover:-translate-y-0.5 transition-all disabled:opacity-60"
                    >
                      Post
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeCallTab === 'templates' && (
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <div className="flex-1" />
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await playbooksAPI.create({ name: `Custom Template ${playbookTemplates.length + 1}`, rules: [] })
                        await refreshPlaybookTemplates()
                        // Auto-select the new template
                        const newId = res.data?.id
                        if (newId) {
                          setSelectedPlaybookId(newId)
                          setSelectedPlaybookName(`Custom Template ${playbookTemplates.length + 1}`)
                        }
                        toast.success('Template created!')
                      } catch {
                        toast.error('Failed to create template')
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white text-xs font-semibold rounded-lg shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.5)] active:translate-y-0 transition-all"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Create template
                  </button>
                </div>

                <div className="flex gap-6">
                  <div className="w-1/2 space-y-2">
                    {playbookTemplates.map((t) => {
                      const isSelected = selectedPlaybookId === t.id
                      const isDefault = t.is_default
                      return (
                        <div
                          key={t.id}
                          onClick={() => {
                            setSelectedPlaybookId(t.id)
                            setSelectedPlaybookName(t.name)
                          }}
                          className={`flex items-center justify-between rounded-xl border px-5 py-4 cursor-pointer transition-all ${
                            isSelected
                              ? 'border-[hsl(var(--forskale-teal)/0.3)] bg-[hsl(var(--forskale-teal)/0.04)] shadow-sm'
                              : 'border-border bg-card hover:border-[hsl(var(--forskale-teal)/0.15)] hover:bg-accent/50'
                          }`}
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="text-sm font-semibold text-foreground truncate">{t.name}</div>
                            <div className="text-xs text-muted-foreground">{t.items} rule{t.items !== 1 ? 's' : ''}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation()
                                try {
                                  await playbooksAPI.setDefault(t.id)
                                  await refreshPlaybookTemplates()
                                  toast.success('Default template updated')
                                } catch {
                                  toast.error('Failed to set default')
                                }
                              }}
                              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap border ${
                                isDefault
                                  ? 'bg-[hsl(var(--badge-green-bg))] text-status-great border-[hsl(var(--forskale-green)/0.3)]'
                                  : 'text-muted-foreground hover:text-foreground border-border hover:border-foreground/20 hover:bg-accent'
                              }`}
                            >
                              {isDefault && <CheckCircle2 className="h-3.5 w-3.5" />}
                              {isDefault ? 'Default' : 'Set Default'}
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation()
                                if (window.confirm(`Delete "${t.name}"?`)) {
                                  handleDeleteTemplate(t.id)
                                }
                              }}
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Delete template"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                    {playbookTemplates.length === 0 && (
                      <div className="rounded-xl bg-secondary/50 flex items-center justify-center min-h-[320px]">
                        <div className="text-center space-y-2 px-6">
                          <h3 className="text-lg font-heading font-semibold text-foreground">
                            No playbook templates yet
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Create a template to start organizing your sales playbook rules.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {selectedPlaybookId && playbookTemplates.find((t) => t.id === selectedPlaybookId) && (
                    <div className="w-1/2 rounded-xl border border-border bg-card p-5 space-y-4 shadow-card h-fit sticky top-0">
                      {/* Template name header - editable */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          {templateEditingName ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={templateNameDraft}
                                onChange={(e) => setTemplateNameDraft(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleRenameTemplate(); if (e.key === 'Escape') setTemplateEditingName(false) }}
                                autoFocus
                                className="flex-1 text-lg font-heading font-bold text-foreground bg-secondary border border-border rounded-md px-2 py-1 outline-none focus:border-forskale-teal"
                              />
                              <button
                                type="button"
                                onClick={handleRenameTemplate}
                                disabled={templateDetailSaving || !templateNameDraft.trim()}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-status-great hover:bg-accent transition-colors disabled:opacity-50"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setTemplateEditingName(false)}
                                className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 group">
                              <h3 className="text-lg font-heading font-bold text-foreground truncate">
                                {playbookTemplates.find((t) => t.id === selectedPlaybookId)?.name}
                              </h3>
                              <button
                                type="button"
                                onClick={() => {
                                  setTemplateNameDraft(playbookTemplates.find((t) => t.id === selectedPlaybookId)?.name || '')
                                  setTemplateEditingName(true)
                                }}
                                className="h-6 w-6 inline-flex items-center justify-center rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent transition-all"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                            </div>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            {templateDetailRules.length} rule{templateDetailRules.length !== 1 ? 's' : ''} configured
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('Delete this template? This cannot be undone.')) {
                              handleDeleteTemplate(selectedPlaybookId!)
                            }
                          }}
                          className="shrink-0 h-8 w-8 inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Rules list */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rules</div>
                          {templateDetailSaving && (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Loader2 className="h-3 w-3 animate-spin" /> Saving…
                            </span>
                          )}
                        </div>

                        {templateDetailLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-5 w-5 animate-spin text-forskale-teal" />
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {templateDetailRules.map((rule, idx) => (
                              <div
                                key={rule.id || idx}
                                className="rounded-lg border border-border bg-secondary/30 overflow-hidden transition-all hover:border-[hsl(var(--forskale-teal)/0.2)]"
                              >
                                {editingRuleIndex === idx ? (
                                  /* Editing mode */
                                  <div className="p-3 space-y-2">
                                    <input
                                      type="text"
                                      value={editingRuleLabel}
                                      onChange={(e) => setEditingRuleLabel(e.target.value)}
                                      placeholder="Rule label"
                                      autoFocus
                                      className="w-full text-sm font-medium text-foreground bg-card border border-border rounded-md px-2.5 py-1.5 outline-none focus:border-forskale-teal"
                                    />
                                    <textarea
                                      value={editingRuleDescription}
                                      onChange={(e) => setEditingRuleDescription(e.target.value)}
                                      placeholder="Description (optional)"
                                      rows={2}
                                      className="w-full text-xs text-muted-foreground bg-card border border-border rounded-md px-2.5 py-1.5 outline-none focus:border-forskale-teal resize-none"
                                    />
                                    <div className="flex items-center gap-2 justify-end">
                                      <button
                                        type="button"
                                        onClick={() => setEditingRuleIndex(null)}
                                        className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        disabled={!editingRuleLabel.trim() || templateDetailSaving}
                                        onClick={() => {
                                          const updated = [...templateDetailRules]
                                          updated[idx] = {
                                            ...updated[idx],
                                            label: editingRuleLabel.trim(),
                                            description: editingRuleDescription.trim(),
                                          }
                                          handleSaveTemplateRules(updated)
                                          setEditingRuleIndex(null)
                                        }}
                                        className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white rounded-md disabled:opacity-50 transition-all"
                                      >
                                        Save
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* View mode */
                                  <div className="flex items-start gap-3 px-3 py-2.5 group">
                                    <div className="mt-0.5 shrink-0 w-5 h-5 rounded-full bg-[hsl(var(--forskale-teal)/0.1)] flex items-center justify-center text-[10px] font-bold text-forskale-teal">
                                      {idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="text-sm font-medium text-foreground">{rule.label}</div>
                                      {rule.description && (
                                        <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{rule.description}</div>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setEditingRuleIndex(idx)
                                          setEditingRuleLabel(rule.label)
                                          setEditingRuleDescription(rule.description || '')
                                        }}
                                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                                        title="Edit rule"
                                      >
                                        <Pencil className="h-3.5 w-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const updated = templateDetailRules.filter((_, i) => i !== idx)
                                          handleSaveTemplateRules(updated)
                                        }}
                                        className="h-7 w-7 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        title="Delete rule"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}

                            {/* Empty state */}
                            {templateDetailRules.length === 0 && !addingNewRule && (
                              <div className="rounded-lg border border-dashed border-border bg-secondary/30 px-4 py-6 text-center">
                                <p className="text-sm text-muted-foreground">No rules yet. Add your first rule below.</p>
                              </div>
                            )}

                            {/* Add new rule form */}
                            {addingNewRule ? (
                              <div className="rounded-lg border border-[hsl(var(--forskale-teal)/0.3)] bg-[hsl(var(--forskale-teal)/0.03)] p-3 space-y-2">
                                <input
                                  type="text"
                                  value={newRuleLabel}
                                  onChange={(e) => setNewRuleLabel(e.target.value)}
                                  placeholder="Rule label (e.g. Set a clear agenda)"
                                  autoFocus
                                  className="w-full text-sm font-medium text-foreground bg-card border border-border rounded-md px-2.5 py-1.5 outline-none focus:border-forskale-teal"
                                />
                                <textarea
                                  value={newRuleDescription}
                                  onChange={(e) => setNewRuleDescription(e.target.value)}
                                  placeholder="Description (optional)"
                                  rows={2}
                                  className="w-full text-xs text-muted-foreground bg-card border border-border rounded-md px-2.5 py-1.5 outline-none focus:border-forskale-teal resize-none"
                                />
                                <div className="flex items-center gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => { setAddingNewRule(false); setNewRuleLabel(''); setNewRuleDescription('') }}
                                    className="px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground rounded-md hover:bg-accent transition-colors"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    type="button"
                                    disabled={!newRuleLabel.trim() || templateDetailSaving}
                                    onClick={() => {
                                      const newRule: PlaybookTemplateRule = {
                                        id: `rule_${Date.now()}`,
                                        label: newRuleLabel.trim(),
                                        description: newRuleDescription.trim(),
                                      }
                                      handleSaveTemplateRules([...templateDetailRules, newRule])
                                      setAddingNewRule(false)
                                      setNewRuleLabel('')
                                      setNewRuleDescription('')
                                    }}
                                    className="px-3 py-1 text-xs font-semibold bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue text-white rounded-md disabled:opacity-50 transition-all"
                                  >
                                    Add Rule
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setAddingNewRule(true)}
                                className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-[hsl(var(--forskale-teal)/0.3)] hover:bg-accent/50 transition-all"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                Add rule
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
              </>
            )}
            </div>
            </div>

            {/* Right: transcript panel */}
            {activeCall && (
              <div className={`h-screen border-l border-border bg-card flex flex-col overflow-hidden transition-all duration-300 ease-in-out ${transcriptCollapsed ? 'w-[56px] min-w-[56px]' : 'w-[340px] min-w-[340px]'}`}>
                {transcriptCollapsed ? (
                  <>
                    <div className="flex justify-center p-3">
                      <button onClick={() => setTranscriptCollapsed(false)} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                        <PanelRightOpen className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center gap-5 text-muted-foreground">
                      <Monitor className="h-4 w-4" />
                      <Volume2 className="h-4 w-4" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="p-4 border-b border-border">
                      <div className="flex items-center gap-3">
                        <button onClick={() => setTranscriptCollapsed(true)} className="h-8 w-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors">
                          <PanelRightClose className="h-4 w-4" />
                        </button>
                        <Play className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                        <span className="text-xs text-muted-foreground font-mono">00:00 / {activeCall.duration.replace(/\s/g, '')}</span>
                        <div className="flex-1" />
                        <Monitor className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                        <Volume2 className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                      </div>
                    </div>
                    <div className="px-4 py-3">
                      <button className="w-full py-2 text-xs font-semibold text-forskale-teal border border-forskale-teal rounded-lg hover:forskale-gradient-subtle transition-colors">
                        Show video
                      </button>
                    </div>
                    <div className="px-4 pb-3 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search transcript"
                          value={transcriptSearch}
                          onChange={(e) => setTranscriptSearch(e.target.value)}
                          className="w-full pl-8 h-8 text-xs bg-secondary border border-border rounded-md px-3 py-1 focus:border-forskale-teal focus:ring-1 focus:ring-forskale-teal/10 outline-none"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto atlas-scrollbar p-4 space-y-5">
                      {transcriptLoading ? (
                        <div className="flex items-center justify-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-forskale-teal" />
                        </div>
                      ) : transcriptError ? (
                        <div className="py-8 text-center">
                          <p className="text-sm text-destructive">{transcriptError}</p>
                          <p className="text-xs text-muted-foreground mt-1">Transcription will be fetched when available.</p>
                        </div>
                      ) : transcriptLines && transcriptLines.length > 0 ? (
                        transcriptLines
                          .filter((line) => !transcriptSearch.trim() || line.speaker.toLowerCase().includes(transcriptSearch.trim().toLowerCase()) || line.text.toLowerCase().includes(transcriptSearch.trim().toLowerCase()))
                          .map((line, i) => (
                            <div key={i} className="flex gap-3">
                              <div className="mt-1.5 shrink-0">
                                <div className={`w-2 h-2 rounded-full ${line.color === 'blue' ? 'bg-forskale-green' : 'bg-forskale-cyan'}`} />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-baseline gap-2">
                                  <span className="text-xs font-semibold text-foreground">{line.speaker}{line.role && <span className="font-normal text-muted-foreground"> ({line.role})</span>}</span>
                                  <span className="text-[10px] text-muted-foreground font-mono">{line.time}</span>
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{line.text}</p>
                              </div>
                            </div>
                          ))
                      ) : (
                        <div className="py-8 text-center text-sm text-muted-foreground">
                          No transcript yet. Transcription is loaded when you open this call.
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}
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
    const insightsDaysOptions: { value: 7 | 14 | 30; label: string }[] = [
      { value: 7, label: 'Last 7 days' },
      { value: 14, label: 'Last 14 days' },
      { value: 30, label: 'Last 30 days' },
    ]
    const insightsDaysLabel = insightsDaysOptions.find((o) => o.value === insightsDays)?.label ?? 'Last 7 days'

    const calcPctChange = (curr: number | null | undefined, prev: number | null | undefined): { value: number } | null => {
      if (curr == null) return null
      const c = curr
      const p = prev ?? 0
      if (p === 0 && c === 0) return { value: 0 }
      if (p === 0) return { value: 100 }
      return { value: Math.round(((c - p) / p) * 100) }
    }

    const prevPlaybookDays = playbookScoresPrev.days
    const prevNDays = prevPlaybookDays.length
    const prevOverallAvgPct =
      prevNDays === 0
        ? null
        : Math.round(
            prevPlaybookDays.reduce((sum, d) => sum + (d.score_pct != null ? d.score_pct : 0), 0) / prevNDays
          )
    const prevDimensionAvgPct: Record<string, number> = {}
    playbookDimensionKeys.forEach((dim) => {
      prevDimensionAvgPct[dim] =
        prevNDays === 0
          ? 0
          : Math.round(
              prevPlaybookDays.reduce((sum, d) => sum + (d.dimension_scores?.[dim] ?? 0), 0) / prevNDays
            )
    })
    const prevSpeakingAvg = speakingScoresPrev.averages || {}

    return (
      <div className="flex-1 h-full overflow-y-auto bg-background text-foreground">
        <div className="absolute inset-0 bg-forskale-blue/[0.02] pointer-events-none" />
        
        <div className="relative z-10 p-8 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Performance across calls
              </h1>
              <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
                {insightsSubtitle[insightsActiveTab]}
              </p>
            </div>
            <div className="relative" ref={insightsDropdownRef}>
              <button
                type="button"
                onClick={() => setInsightsDropdownOpen((v) => !v)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/30 bg-secondary/30 text-sm text-muted-foreground hover:bg-secondary/50 hover:border-primary hover:text-foreground transition-all backdrop-blur-sm"
              >
                <Calendar className="h-4 w-4 text-primary" />
                {insightsDaysLabel}
                <ChevronDown className={cn("h-4 w-4 text-muted-foreground/60 transition-transform", insightsDropdownOpen && "rotate-180")} />
              </button>
              {insightsDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 w-44 rounded-xl border border-border/30 bg-background shadow-xl overflow-hidden">
                  {insightsDaysOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => {
                        setInsightsDays(opt.value)
                        setInsightsDropdownOpen(false)
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors",
                        opt.value === insightsDays
                          ? "text-primary font-semibold bg-primary/8"
                          : "text-foreground hover:bg-secondary/50"
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <nav className="flex gap-8 border-b border-border/30 mb-8">
            {insightsTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setInsightsActiveTab(tab.id)}
                className={cn(
                  "pb-3 text-sm font-medium transition-all relative",
                  insightsActiveTab === tab.id ? "text-foreground" : "text-muted-foreground/60 hover:text-muted-foreground"
                )}
              >
                {tab.label}
                {insightsActiveTab === tab.id && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-forskale-green to-forskale-teal shadow-[0_0_8px_hsl(var(--forskale-teal))]" />
                )}
              </button>
            ))}
          </nav>

          {insightsActiveTab === 'objection' ? (
            (() => {
              const getAlignColor = (score: number) => {
                if (score >= 80) return { bg: 'bg-forskale-green', text: 'text-forskale-green', label: 'Excellent alignment', bgLight: 'bg-forskale-green/10', border: 'border-forskale-green/30' }
                if (score >= 50) return { bg: 'bg-forskale-blue', text: 'text-forskale-blue', label: 'Good alignment', bgLight: 'bg-forskale-blue/10', border: 'border-forskale-blue/30' }
                if (score >= 30) return { bg: 'bg-orange-500', text: 'text-orange-500', label: 'Partial alignment', bgLight: 'bg-orange-500/10', border: 'border-orange-500/30' }
                return { bg: 'bg-destructive', text: 'text-destructive', label: 'Learning opportunity', bgLight: 'bg-destructive/10', border: 'border-destructive/30' }
              }

              const CoachingDetailsInline = ({ keyPoints, learning }: { keyPoints: string[]; learning: string[] }) => {
                const [open, setOpen] = useState(false)
                if (!keyPoints.length && !learning.length) return null
                return (
                  <div className="rounded-lg border border-border/10 bg-secondary/10 overflow-hidden">
                    <button
                      onClick={() => setOpen(!open)}
                      className="w-full flex items-center justify-between px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-secondary/20 transition-all duration-200"
                    >
                      <span className="flex items-center gap-1.5">
                        <Lightbulb className="h-3 w-3 text-primary" />
                        View Coaching Details
                      </span>
                      <ChevronDown className={cn("h-3.5 w-3.5 transition-transform duration-300", open && "rotate-180")} />
                    </button>
                    <div className={cn("overflow-hidden transition-all duration-300 ease-out", open ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0")}>
                      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {keyPoints.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-forskale-green mb-1.5 flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> What you covered well
                            </p>
                            <ul className="space-y-1">
                              {keyPoints.map((pt, pi) => (
                                <li key={pi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <span className="text-forskale-green mt-0.5 shrink-0">✓</span>{pt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {learning.length > 0 && (
                          <div>
                            <p className="text-[11px] font-semibold text-forskale-blue mb-1.5 flex items-center gap-1">
                              <Lightbulb className="h-3 w-3" /> Learning opportunities
                            </p>
                            <ul className="space-y-1">
                              {learning.map((pt, pi) => (
                                <li key={pi} className="text-xs text-muted-foreground flex items-start gap-1.5">
                                  <span className="text-forskale-blue mt-0.5 shrink-0">•</span>{pt}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              }

              const topics = objectionInsights?.topics ?? []
              const isLoading = objectionInsightsLoading || objectionAnalyzing

              return (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Playbook alignment by topic — expand to compare your answers
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setObjectionAnalyzing(true)
                        setObjectionInsightsError(null)
                        meetingsAPI
                          .analyzeObjectionInsights({ days: insightsDays })
                          .then((res) => { setObjectionInsights(res.data) })
                          .catch((err) => { setObjectionInsightsError(err.response?.data?.detail || err.message || 'Failed to analyze objections') })
                          .finally(() => setObjectionAnalyzing(false))
                      }}
                      disabled={isLoading}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border/30 bg-background text-sm text-muted-foreground hover:bg-secondary/50 transition-all disabled:opacity-60"
                    >
                      {objectionAnalyzing
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                        : <span className="text-primary">✦</span>
                      }
                      Analyze last {insightsDays} days
                    </button>
                  </div>

                  {objectionInsightsError && (
                    <p className="text-sm text-destructive mb-4">{objectionInsightsError}</p>
                  )}

                  {isLoading && !objectionInsights && (
                    <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      {objectionAnalyzing ? 'Analyzing calls with AI…' : 'Loading objection insights…'}
                    </div>
                  )}

                  {!isLoading && !objectionInsights && (
                    <div className="flex flex-col items-center justify-center h-48 text-sm text-muted-foreground gap-3">
                      <MessageSquare className="h-8 w-8 text-border" />
                      <p>No analysis yet. Click &ldquo;Analyze last {insightsDays} days&rdquo; to get started.</p>
                    </div>
                  )}

                  {topics.length === 0 && objectionInsights && !isLoading && (
                    <div className="flex items-center justify-center h-40 text-sm text-muted-foreground">
                      No objections found in the last {insightsDays} days. Try analyzing a longer period.
                    </div>
                  )}

                  {topics.length > 0 && (
                    <div className="flex flex-col gap-3">
                      {topics.map((item) => {
                        const isExpanded = !!expandedObjectionTopics[item.topic]
                        const scoredQs = item.questions.filter((q) => q.match_score != null)
                        const avgScore = scoredQs.length
                          ? Math.round(scoredQs.reduce((s, q) => s + (q.match_score ?? 0), 0) / scoredQs.length)
                          : 0
                        const avgColors = getAlignColor(avgScore)
                        return (
                          <div key={item.topic} className="rounded-xl border border-border/20 overflow-hidden transition-all duration-300">
                            <div
                              onClick={() => setExpandedObjectionTopics((prev) => ({ ...prev, [item.topic]: !prev[item.topic] }))}
                              className="flex items-center justify-between px-5 py-4 bg-secondary/30 hover:bg-secondary/50 transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-4 flex-1 min-w-0">
                                <span className="text-sm font-bold text-forskale-green shrink-0">{Math.round(item.pct_calls)}%</span>
                                <span className="text-sm font-medium text-foreground">{item.topic}</span>
                                {scoredQs.length > 0 && (
                                  <div className="flex items-center gap-2 ml-auto mr-4 w-32">
                                    <div className="flex-1 h-1.5 rounded-full overflow-hidden bg-border/20">
                                      <div className={cn("h-full rounded-full transition-all duration-700", avgColors.bg)} style={{ width: `${avgScore}%` }} />
                                    </div>
                                    <span className={cn("text-[11px] font-bold tabular-nums", avgColors.text)}>{avgScore}%</span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground shrink-0">
                                <span>{item.calls_count} calls · {item.questions_count} questions</span>
                                <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isExpanded && "rotate-180")} />
                              </div>
                            </div>

                            <div className={cn("overflow-hidden transition-all duration-300", isExpanded ? "max-h-[5000px] opacity-100" : "max-h-0 opacity-0")}>
                              <div className="border-t border-border/20 bg-background divide-y divide-border/10">
                                {item.questions.map((q, i) => {
                                  const scoreColors = q.match_score != null ? getAlignColor(q.match_score) : null
                                  const displayAnswer = q.user_actual_answer
                                  const hasSuggested = !!(q.suggested_answer || q.answer)
                                  const hasCoaching = !!(q.key_points_covered?.length || q.learning_opportunities?.length)
                                  return (
                                    <div key={`${q.meeting_id}-${i}`} className="px-6 py-5 space-y-3">
                                      {/* Source line */}
                                      <p className="text-xs text-muted-foreground">
                                        <span className="font-medium text-primary">{q.meeting_title || 'Call'}</span>
                                        {q.time && <> at <span className="font-semibold text-primary">{q.time}</span></>}
                                      </p>

                                      {/* Question */}
                                      <div className="flex items-start gap-2">
                                        <MessageSquare className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <p className="text-sm font-semibold text-foreground leading-snug">{q.question}</p>
                                      </div>

                                      {/* YOUR ANSWER */}
                                      {displayAnswer && (
                                        <div className="rounded-lg border border-border/30 bg-secondary/20 px-4 py-3">
                                          <div className="flex items-center gap-1.5 mb-1.5">
                                            <_User className="h-3 w-3 text-muted-foreground shrink-0" />
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Your Answer</span>
                                          </div>
                                          <p className="text-sm text-foreground/90 leading-relaxed italic">&ldquo;{displayAnswer}&rdquo;</p>
                                        </div>
                                      )}

                                      {/* PLAYBOOK ALIGNMENT bar */}
                                      {scoreColors && q.match_score != null && (
                                        <div className={cn("rounded-lg border px-4 py-3", scoreColors.bgLight, scoreColors.border)}>
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Playbook Alignment</span>
                                            <span className={cn("text-[10px] font-semibold px-2 py-0.5 rounded-full border", scoreColors.bgLight, scoreColors.text, scoreColors.border)}>
                                              {scoreColors.label}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-3">
                                            <div className="flex-1 h-2 rounded-full overflow-hidden bg-border/30">
                                              <div
                                                className={cn("h-full rounded-full transition-all duration-700 ease-out", scoreColors.bg)}
                                                style={{ width: `${q.match_score}%` }}
                                              />
                                            </div>
                                            <span className={cn("text-sm font-bold tabular-nums w-10 text-right shrink-0", scoreColors.text)}>
                                              {q.match_score}%
                                            </span>
                                          </div>
                                        </div>
                                      )}

                                      {/* SUGGESTED ANSWER */}
                                      {hasSuggested && (
                                        <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                                          <div className="flex items-center gap-1.5 mb-1.5">
                                            <Bot className="h-3 w-3 text-primary shrink-0" />
                                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Suggested Answer</span>
                                          </div>
                                          <p className="text-sm text-foreground/90 leading-relaxed">{q.suggested_answer || q.answer}</p>
                                        </div>
                                      )}

                                      {/* VIEW COACHING DETAILS */}
                                      {hasCoaching && (
                                        <CoachingDetailsInline
                                          keyPoints={q.key_points_covered ?? []}
                                          learning={q.learning_opportunities ?? []}
                                        />
                                      )}
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })()
          ) : (
            <div className="flex gap-6">
              {/* Metric Cards - Vertical on left */}
              <div className="flex flex-col gap-2 w-36 shrink-0">
                {displayMetrics.map((m) => {
                  const metricKey = (m as any).metricKey as
                    | SpeakingMetricKey
                    | PlaybookMetricKey
                    | undefined
                  const isSpeakingMetric = insightsActiveTab === 'speaking' && !!metricKey && (['speech_pace_wpm','talk_ratio_pct','longest_customer_monologue_sec','questions_asked_avg','filler_words_avg'] as SpeakingMetricKey[]).includes(metricKey as SpeakingMetricKey)
                  const isPlaybookMetric = insightsActiveTab === 'playbook' && !!metricKey && (['overall','Handled objections','Personalized demo','Intro Banter','Set Agenda','Demo told a story'] as PlaybookMetricKey[]).includes(metricKey as PlaybookMetricKey)
                  const isActive = m.blueUnderline

                  let pctChange: { value: number } | null = null
                  if (isPlaybookMetric && metricKey) {
                    const currVal = metricKey === 'overall' ? overallAvgPct : dimensionAvgPct[metricKey] ?? 0
                    const prevVal = metricKey === 'overall' ? prevOverallAvgPct : prevDimensionAvgPct[metricKey] ?? 0
                    pctChange = calcPctChange(currVal, prevVal)
                  } else if (isSpeakingMetric && metricKey) {
                    const sk = metricKey as SpeakingMetricKey
                    const currVal = avg[sk] ?? null
                    const prevVal = prevSpeakingAvg[sk] ?? null
                    pctChange = calcPctChange(currVal, prevVal)
                  }

                  return (
                    <div
                      key={m.name}
                      onClick={() => {
                        if (isSpeakingMetric && metricKey) {
                          setSpeakingMetricKey(metricKey as SpeakingMetricKey)
                        } else if (isPlaybookMetric && metricKey) {
                          setPlaybookMetricKey(metricKey as PlaybookMetricKey)
                        }
                      }}
                      className={cn(
                        "flex flex-col rounded-xl border bg-secondary/30 backdrop-blur-sm px-4 py-3 transition-all duration-300 cursor-pointer group relative overflow-hidden",
                        isActive ? "border-primary shadow-[0_0_20px_hsl(var(--forskale-teal)/0.2)]" : "border-border/30 hover:border-border/60",
                        "hover:bg-secondary/50 hover:shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
                      )}
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-forskale-green/5 to-forskale-blue/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <div className="flex items-center justify-center gap-1.5 mb-1.5 relative z-10">
                        <span className="text-[11px] font-semibold text-muted-foreground text-center truncate">{m.name}</span>
                        <Info className="h-2.5 w-2.5 text-muted-foreground/60 hover:text-primary transition-colors shrink-0" />
                      </div>
                      <div className="relative z-10 text-center mb-1">
                        <p className={cn(
                          "text-sm font-bold tabular-nums transition-all duration-300",
                          isActive
                            ? "text-transparent bg-clip-text bg-gradient-to-r from-forskale-green to-forskale-teal"
                            : "text-muted-foreground group-hover:text-foreground"
                        )}>
                          {(insightsActiveTab === 'playbook' && playbookInsightsLoading) || (insightsActiveTab === 'speaking' && speakingInsightsLoading) ? '—' : m.value}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5">{m.unit}</p>
                      </div>
                      {pctChange !== null && !(playbookInsightsLoading || speakingInsightsLoading) && (
                        <div className={cn(
                          "relative z-10 flex items-center justify-center gap-0.5 mt-1 text-[10px] font-medium",
                          pctChange.value > 0 ? "text-forskale-green" : pctChange.value < 0 ? "text-destructive" : "text-muted-foreground"
                        )}>
                          {pctChange.value > 0 && <ArrowUp className="h-2.5 w-2.5" />}
                          {pctChange.value < 0 && <ArrowDown className="h-2.5 w-2.5" />}
                          {pctChange.value === 0 && <ArrowRight className="h-2.5 w-2.5" />}
                          {Math.abs(pctChange.value)}%
                        </div>
                      )}
                      <div className="mt-auto h-0.5 w-full bg-border/30 rounded-full overflow-hidden relative z-10">
                        <div className={cn(
                          "h-full transition-all duration-500 rounded-full",
                          isActive
                            ? "w-full bg-gradient-to-r from-forskale-green to-forskale-teal"
                            : "w-0 group-hover:w-1/4 bg-muted-foreground/30"
                        )} />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Chart on right */}
              <div className="flex-1 rounded-3xl border border-border/30 bg-secondary/20 backdrop-blur-xl shadow-2xl overflow-hidden">
                <div className="px-6 pt-5 pb-2 flex items-center gap-3">
                  <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-sm bg-gradient-to-r from-forskale-green to-forskale-teal text-primary-foreground">
                    <Check className="h-2.5 w-2.5 stroke-[3]" />
                  </span>
                  <h3 className="text-sm font-semibold text-foreground transition-all duration-300">
                    {insightsActiveTab === 'playbook'
                      ? `${playbookMetricKey === 'overall' ? 'Overall' : playbookMetricKey} across calls (last ${insightsDays} days)`
                      : `${speakingMetricKey === 'speech_pace_wpm' ? 'Speech pace' : speakingMetricKey === 'talk_ratio_pct' ? 'Talk ratio' : speakingMetricKey === 'longest_customer_monologue_sec' ? 'Longest customer monologue' : speakingMetricKey === 'questions_asked_avg' ? 'Questions asked' : 'Filler words'} across calls (last ${insightsDays} days)`
                    }
                  </h3>
                </div>
                
                <div className="px-6 pb-6">
                  {/* Loading states */}
                  {insightsActiveTab === 'playbook' && playbookInsightsLoading && (
                    <div className="h-[400px] w-full flex items-center justify-center">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading playbook scores…
                      </span>
                    </div>
                  )}
                  {insightsActiveTab === 'playbook' && !playbookInsightsLoading && playbookInsightsError && (
                    <div className="h-[400px] w-full flex items-center justify-center text-sm text-destructive">
                      {playbookInsightsError}
                    </div>
                  )}
                  {insightsActiveTab === 'speaking' && speakingInsightsLoading && (
                    <div className="h-[400px] w-full flex items-center justify-center">
                      <span className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Loading speaking scores…
                      </span>
                    </div>
                  )}
                  {insightsActiveTab === 'speaking' && !speakingInsightsLoading && speakingInsightsError && (
                    <div className="h-[400px] w-full flex items-center justify-center text-sm text-destructive">
                      {speakingInsightsError}
                    </div>
                  )}

                  {/* Speaking - No data empty state */}
                  {insightsActiveTab === 'speaking' && !speakingInsightsLoading && !speakingInsightsError && !speakingHasData && (
                    <div className="h-[400px] w-full flex items-center justify-center">
                      <div className="flex flex-col items-center gap-3 text-center max-w-xs">
                        <TrendingUp className="h-10 w-10 text-primary" />
                        <p className="text-base font-semibold text-foreground">No speaking metrics yet</p>
                        <p className="text-sm text-muted-foreground">
                          Analyze feedback in Calls to see Speech pace, Talk ratio, and more here.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Playbook chart with recharts */}
                  {insightsActiveTab === 'playbook' && !playbookInsightsLoading && !playbookInsightsError && (
                    <>
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={playbookChartData.map(d => ({ name: d.label, value: d.y }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="chartFillPlaybook" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(174, 56%, 55%)" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="hsl(174, 56%, 55%)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 3" stroke="hsl(224, 30%, 20%)" vertical={false} />
                            <XAxis dataKey="name" stroke="hsl(215, 20%, 65%)" fontSize={11} axisLine={false} tickLine={false} />
                            <YAxis stroke="hsl(215, 20%, 65%)" fontSize={11} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} domain={[0, 100]} />
                            <RechartsTooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null
                                return (
                                  <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl text-xs">
                                    <p className="font-medium text-foreground mb-1">{label}</p>
                                    <p className="text-primary font-bold tabular-nums">{payload[0].value}%</p>
                                  </div>
                                )
                              }}
                              cursor={{ stroke: 'hsl(174, 56%, 55%)', strokeWidth: 1, strokeDasharray: '4 3' }}
                            />
                            <Area
                              type="monotone" dataKey="value"
                              stroke="hsl(174, 56%, 55%)" strokeWidth={2}
                              fill="url(#chartFillPlaybook)" strokeLinecap="round"
                              animationDuration={600}
                              dot={{ r: 3, fill: 'hsl(174, 56%, 55%)', stroke: 'hsl(224, 100%, 10%)', strokeWidth: 2 }}
                              activeDot={{ r: 5, fill: 'hsl(174, 56%, 55%)', stroke: 'hsl(224, 100%, 10%)', strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button className="p-2 rounded-lg bg-secondary/30 border border-border/30 text-muted-foreground hover:text-primary hover:border-primary transition-all">
                          <Filter className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-secondary/30 border border-border/30 text-muted-foreground hover:text-primary hover:border-primary transition-all">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-gradient-to-r from-forskale-green to-forskale-teal text-primary-foreground hover:opacity-90 transition-all">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}

                  {/* Speaking chart with recharts */}
                  {insightsActiveTab === 'speaking' && !speakingInsightsLoading && !speakingInsightsError && speakingHasData && (
                    <>
                      <div className="h-[400px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={speakingChartData.map(d => ({ name: d.label, value: d.y }))} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="chartFillSpeaking" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(174, 56%, 55%)" stopOpacity={0.2} />
                                <stop offset="100%" stopColor="hsl(174, 56%, 55%)" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="4 3" stroke="hsl(224, 30%, 20%)" vertical={false} />
                            <XAxis dataKey="name" stroke="hsl(215, 20%, 65%)" fontSize={11} axisLine={false} tickLine={false} />
                            <YAxis stroke="hsl(215, 20%, 65%)" fontSize={11} axisLine={false} tickLine={false} domain={[0, currentSpeakingConfig.maxY]} ticks={currentSpeakingConfig.ticks} />
                            <RechartsTooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null
                                const unit = speakingMetricKey === 'talk_ratio_pct' ? '%' : speakingMetricKey === 'speech_pace_wpm' ? ' wpm' : speakingMetricKey === 'longest_customer_monologue_sec' ? ' sec' : ''
                                return (
                                  <div className="rounded-lg border border-border/50 bg-background px-3 py-2 shadow-xl text-xs">
                                    <p className="font-medium text-foreground mb-1">{label}</p>
                                    <p className="text-primary font-bold tabular-nums">{payload[0].value}{unit}</p>
                                  </div>
                                )
                              }}
                              cursor={{ stroke: 'hsl(174, 56%, 55%)', strokeWidth: 1, strokeDasharray: '4 3' }}
                            />
                            <Area
                              type="monotone" dataKey="value"
                              stroke="hsl(174, 56%, 55%)" strokeWidth={2}
                              fill="url(#chartFillSpeaking)" strokeLinecap="round"
                              animationDuration={600}
                              dot={{ r: 3, fill: 'hsl(174, 56%, 55%)', stroke: 'hsl(224, 100%, 10%)', strokeWidth: 2 }}
                              activeDot={{ r: 5, fill: 'hsl(174, 56%, 55%)', stroke: 'hsl(224, 100%, 10%)', strokeWidth: 2 }}
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <button className="p-2 rounded-lg bg-secondary/30 border border-border/30 text-muted-foreground hover:text-primary hover:border-primary transition-all">
                          <Filter className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-secondary/30 border border-border/30 text-muted-foreground hover:text-primary hover:border-primary transition-all">
                          <Download className="h-4 w-4" />
                        </button>
                        <button className="p-2 rounded-lg bg-gradient-to-r from-forskale-green to-forskale-teal text-primary-foreground hover:opacity-90 transition-all">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (section === 'todo') {
    return (
      <div className="h-full overflow-y-auto bg-white">
        <div className="px-8 pt-6 pb-5">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-gray-900">To Do Ready</h1>
              <p className="mt-1 text-sm text-gray-500">
                AI-generated action items from your calls and deals.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
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
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-forskale-green via-forskale-teal to-forskale-blue px-4 py-2 text-sm font-semibold text-white shadow-[0_4px_12px_hsl(var(--forskale-green)/0.3)] transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_20px_hsl(var(--forskale-green)/0.5)] active:translate-y-0 disabled:opacity-60"
              >
                {todoAnalyzing ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  <Sparkles className="h-4 w-4 text-white" />
                )}
                Analyze
              </button>
            </div>
          </div>

          {/* Tabs + Filter inline */}
          <div className="flex items-center justify-between border-b border-gray-200 mb-4">
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
            {/* Filter dropdown */}
            <div className="flex items-center gap-2 pb-3">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Filter:</span>
              <button
                type="button"
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <span className="text-gray-600">Prospect</span>
                <ChevronDown className="h-4 w-4 text-gray-500 shrink-0 ml-2" />
              </button>
            </div>
          </div>

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
                    {displayItems.map((item, idx) => (
                      <div
                        key={`${item.meeting_id}-${item.description.slice(0, 40)}-${item.time ?? ''}-${idx}`}
                        className={`flex items-start gap-3 rounded-xl px-4 py-3 shadow-sm border transition-all ${
                          item.status === 'done' 
                            ? 'bg-gray-50 border-gray-100 opacity-60' 
                            : todoActiveTab === 'overdue' 
                              ? 'bg-white border-red-100' 
                              : 'bg-white border-gray-100'
                        }`}
                      >
                        <div className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                          item.status === 'done'
                            ? 'bg-green-500'
                            : todoActiveTab === 'overdue' 
                              ? 'bg-red-500' 
                              : 'bg-[#3B82F6]'
                        }`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium ${item.status === 'done' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {item.description}
                          </p>
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
                          onClick={async () => {
                            const newStatus = item.status === 'done' ? 'open' : 'done'
                            try {
                              await meetingsAPI.updateTodoItemStatus({
                                meeting_id: item.meeting_id,
                                description: item.description,
                                time: item.time,
                                status: newStatus,
                              }, { range_type: todoRange === 'today' ? 'day' : 'week' })
                              // Update local state
                              setTodoInsights((prev) => {
                                if (!prev) return prev
                                return {
                                  ...prev,
                                  items: prev.items.map((it) =>
                                    it.meeting_id === item.meeting_id &&
                                    it.description === item.description &&
                                    it.time === item.time
                                      ? { ...it, status: newStatus }
                                      : it
                                  ),
                                }
                              })
                              toast.success(newStatus === 'done' ? 'Marked as done!' : 'Marked as open')
                            } catch (err) {
                              toast.error('Failed to update status')
                            }
                          }}
                          className={`mt-1 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                            item.status === 'done'
                              ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'
                              : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {item.status === 'done' ? (
                            <>
                              <CheckCircle2 className="h-3 w-3" />
                              Done
                            </>
                          ) : (
                            'Mark done'
                          )}
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
      <div className="h-full overflow-y-auto px-8 py-6 bg-[#f5f5f7]">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-gray-900">
              Rolling Q&amp;A Repository
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Centralized database of prospect questions with AI-generated answers.
            </p>
          </div>
          <button
            type="button"
            onClick={() => { setQnaEditingId(null); setQnaFormQuestion(''); setQnaFormAnswer(''); setQnaModalOpen(true) }}
            className="inline-flex items-center gap-2 rounded-lg bg-[#007AFF] px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" />
            Add Question
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
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-800 shadow-sm placeholder:text-gray-400 focus:border-[#007AFF] focus:outline-none focus:ring-1 focus:ring-[#007AFF]"
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
                      <span className={`ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${row.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {row.status === 'approved' ? <Check className="mr-1 h-3 w-3 inline" /> : <AlertTriangle className="mr-1 h-3 w-3 inline" />}
                        {row.status === 'approved' ? 'Approved' : row.status}
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
                        await atlasAPI.createQna({ question: q, answer: a, classification: 'general' })
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
    const selectedCategoryName = knowledgeCategories.find((c) => c.id === knowledgeCategory)?.label ?? knowledgeCategory
    return (
      <div className="flex-1 h-screen overflow-y-auto bg-white">
        {/* Sticky Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-8 py-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Knowledge Configuration
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Train Atlas AI with YOUR company information to provide intelligent assistance during calls.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setKnowledgeUploadModal(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              >
                <Upload className="h-4 w-4" />
                Upload Document
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm transition-colors"
              >
                <RefreshCw className="h-4 w-4" />
                Sync CRM
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <div className="p-8 space-y-10">
          {/* Knowledge Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Your Company Knowledge</h2>
            <div className="flex gap-5">
              {/* Category Sidebar */}
              <div className="w-[220px] shrink-0">
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <nav className="p-2">
                    {knowledgeCategories.map((cat) => {
                      const isActive = knowledgeCategory === cat.id
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setKnowledgeCategory(cat.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-blue-50 text-forskale-teal border-l-2 border-forskale-teal'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {cat.label}
                        </button>
                      )
                    })}
                  </nav>
                </div>
              </div>

              {/* Documents Table */}
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Search bar */}
                  <div className="px-5 py-3 border-b border-gray-200">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search Documents"
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-forskale-teal/40 focus:border-forskale-teal"
                      />
                    </div>
                  </div>

                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_160px_120px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div>Document Name</div>
                    <div>Status</div>
                    <div className="text-right">Actions</div>
                  </div>

                  {/* Table Body */}
                  {knowledgeDocumentsLoading === knowledgeCategory ? (
                    <div className="px-5 py-12 text-center">
                      <Loader2 className="h-10 w-10 text-gray-300 animate-spin mx-auto mb-3" />
                      <p className="text-sm text-gray-500">Loading documents...</p>
                    </div>
                  ) : currentKnowledgeDocuments.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-500">No documents in this category yet.</p>
                      <button
                        type="button"
                        onClick={() => setKnowledgeUploadModal(true)}
                        className="mt-3 inline-flex items-center gap-2 text-sm text-forskale-teal hover:underline"
                      >
                        <Upload className="h-4 w-4" />
                        Upload Document
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {currentKnowledgeDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="grid grid-cols-[1fr_160px_120px] gap-4 items-center px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
                        >
                          {/* Document Name */}
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="h-5 w-5 text-gray-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="text-sm text-gray-900 truncate block">{doc.name}</span>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {new Date(doc.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                {doc.total_chunks != null && doc.total_chunks > 0 && ` · ${doc.total_chunks} chunks`}
                                {doc.size ? ` · ${doc.size < 1024 ? doc.size + ' B' : doc.size < 1024 * 1024 ? (doc.size / 1024).toFixed(1) + ' KB' : (doc.size / (1024 * 1024)).toFixed(2) + ' MB'}` : ''}
                              </p>
                            </div>
                          </div>
                          {/* Status */}
                          <div>
                            {doc.status === 'processed' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Processed
                              </span>
                            )}
                            {doc.status === 'processing' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Processing
                              </span>
                            )}
                            {doc.status === 'failed' && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-red-600" title={doc.error_message || ''}>
                                <AlertCircle className="h-3.5 w-3.5" />
                                Failed
                              </span>
                            )}
                          </div>
                          {/* Actions */}
                          <div className="flex items-center justify-end gap-2">
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
                              className="px-3 py-1.5 text-sm font-medium text-forskale-teal border border-forskale-teal rounded-lg hover:bg-blue-50 transition-colors"
                            >
                              Download
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
                              className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  {currentKnowledgeDocuments.length} {selectedCategoryName} document{currentKnowledgeDocuments.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
          </div>

          {/* Client Company Knowledge Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Client Company Knowledge</h2>
            <div className="flex gap-5">
              {/* Category Sidebar */}
              <div className="w-[220px] shrink-0">
                <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
                  <nav className="p-2">
                    {[
                      { id: 'client-product-info', name: 'Client Product Info' },
                      { id: 'client-pricing-plans', name: 'Client Pricing & Plans' },
                      { id: 'client-objection-handling', name: 'Client Objection Handling' },
                      { id: 'client-competitive-intel', name: 'Client Competitive Intel' },
                      { id: 'client-company-policies', name: 'Client Company Policies' },
                    ].map((cat, idx) => (
                      <button
                        key={cat.id}
                        type="button"
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          idx === 0
                            ? 'bg-blue-50 text-forskale-teal border-l-2 border-forskale-teal'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Documents Table */}
              <div className="flex-1 min-w-0">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {/* Search bar */}
                  <div className="px-5 py-3 border-b border-gray-200">
                    <div className="relative max-w-sm">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search Documents"
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-forskale-teal/40 focus:border-forskale-teal"
                      />
                    </div>
                  </div>

                  {/* Table Header */}
                  <div className="grid grid-cols-[1fr_160px_120px] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    <div>Document Name</div>
                    <div>Sample</div>
                    <div className="text-right">Actions</div>
                  </div>

                  {/* Empty state */}
                  <div className="px-5 py-12 text-center">
                    <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm text-gray-500">No documents in this category yet.</p>
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  0 Client Product Info documents
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Upload Modal */}
        {knowledgeUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Upload {selectedCategoryName} Document
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
                        className="rounded-xl bg-forskale-teal px-4 py-2 text-sm font-medium text-white hover:opacity-90"
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
                          className="rounded-xl bg-forskale-teal px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
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
                <p className="text-xs text-gray-500 mt-3">PDF or DOCX. Content will be chunked and stored in Atlas {selectedCategoryName} knowledge base.</p>
              </div>
            </div>
          </div>
        )}
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
              {recordMode === 'join' ? (
                <>
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
                </>
              ) : (
                <button
                  onClick={closeRecordModal}
                  className="px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
