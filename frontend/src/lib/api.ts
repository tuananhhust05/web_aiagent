import axios from 'axios'
import { deleteCookie } from './cookies'

// const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://forskale.com'
// const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://forskale.com:8000'
// const API_URL = 'https://forskale.com:8000'

// Ensure API URL uses HTTPS when in production
const getApiUrl = () => {
  const url = (import.meta as any).env?.VITE_API_URL || 'https://app.forskale.com'
  // const url = 'http://localhost:8001'
  // If we're on HTTPS and the API URL is HTTP, convert to HTTPS
  // if (window.location.protocol === 'https:' && url.startsWith('http://')) {
  //   return url.replace('http://', 'https://')
  // }
  
  // Force return HTTP (no HTTPS conversion)
  console.log('🔧 [getApiUrl] Raw URL:', url)
  console.log('🔧 [getApiUrl] Window protocol:', window.location.protocol)
  console.log('🔧 [getApiUrl] Returning URL:', url)
  
  return url
}

const FINAL_API_URL = getApiUrl()
/** Base URL of the backend API (e.g. http://localhost:8000). Use for API requests. */
export const API_BASE_URL = FINAL_API_URL

/**
 * Backend base URL for OAuth callback redirect (Google Calendar).
 * In production, if frontend and backend share the same origin, set VITE_BACKEND_OAUTH_URL
 * to the actual backend URL (e.g. https://api.forskale.com) to avoid infinite redirect loop.
 */
export const BACKEND_OAUTH_BASE_URL =
  ((import.meta as any).env?.VITE_BACKEND_OAUTH_URL as string)?.trim() || FINAL_API_URL

// Debug log
console.log('🔧 API Configuration:', {
  originalUrl: (import.meta as any).env?.VITE_API_URL || 'https://forskale.com',
  finalUrl: FINAL_API_URL,
  protocol: window.location.protocol,
  baseURL: FINAL_API_URL
})

// Verify axios baseURL
console.log('🔧 Axios baseURL will be:', FINAL_API_URL)

export const api = axios.create({
  baseURL: FINAL_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 180000, // 180 seconds (3 minutes) default timeout
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    // Force HTTP if baseURL is localhost (prevent browser HTTPS upgrade)
    if (config.baseURL && config.baseURL.startsWith('http://localhost')) {
      // Ensure baseURL stays as HTTP
      config.baseURL = config.baseURL.replace('https://', 'http://')
    }
    
    // Debug: Log the actual URL being called
    const fullUrl = config.baseURL ? `${config.baseURL}${config.url}` : config.url
    console.log('🌐 [API Request] Full URL:', fullUrl)
    console.log('🌐 [API Request]  BaseURL:', config.baseURL)
    console.log('🌐 [API Request] URL path:', config.url)
    
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      // Delete is_login cookie when token expires
      deleteCookie('is_login')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: any) => api.post('/auth/register', userData),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/auth/reset-password', { token, new_password: newPassword }),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/auth/change-password', data),
  acceptTerms: () => api.post('/auth/accept-terms'),
  gdprConsent: () => api.post('/auth/gdpr-consent'),
  /** Complete profile: update user + optional company creation (single call for supplement-profile page). */
  supplementProfile: (data: {
    first_name: string
    last_name: string
    phone?: string
    industry?: string
    language: string
    workspace_role: 'owner' | 'member'
    company_id?: string
    company_name?: string
    company_website?: string
    company_phone?: string
    company_address?: string
    company_country?: string
  }) => api.post('/auth/supplement-profile', data),
  // Google OAuth (optional params: source for attribution e.g. linkedin, direct)
  getGoogleAuthUrl: (params?: { source?: string }) =>
    api.get('/auth/google/login', { params }),
  googleCallback: (data: { code: string; state?: string }) => api.post('/auth/google/callback', data),
  getGoogleUserInfo: () => api.get('/auth/google/user-info'),
  getMe: () => api.get('/auth/me'),
}

// User API
export const userAPI = {
  getProfile: () => api.get('/api/users/me'),
  updateProfile: (data: any) => api.put('/api/users/me', data),
  deleteAccount: () => api.delete('/api/users/me'),
}

// Contacts API
export const contactsAPI = {
  getContacts: (params?: any) => api.get('/api/contacts', { params }),
  getContact: (id: string) => api.get(`/api/contacts/${id}`),
  getContactsDetailed: (params?: any) => api.get('/api/contacts/detailed', { params }),
  createContact: (data: any) => api.post('/api/contacts', data),
  updateContact: (id: string, data: any) => api.put(`/api/contacts/${id}`, data),
  deleteContact: (id: string) => api.delete(`/api/contacts/${id}`),
  importCSV: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/contacts/import/csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  bulkUpdate: (data: any) => api.post('/api/contacts/bulk-update', data),
  getStats: () => api.get('/api/contacts/stats/summary'),
}

// CRM API
export const crmAPI = {
  getProviders: () => api.get('/api/crm/providers'),
  getConnections: () => api.get('/api/crm/connections'),
  connect: (provider: string, credentials: any) =>
    api.post(`/api/crm/connect/${provider}`, credentials),
  disconnect: (provider: string) => api.delete(`/api/crm/disconnect/${provider}`),
  sync: (provider: string) => api.post(`/api/crm/sync/${provider}`),
  export: (provider: string, contactIds: string[]) =>
    api.post(`/api/crm/export/${provider}`, { contact_ids: contactIds }),
  // HubSpot specific endpoints
  getHubSpotToken: () => api.get('/api/crm/hubspot/token'),
  saveHubSpotToken: (token: string) => api.post('/api/crm/hubspot/token', { token }),
  syncHubSpotContacts: () => api.post('/api/crm/hubspot/sync-contacts'),
}

// --- To-Do Ready (Atlas) types and API ---
export type ToDoTaskTriggerSource = 'email' | 'call' | 'objection' | 'competitive'
export type ToDoTaskStatus = 'ready' | 'needs_input' | 'overdue' | 'done'

export type Company = {
  id: string
  name: string
}

export type ToDoTask = {
  id: string
  company: Company
  dealStage: string
  triggerSource: ToDoTaskTriggerSource
  priorityScore: number
  preparedDraft: string
  strategyType: string
  /** Optional explanation for the prepared action (PRD Section 8). */
  explanationLine?: string
  status: ToDoTaskStatus
  /** For mapping from meetings API */
  meeting_id?: string
  meeting_title?: string | null
  assignee?: string
  description: string
  time?: string | null
  due_at?: string | null
  /** Optional; when set, ReplyLab can lazy-load thread (PRD Section 16). */
  thread_id?: string
  /** Deal intelligence fields (PRD Section 8A) */
  lastCallSentiment?: string
  lastObjection?: string
  competitorMentioned?: string
  viewCallLink?: string
  viewInsightsLink?: string
  viewCompetitiveLink?: string
}

export type CommunicationMessage = {
  id: string
  role: 'prospect' | 'sales'
  content: string
  date: string
}

export type CommunicationThreadResponse = {
  thread_id: string
  messages: CommunicationMessage[]
}

export type LegacyTodoListResponse = {
  items: ToDoTask[]
  total_items: number
  range_type?: 'day' | 'week'
  analyzed_from?: string
  analyzed_to?: string
}

export const todoAPI = {
  /** List todo tasks (uses meetings insights API and maps to ToDoTask[] until /api/todo exists). */
  getList: async (params: { range_type?: 'day' | 'week' }): Promise<LegacyTodoListResponse> => {
    const res = await meetingsAPI.getTodoInsights({ range_type: params.range_type ?? 'week' })
    const data = res.data
    const now = new Date()
    const items: ToDoTask[] = (data.items || []).map((it, idx) => {
      const dueAt = it.due_at ? new Date(it.due_at) : null
      const isOverdue = dueAt && dueAt < now && it.status !== 'done'
      const status: ToDoTaskStatus =
        it.status === 'done'
          ? 'done'
          : isOverdue
            ? 'overdue'
            : 'ready'
      return {
        id: `${it.meeting_id}-${idx}-${(it.description || '').slice(0, 30)}`,
        company: { id: it.meeting_id, name: it.meeting_title || 'Call' },
        dealStage: '—',
        triggerSource: 'call',
        priorityScore: 0,
        preparedDraft: '',
        strategyType: 'Follow-up',
        explanationLine: undefined,
        status,
        meeting_id: it.meeting_id,
        meeting_title: it.meeting_title,
        assignee: it.assignee,
        description: it.description,
        time: it.time,
        due_at: it.due_at,
      }
    })
    return {
      items,
      total_items: data.total_items ?? items.length,
      range_type: data.range_type,
      analyzed_from: data.analyzed_from,
      analyzed_to: data.analyzed_to,
    }
  },

  getById: (id: string) =>
    api.get<ToDoTask>(`/api/todo/${id}`).catch(() => {
      return { data: null as unknown as ToDoTask }
    }),

  /** Mark task done (uses existing meetings API when task has meeting_id). */
  complete: async (
    task: ToDoTask,
    params?: { range_type?: 'day' | 'week' }
  ): Promise<{ success: boolean }> => {
    if (task.meeting_id) {
      const res = await meetingsAPI.updateTodoItemStatus(
        {
          meeting_id: task.meeting_id,
          description: task.description,
          time: task.time ?? undefined,
          status: 'done',
        },
        { range_type: params?.range_type ?? 'week' }
      )
      return res.data as { success: boolean }
    }
    return api.post<{ success: boolean }>(`/api/todo/${task.id}/complete`).then((r) => r.data)
  },

  pasteEmail: (data: {
    company?: string
    contact?: string
    deal?: string
    direction: 'prospect' | 'sales'
    text: string
    date: string
  }) => api.post<{ task_id: string; message_id: string }>('/api/email/paste', data),

  getCommunicationThread: (threadId: string) =>
    api.get<CommunicationThreadResponse>(`/api/communication/thread/${threadId}`),
}

export type CallPlaybookRuleResult = {
  rule_id?: string
  label: string
  description?: string
  passed: boolean
  what_you_said?: string | null
  what_you_should_say?: string | null
}

export type CallPlaybookAnalysis = {
  call_id: string
  template_id?: string
  template_name?: string
  source: 'llm' | 'cache' | 'none'
  generated_at?: string
  rules: CallPlaybookRuleResult[]
  overall_score?: number | null
  coaching_summary?: string | null
  message?: string | null
}

export type MeetingPlaybookRuleResult = CallPlaybookRuleResult

export type MeetingPlaybookAnalysis = {
  meeting_id: string
  template_id?: string
  template_name?: string
  source: 'llm' | 'cache' | 'none'
  generated_at?: string
  rules: MeetingPlaybookRuleResult[]
  overall_score?: number | null
  coaching_summary?: string | null
  /** Per-dimension scores 0–100: Handled objections, Personalized demo, Intro Banter, Set Agenda, Demo told a story */
  dimension_scores?: Record<string, number> | null
  message?: string | null
}

export type MeetingFeedbackMetric = {
  label: string
  status: string
  status_level?: 'great' | 'ok' | 'poor'
  value: string
  has_link?: boolean
  link_url?: string | null
  detail?: string
}

export type MeetingFeedbackBullet = {
  title: string
  details?: string | null
}

export type MeetingFeedback = {
  meeting_id: string
  source: 'llm' | 'cache' | 'none'
  generated_at?: string
  /** Call quality percentage 0–100 (AI-assessed). */
  quality_score?: number | null
  metrics: MeetingFeedbackMetric[]
  did_well: MeetingFeedbackBullet[]
  improve: MeetingFeedbackBullet[]
  message?: string | null
}

export type EvaluationKeyMoment = {
  timestamp: string
  type: 'positive' | 'negative' | 'neutral'
  description: string
}

export type EvaluationDealProgression = {
  from: string
  to: string
  likelihood: 'high' | 'medium' | 'low'
}

export type EvaluationOutcome = {
  status: 'successful' | 'neutral' | 'needs-attention'
  summary: string
  deal_progression: EvaluationDealProgression
  key_moments: EvaluationKeyMoment[]
}

export type EvaluationStrategicInsight = {
  category: 'pain-point' | 'budget' | 'decision-maker' | 'timeline' | 'competition'
  insight: string
  confidence: number
  icon: string
}

export type EvaluationRecommendedAction = {
  id: string
  priority: number
  title: string
  description: string
  timing: 'immediate' | 'within-24h' | 'this-week' | 'this-month'
  action_type: 'follow-up' | 'send-material' | 'schedule-meeting'
  status: 'pending' | 'completed' | 'dismissed'
}

export type MeetingEvaluation = {
  meeting_id: string
  source: 'llm' | 'cache' | 'none'
  generated_at?: string
  playbook_score_pct?: number | null
  outcome?: EvaluationOutcome | null
  strategic_insights: EvaluationStrategicInsight[]
  recommended_actions: EvaluationRecommendedAction[]
  message?: string | null
}

export type SmartSummaryDealHealthMetric = {
  value: number
  trend: 'up' | 'down' | 'stable'
}

export type SmartSummaryDealHealth = {
  engagement: SmartSummaryDealHealthMetric
  momentum: SmartSummaryDealHealthMetric
  risk_level: string
  risk_trend: 'up' | 'down' | 'stable'
  win_probability: SmartSummaryDealHealthMetric
}

export type SmartSummaryDealEvolution = {
  id: string
  date: string
  type: string
  outcome: string
  is_current: boolean
}

export type SmartSummaryThenVsNow = {
  topic: string
  then_date: string
  then_status: string
  then_sentiment: 'positive' | 'negative' | 'neutral'
  now_status: string
  now_sentiment: 'positive' | 'negative' | 'neutral'
  impact: string
  indicator: 'green' | 'amber' | 'red' | 'blue'
}

export type SmartSummaryChangeAlert = {
  id: string
  severity: 'critical' | 'warning' | 'info' | 'positive'
  title: string
  category: string
  previous_state: string
  previous_date: string
  current_state: string
  impact_analysis: string
  recommended_actions: string[]
}

export type SmartSummaryTopicTimeline = {
  date: string
  quote: string
  sentiment: 'positive' | 'negative' | 'neutral'
}

export type SmartSummaryEnhancedTopic = {
  title: string
  badge: 'new' | 'revisited' | 'resolved' | 'shifted' | 'trending'
  meeting_count: string
  sentiment_trend: 'improving' | 'declining' | 'stable'
  timeline: SmartSummaryTopicTimeline[]
  status: string
  next_step: string
}

export type SmartSummaryStrategicRecommendation = {
  priority: 'critical' | 'important' | 'opportunity'
  title: string
  why: string
  impact: string
  timeline: string
  confidence: number
}

export type MeetingSmartSummary = {
  meeting_id: string
  source: 'llm' | 'cache' | 'none'
  generated_at?: string
  deal_health?: SmartSummaryDealHealth | null
  deal_evolution: SmartSummaryDealEvolution[]
  then_vs_now: SmartSummaryThenVsNow[]
  change_alerts: SmartSummaryChangeAlert[]
  enhanced_topics: SmartSummaryEnhancedTopic[]
  strategic_recommendations: SmartSummaryStrategicRecommendation[]
  message?: string | null
}

export type NextMeetingStrategyObjectionHandling = {
  objection: string
  response: string
}

export type NextMeetingStrategy = {
  meeting_id?: string | null
  source: 'llm' | 'cache' | 'none'
  generated_at?: string | null
  objective?: string | null
  opening_script?: string | null
  key_talking_points: string[]
  objection_handling: NextMeetingStrategyObjectionHandling[]
  closing_move?: string | null
  message?: string | null
}

export type MeetingComment = {
  id: string
  meeting_id: string
  user_id: string
  author: string
  text: string
  created_at: string
  updated_at: string
}

// Calls API
export const callsAPI = {
  getCalls: (params?: any) => api.get('/api/calls', { params }),
  getCall: (id: string) => api.get(`/api/calls/${id}`),
  createCall: (data: any) => api.post('/api/calls', data),
  updateCall: (id: string, data: any) => api.put(`/api/calls/${id}`, data),
  updateCallByPhone: (phoneNumber: string, data: any) =>
    api.put(`/api/calls/update-by-phone/${phoneNumber}`, data),
  autoUpdateCallByPhone: (phoneNumber: string, data: any) =>
    api.put(`/api/calls/auto-update/${phoneNumber}`, data),
  autoUpdateLatestCall: (data: any) => api.put('/api/calls/auto-update-latest', data),
  deleteCall: (id: string) => api.delete(`/api/calls/${id}`),
  getKPISummary: (params?: any) => api.get('/api/calls/kpis/summary', { params }),
  getSentimentStats: (params?: any) => api.get('/api/calls/stats/sentiment', { params }),
  /** Analyze a call transcript against the user's Sales Playbook template (Atlas /calls). */
  getPlaybookAnalysis: (id: string, params?: { force_refresh?: boolean }) =>
    api.get<CallPlaybookAnalysis>(`/api/calls/${id}/playbook-analysis`, { params }),
  /** Trigger full analysis (insights + feedback + playbook) for a call. */
  fullAnalysis: async (callId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/calls/${callId}/full-analysis`)
    return response.data
  },
  /** Download playbook analysis report for a call as a JSON file. */
  downloadPlaybookReport: async (callId: string): Promise<void> => {
    const response = await api.get(`/api/calls/${callId}/playbook-report`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `playbook-report-${callId}.json`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },
}

// Campaigns API
export const campaignsAPI = {
  getCampaigns: (filters?: any) => api.get('/api/campaigns', { params: filters }),
  getCampaignsByGoal: (campaign_goal_id: string) => api.get('/api/campaigns', { params: { campaign_goal_id } }),
  createCampaign: (data: any) => api.post('/api/campaigns', data),
  updateCampaign: (id: string, data: any) => api.put(`/api/campaigns/${id}`, data),
  deleteCampaign: (id: string) => api.delete(`/api/campaigns/${id}`),
  getCampaign: (id: string) => api.get(`/api/campaigns/${id}`),
  startCampaign: (id: string) => api.post(`/api/campaigns/${id}/start`),
  pauseCampaign: (id: string) => api.post(`/api/campaigns/${id}/pause`),
  getCampaignStats: () => api.get('/api/campaigns/stats/summary'),
  getContactsFromGroups: (groupIds: string[]) => api.get('/api/campaigns/contacts-from-groups', { 
    params: { group_ids: groupIds.join(',') } 
  }),
}

// Integrations API
export const integrationsAPI = {
  getIntegrations: () => api.get('/api/integrations'),
  createIntegration: (data: any) => api.post('/api/integrations', data),
  updateIntegration: (id: string, data: any) => api.put(`/api/integrations/${id}`, data),
  deleteIntegration: (id: string) => api.delete(`/api/integrations/${id}`),
  getIntegration: (id: string) => api.get(`/api/integrations/${id}`),
  syncIntegration: (id: string) => api.post(`/api/integrations/${id}/sync`),
  getIntegrationStats: () => api.get('/api/integrations/stats/summary'),
}

export const groupsAPI = {
  getGroups: (params?: any) => api.get('/api/groups', { params }),
  createGroup: (data: any) => api.post('/api/groups', data),
  updateGroup: (id: string, data: any) => api.put(`/api/groups/${id}`, data),
  deleteGroup: (id: string) => api.delete(`/api/groups/${id}`),
  getGroup: (id: string) => api.get(`/api/groups/${id}`),
  getGroupMembers: (id: string, params?: any) => api.get(`/api/groups/${id}/members`, { params }),
  getAvailableContacts: (id: string, params?: any) => api.get(`/api/groups/${id}/available-contacts`, { params }),
  addContactsToGroup: (id: string, data: any) => api.post(`/api/groups/${id}/members`, data),
  removeContactsFromGroup: (id: string, data: any) => api.delete(`/api/groups/${id}/members`, { data }),
  importContactsToGroup: (id: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/api/groups/${id}/import-contacts`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getGroupStats: () => api.get('/api/groups/stats/summary'),
}

export const contactsImportAPI = {
  importFromExcel: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/contacts/import-excel', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getImportTemplate: () => api.get('/api/contacts/import-template'),
}

// Statistics API
export const statsAPI = {
  getDashboardStats: () => api.get('/api/stats/dashboard'),
  getContactsStats: () => api.get('/api/stats/contacts'),
}

// RAG API
export const ragAPI = {
  getKnowledgeBases: () => api.get('/api/rag/knowledge-base'),
  deleteKnowledgeBase: (knowledgeId: string) => api.delete(`/api/rag/knowledge-base/${knowledgeId}`),
  uploadKnowledgeBase: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/rag/knowledge-base/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  getAgentConfig: () => api.get('/api/rag/agent/config'),
  updateAgentConfig: (data: { language?: string; prompt?: string; first_message?: string }) =>
    api.patch('/api/rag/agent/config', null, { params: data }),
  getVoices: () => api.get('/api/rag/voices'),
  uploadVoice: (file: File, name: string, description?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', name)
    if (description) {
      formData.append('description', description)
    }
    return api.post('/api/rag/voices/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  // RAG Sales Coach Document APIs
  getRAGDocuments: () => api.get('/api/rag/sales-coach/documents'),
  uploadRAGDocument: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/rag/sales-coach/documents', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 300000, // 5 minutes timeout for large files
    })
  },
  downloadRAGDocument: (documentId: string) => 
    api.get(`/api/rag/sales-coach/documents/${documentId}/download`, {
      responseType: 'blob',
    }),
  deleteRAGDocument: (documentId: string) => 
    api.delete(`/api/rag/sales-coach/documents/${documentId}`),
  searchRAGDocuments: (query: string, limit: number = 10) => {
    const formData = new FormData()
    formData.append('query', query)
    formData.append('limit', limit.toString())
    return api.post('/api/rag/sales-coach/search', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// Email Marketing API
export const emailsAPI = {
  getEmails: (params?: any) => api.get('/api/emails/listemails', { params }),
  getEmail: (id: string) => api.get(`/api/emails/${id}`),
  createEmail: (data: any) => api.post('/api/emails/sendmail', data),
  updateEmail: (id: string, data: any) => api.put(`/api/emails/${id}`, data),
  deleteEmail: (id: string) => api.delete(`/api/emails/${id}`),
  sendEmail: (id: string) => api.post(`/api/emails/${id}/send`),
  getEmailStats: () => api.get('/api/emails/stats/summary'),
  // Test endpoints
  testEmailAPI: () => api.get('/api/emails/test'),
  getEmailsSimple: () => api.get('/api/emails/list'),
  // Email credentials
  saveCredentials: (data: { email: string; app_password: string; from_name?: string }) =>
    api.post('/api/emails/credentials', data),
  getCredentials: () => api.get('/api/emails/credentials'),
}

// WhatsApp API - using backend proxy
export const whatsappAPI = {
  getConversations: (params: { member_id: string; page: number; limit: number }) => 
    api.post('/api/whatsapp/conversations/member', params),
  getMessages: (params: { conversation_id: number; page: number; limit: number }) => 
    api.post('/api/whatsapp/conversations/messages', params),
  createLoginProfile: () =>
    api.post('/api/whatsapp/profile/create'),
  login: () =>
    api.post('/api/whatsapp/login'),
  uploadRAGFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/api/whatsapp/rag/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}

// Telegram API
export const telegramAPI = {
  // Contacts
  getTelegramContacts: async (params?: any) => {
    console.log('🔍 Calling getTelegramContacts with params:', params)
    const response = await api.get('/api/telegram/contacts', { params })
    console.log('🔍 getTelegramContacts response:', response)
    return response
  },
  createTelegramContact: (data: any) => api.post('/api/telegram/contacts', data),
  updateTelegramContact: (id: string, data: any) => api.put(`/api/telegram/contacts/${id}`, data),
  deleteTelegramContact: (id: string) => api.delete(`/api/telegram/contacts/${id}`),
  
  // Campaigns
  getTelegramCampaigns: async (params?: any) => {
    console.log('🔍 Calling getTelegramCampaigns with params:', params)
    const response = await api.get('/api/telegram/campaigns', { params })
    console.log('🔍 getTelegramCampaigns response:', response)
    return response
  },
  createTelegramCampaign: (data: any) => api.post('/api/telegram/campaigns', data),
  updateTelegramCampaign: (id: string, data: any) => api.put(`/api/telegram/campaigns/${id}`, data),
  deleteTelegramCampaign: (id: string) => api.delete(`/api/telegram/campaigns/${id}`),
  sendTelegramCampaign: (id: string) => api.post(`/api/telegram/campaigns/${id}/send`),
  
  // Manual sending
  sendTelegramMessage: (data: {
    message: string
    contact_ids: string[]
    send_immediately?: boolean
  }) => api.post('/api/telegram/send', data),
  
  // Start campaign
  startTelegramCampaign: (data: {
    name: string
    message: string
    urls: string[]
    campaignType: string
  }) => api.post('/api/telegram/start-campaign', data),
  createLoginProfile: () => api.post('/api/telegram/profile/create'),
  login: () => api.post('/api/telegram/login'),
  getAppConfig: () => api.get('/api/telegram/app-config'),
  saveAppConfig: (data: { api_id: string; api_hash: string; phone_number?: string }) =>
    api.post('/api/telegram/app-config', data),
  requestOtp: (data: { phone_number?: string }) =>
    api.post('/api/telegram/otp/request', data),
  verifyOtp: (data: { code: string }) =>
    api.post('/api/telegram/otp/verify', data),
}

// Inbox API
export const inboxAPI = {
  // Receive inbox response (public endpoint)
  receiveResponse: (data: {
    platform: string
    contact: string
    content: string
  }) => api.post('/api/inbox/receive', data),
  
  // Get responses by campaign (requires auth) - only incoming messages
  getResponsesByCampaign: (campaignId: string, params?: { limit?: number; skip?: number }) => 
    api.get(`/api/inbox/by-campaign/${campaignId}`, { params }),
  
  // Get conversation history (both incoming and outgoing) for a contact in a campaign
  getConversationHistory: (campaignId: string, telegramUsername: string, params?: { limit?: number; skip?: number }) =>
    api.get(`/api/inbox/conversation/${campaignId}/${encodeURIComponent(telegramUsername)}`, { params }),
  
  // Send a message to a contact via Telegram
  sendMessage: (data: {
    campaign_id: string
    contact: string
    content: string
  }) => api.post('/api/inbox/send-message', data),

  // Analyze conversation with Atlas
  analyzeConversation: (campaignId: string, telegramUsername: string) =>
    api.get(`/api/inbox/analyze/${campaignId}/${encodeURIComponent(telegramUsername)}`),

  // Analyze conversation with follow-up question
  analyzeFollowup: (campaignId: string, telegramUsername: string, data: {
    question: string
    previous_analysis?: any
  }) =>
    api.post(`/api/inbox/analyze-followup/${campaignId}/${encodeURIComponent(telegramUsername)}`, data),

  // Analyze entire campaign at macro level
  analyzeCampaign: (campaignId: string) =>
    api.get(`/api/inbox/analyze-campaign/${campaignId}`),

  // Analyze campaign with follow-up question
  analyzeCampaignFollowup: (campaignId: string, data: {
    question: string
    previous_analysis?: any
  }) =>
    api.post(`/api/inbox/analyze-campaign-followup/${campaignId}`, data),

  // Suggest a sales response
  suggestResponse: (data: {
    campaign_id: string
    telegram_username: string
    situation?: string
  }) => api.post('/api/inbox/suggest-response', data),
}

// Convention Activities API
export const conventionActivitiesAPI = {
  // Get convention activities with filtering
  getActivities: (params?: {
    is_customer?: boolean;
    has_campaigns?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) => api.get('/api/convention-activities', { params }),
  
  // Update contact status
  updateContactStatus: (data: {
    contact_id: string;
    status: 'customer' | 'lead' | 'prospect' | 'active' | 'inactive';
  }) => api.put('/api/convention-activities/contact-status', data),
  
  // Get convention statistics
  getStats: () => api.get('/api/convention-activities/stats'),
  
  // Get convention campaigns
  getConventionCampaigns: () => api.get('/api/convention-activities/campaigns'),
  
  // Create convention campaign (now uses main campaigns API with source field)
  // createCampaign: (data: any) => campaignsAPI.createCampaign({ ...data, source: 'convention-activities' }),
};

// Campaign Goals API
export const campaignGoalsAPI = {
  // Get all campaign goals
  getGoals: (source?: string) => api.get('/api/campaign-goals', { params: source ? { source } : {} }),
  
  // Get a single campaign goal
  getGoal: (goalId: string) => api.get(`/api/campaign-goals/${goalId}`),
  
  // Create a new campaign goal
  createGoal: (data: { name: string; description?: string; source?: string }) => api.post('/api/campaign-goals', data),
  
  // Update a campaign goal
  updateGoal: (goalId: string, data: any) => api.put(`/api/campaign-goals/${goalId}`, data),
  
  // Delete a campaign goal
  deleteGoal: (goalId: string) => api.delete(`/api/campaign-goals/${goalId}`),
  
  // Get campaign goal statistics
  getStats: () => api.get('/api/campaign-goals/stats/summary'),
  
  // Get KPI data for a goal
  getGoalKPI: (goalId: string, startDate?: string, endDate?: string) => 
    api.get(`/api/campaign-goals/${goalId}/kpi`, { 
      params: { 
        ...(startDate ? { start_date: startDate } : {}),
        ...(endDate ? { end_date: endDate } : {})
      } 
    }),

  // Get AI-generated To-Do items for a goal
  getGoalTodoItems: (goalId: string, forceRefresh?: boolean) =>
    api.get(`/api/campaign-goals/${goalId}/todo-items`, {
      params: { force_refresh: forceRefresh || false }
    }),

  // Clear cached todo items analysis
  clearGoalTodoCache: (goalId: string) =>
    api.delete(`/api/campaign-goals/${goalId}/todo-items/cache`),

  // Chat with Atlas
  chatWithSalesCoach: (goalId: string, data: {
    question: string
    context?: any
  }) =>
    api.post(`/api/campaign-goals/${goalId}/sales-coach/chat`, data),
};

// Deal View Types
export type DealViewType = 'all' | 'open' | 'closed_won' | 'closed_lost' | 'stalled' | 'no_activity' | 'closing_this_month' | 'closing_this_quarter'
export type DealStatus = 'lead' | 'qualified' | 'demo' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost' | 'new' | 'contacted'
export type DealPriority = 'low' | 'medium' | 'high' | 'urgent'

// Deals API
export const dealsAPI = {
  // Get deals with pagination and filtering
  getDeals: (params?: {
    page?: number;
    limit?: number;
    status?: DealStatus;
    pipeline_id?: string;
    view_type?: DealViewType;
    priority?: DealPriority;
    search?: string;
  }) => api.get('/api/deals/all', { params }),
  
  // Get deal by ID
  getDeal: (dealId: string) => api.get(`/api/deals/${dealId}`),
  
  // Create new deal
  createDeal: (data: {
    name: string;
    description?: string;
    contact_id: string;
    company_id?: string;
    campaign_id?: string;
    pipeline_id?: string;
    stage_id?: string;
    status?: DealStatus;
    priority?: DealPriority;
    amount?: number;
    cost?: number;
    revenue?: number;
    probability?: number;
    expected_close_date?: string;
    start_date?: string;
    end_date?: string;
    next_step?: string;
  }) => api.post('/api/deals/create', data),
  
  // Update deal
  updateDeal: (dealId: string, data: {
    name?: string;
    description?: string;
    contact_id?: string;
    company_id?: string;
    campaign_id?: string;
    pipeline_id?: string;
    stage_id?: string;
    status?: DealStatus;
    priority?: DealPriority;
    amount?: number;
    cost?: number;
    revenue?: number;
    probability?: number;
    expected_close_date?: string;
    actual_close_date?: string;
    start_date?: string;
    end_date?: string;
    loss_reason?: string;
    win_reason?: string;
    next_step?: string;
  }) => api.put(`/api/deals/${dealId}`, data),
  
  // Delete deal
  deleteDeal: (dealId: string) => api.delete(`/api/deals/${dealId}`),
  
  // Get deal statistics
  getStats: (pipelineId?: string) => api.get('/api/deals/stats', { params: { pipeline_id: pipelineId } }),
  
  // Get pipeline view (deals grouped by stages)
  getPipeline: (pipelineId?: string, viewType?: DealViewType) => 
    api.get('/api/deals/pipeline/view', { params: { pipeline_id: pipelineId, view_type: viewType } }),
  
  // Update deal stage (for drag and drop)
  updateDealStage: (dealId: string, stageId: string, pipelineId?: string) => 
    api.patch(`/api/deals/${dealId}/stage`, { stage_id: stageId, ...(pipelineId ? { pipeline_id: pipelineId } : {}) }),
  
  // Get deal activities
  getActivities: (dealId: string) => api.get(`/api/deals/${dealId}/activities`),
  
  // Create deal activity
  createActivity: (dealId: string, data: {
    activity_type: 'note' | 'call' | 'email' | 'meeting' | 'task';
    subject?: string;
    content?: string;
    scheduled_at?: string;
    is_completed?: boolean;
  }) => api.post(`/api/deals/${dealId}/activities`, data),
  
  // Get contacts for deal creation
  getContacts: (search?: string) => api.get('/api/contacts', { params: { search } }),
  
  // Get campaigns for deal creation
  getCampaigns: () => api.get('/api/deals/campaigns/list'),
}

// Pipelines API
export const pipelinesAPI = {
  // Get all pipelines
  getPipelines: (includeInactive?: boolean) => 
    api.get('/api/pipelines/get_pipelines', { params: { include_inactive: includeInactive } }),
  
  // Get default pipeline
  getDefaultPipeline: () => api.get('/api/pipelines/default'),
  
  // Get pipeline by ID
  getPipeline: (pipelineId: string) => api.get(`/api/pipelines/${pipelineId}`),
  
  // Create pipeline
  createPipeline: (data: {
    name: string;
    description?: string;
    business_type?: string;
    is_default?: boolean;
    stages?: Array<{
      name: string;
      probability: number;
      order: number;
      color?: string;
      description?: string;
    }>;
  }) => api.post('/api/pipelines/create', data),
  
  // Update pipeline
  updatePipeline: (pipelineId: string, data: {
    name?: string;
    description?: string;
    business_type?: string;
    is_default?: boolean;
    is_active?: boolean;
    stages?: Array<{
      name: string;
      probability: number;
      order: number;
      color?: string;
      description?: string;
    }>;
  }) => api.put(`/api/pipelines/${pipelineId}`, data),
  
  // Delete pipeline
  deletePipeline: (pipelineId: string) => api.delete(`/api/pipelines/${pipelineId}`),
  
  // Get pipeline kanban view
  getPipelineView: (pipelineId: string, viewType?: DealViewType) => 
    api.get(`/api/pipelines/${pipelineId}/view`, { params: { view_type: viewType } }),
  
  // Get pipeline analytics
  getPipelineAnalytics: (pipelineId: string) => 
    api.get(`/api/pipelines/${pipelineId}/analytics`),
  
  // Get pipeline leads view (lead-based pipeline)
  getPipelineLeadsView: (pipelineId: string) => 
    api.get(`/api/pipelines/${pipelineId}/leads/view`),
  
  // Update lead stage in pipeline
  updatePipelineLeadStage: (pipelineId: string, contactId: string, stageId: string) => 
    api.patch(`/api/pipelines/${pipelineId}/leads/${contactId}`, { stage_id: stageId }),
}

// Renewals API
export const renewalsAPI = {
  getRenewals: (params?: any) => api.get('/api/renewals', { params }),
  getRenewal: (id: string) => api.get(`/api/renewals/${id}`),
  createRenewal: (data: any) => api.post('/api/renewals', data),
  updateRenewal: (id: string, data: any) => api.put(`/api/renewals/${id}`, data),
  deleteRenewal: (id: string) => api.delete(`/api/renewals/${id}`),
  getStats: () => api.get('/api/renewals/stats/summary'),
}

// CSM API
export const csmAPI = {
  getCSMRecords: (params?: any) => api.get('/api/csm/getdata', { params }),
  getCSMRecord: (id: string) => api.get(`/api/csm/${id}`),
  createCSMRecord: (data: any) => api.post('/api/csm', data),
  updateCSMRecord: (id: string, data: any) => api.put(`/api/csm/${id}`, data),
  deleteCSMRecord: (id: string) => api.delete(`/api/csm/${id}`),
  getStats: () => api.get('/api/csm/stats/overview'),
}

// Upsell API
export const upsellAPI = {
  getUpsellRecords: (params?: any) => api.get('/api/upsell/getdata', { params }),
  getUpsellRecord: (id: string) => api.get(`/api/upsell/${id}`),
  createUpsellRecord: (data: any) => api.post('/api/upsell', data),
  updateUpsellRecord: (id: string, data: any) => api.put(`/api/upsell/${id}`, data),
  deleteUpsellRecord: (id: string) => api.delete(`/api/upsell/${id}`),
  getStats: () => api.get('/api/upsell/stats/overview'),
}

// Workflows API

// User Google Calendar API (Atlas)
export const calendarAPI = {
  getStatus: () => api.get<{ connected: boolean }>('/api/user/calendar/status'),
  getAuthUrl: (redirectOrigin?: string) =>
    api.get<{ url: string }>('/api/user/calendar/auth-url', {
      params: redirectOrigin ? { redirect_origin: redirectOrigin } : undefined,
    }),
  getEvents: (params?: { time_min?: string; time_max?: string }) =>
    api.get<{ events: GoogleCalendarEvent[] }>('/api/user/calendar/events', { params }),
  getEventsWithMeetingLink: (params?: { time_min?: string; time_max?: string }) =>
    api.get<{ events: GoogleCalendarEvent[] }>('/api/user/calendar/events-with-meeting-link', { params }),
}

export interface GoogleCalendarEvent {
  id?: string
  summary?: string
  start?: { dateTime?: string; date?: string }
  end?: { dateTime?: string; date?: string }
  status?: string
  /** Google Meet / conference link */
  hangoutLink?: string
  htmlLink?: string
  conferenceData?: {
    entryPoints?: Array<{ entryPointType?: string; uri?: string }>
  }
  /** Attendees of the event */
  attendees?: Array<{
    email?: string
    displayName?: string
    responseStatus?: string
    self?: boolean
  }>
}

// Atlas meeting context for calendar detail panel
export interface AtlasMeetingContext {
  contact?: {
    id: string
    first_name: string
    last_name: string
    company?: string
    email?: string
    phone?: string
    job_title?: string
    address?: string
    city?: string
    state?: string
    country?: string
  }
  deal?: {
    id: string
    name: string
    status?: string
    stage_name?: string
    next_step?: string
    amount: number
  }
  company?: {
    name?: string
    employee_count_range?: string
    revenue_range?: string
    business_description?: string
    country?: string
    region?: string
    city?: string
    locality?: string
    crm_missing_message?: string
  }
  past_events?: Array<{
    id: string
    type: string
    date: string
    subject?: string
    content?: string
  }>
  last_interaction?: {
    summary?: string
    open_points?: string
    agreed_next_step?: string
  }
  meeting_preparation?: {
    key_points?: string[]
    risks_or_questions?: string[]
    suggested_angle?: string
  }
  meeting_number_with_company?: number
  objective_of_meeting?: string
}

// Meeting participants (per calendar event) - user-filled
export interface MeetingParticipant {
  id?: string
  name: string
  email?: string
  job_title?: string
  company?: string
  notes?: string
}

export interface CompanyInfoUser {
  industry?: string
  size_revenue?: string
  location?: string
  founded?: string
  website?: string
  description?: string
}

export interface MainContactUser {
  name?: string
  email?: string
  job_title?: string
}

export interface MeetingParticipantsResponse {
  event_id: string
  participants: MeetingParticipant[]
  company_info?: CompanyInfoUser | null
  main_contact?: MainContactUser | null
  deal_stage?: string | null
  event_title?: string | null
  event_start?: string | null
}

export interface MeetingHistoryItem {
  event_id: string
  event_title?: string | null
  event_start?: string | null
}

export interface MeetingHistoryByEmailResponse {
  email: string
  meetings: MeetingHistoryItem[]
}

export interface MeetingEnrichResponse {
  event_id: string
  enriched: boolean
  attendee_email?: string | null
  company_name?: string | null
  company_info?: CompanyInfoUser | null
  main_contact?: MainContactUser | null
  error?: string | null
  already_enriched?: boolean
}

export interface ParticipantEnrichResponse {
  email: string
  enriched: boolean
  linkedin_url?: string | null
  profile_data?: EnrichedProfileData | null
  error?: string | null
  already_enriched?: boolean
}

export interface EnrichedProfileData {
  name: string
  title: string
  company: string
  tenure: string
  location: string
  linkedinUrl: string
  profilePic?: string
  about?: string
  languages: string[]
  interests: string[]
  disc: {
    type: string
    label: string
    color: string
    traits: string[]
  }
  compatibility: {
    level: string
    percentage: number
  }
  communicationStrategy: {
    dos: { action: string; example: string }[]
    donts: { action: string; example: string }[]
  }
  personalityTraits: {
    archetype: string
    traits: { name: string; description: string }[]
  }
}

export interface NeuroProfile {
  decisionStyle: { score: number; label: string; description: string }
  riskTolerance: { score: number; label: string; description: string }
  triggers: Array<{ label: string; color: string }>
  summary: string
  approach: {
    do: { title: string; action: string }
    dont: { title: string; action: string }
    bias: { name: string; description: string }
  }
  openingScript: {
    text: string
    reasons: Array<{ principle: string; explanation: string }>
  }
  riskAlerts: Array<{ icon: string; title: string; description: string }>
}

export type AtlasQnAClassification = 'product' | 'service' | 'general'
export type AtlasQnAStatus = 'draft' | 'approved' | 'archived'
export type AtlasQnAOrigin = 'manual' | 'ai_call_extracted' | 'ai_knowledge_derived'

export type AtlasQnARecord = {
  id: string
  question: string
  answer: string
  classification: AtlasQnAClassification
  topic?: string | null
  product_tag?: string | null
  service_tag?: string | null
  usage_count: number
  last_used_at?: string | null
  status: AtlasQnAStatus
  created_by_user_id?: string | null
  created_by_user_name?: string | null
  approved_by_user_id?: string | null
  approved_by_user_name?: string | null
  approved_at?: string | null
  // Source linking (Call Insights / Knowledge)
  source_meeting_id?: string | null
  source_meeting_title?: string | null
  source_call_id?: string | null
  source_doc_id?: string | null
  source_doc_name?: string | null
  // AI / grounding indicators
  origin: AtlasQnAOrigin
  is_grounded?: boolean
  grounding_confidence?: number | null
  ai_confidence?: number | null
  // Performance fields
  growth_percent?: number | null
  friction_score?: number | null
  recurring_intensity?: number | null
  organization_id: string
  created_at: string
  updated_at: string
}

export interface AtlasQnAStats {
  total_questions: number
  approved_count: number
  draft_count: number
  total_usage: number
  top_questions: Array<{ id: string; question: string; usage_count: number; growth_percent?: number }>
  trending_questions: Array<{ id: string; question: string; usage_count: number; growth_percent: number }>
  classification_breakdown: {
    product: number
    service: number
    general: number
  }
  friction_breakdown: Array<{ classification: AtlasQnAClassification; avg_friction: number; count: number }>
  recent_trend: Array<{ date: string; count: number }>
}

export interface AtlasKnowledgeDocument {
  id: string
  name: string
  size: number
  uploadedAt: string
  status: 'processed' | 'processing' | 'failed'
  type: 'pdf' | 'docx'
  pages: number
  total_chunks?: number
  error_message?: string
}

export const atlasAPI = {
  getMeetingContext: (q: string) =>
    api.get<AtlasMeetingContext>('/api/atlas/meeting-context', { params: { q } }),
  getMeetingParticipants: (eventId: string) =>
    api.get<MeetingParticipantsResponse>('/api/atlas/meeting-participants', { params: { event_id: eventId } }),
  saveMeetingParticipants: (
    eventId: string,
    data: {
      participants: MeetingParticipant[]
      company_info?: CompanyInfoUser
      main_contact?: MainContactUser
      deal_stage?: string
      event_title?: string
      event_start?: string
    }
  ) =>
    api.put<MeetingParticipantsResponse>('/api/atlas/meeting-participants', {
      event_id: eventId,
      participants: data.participants,
      company_info: data.company_info ?? undefined,
      main_contact: data.main_contact ?? undefined,
      deal_stage: data.deal_stage ?? undefined,
      event_title: data.event_title ?? undefined,
      event_start: data.event_start ?? undefined,
    }),
  getMeetingHistoryByEmail: (email: string) =>
    api.get<MeetingHistoryByEmailResponse>('/api/atlas/meeting-history-by-email', { params: { email } }),
  /** Lưu danh sách meeting khi load lịch; trùng id thì update */
  syncCalendarEvents: (events: Array<{ 
    id?: string
    summary?: string
    start?: { dateTime?: string; date?: string }
    end?: { dateTime?: string; date?: string }
    attendees?: Array<{ email?: string; displayName?: string; responseStatus?: string; self?: boolean }>
  }>) =>
    api.post<{ synced: number }>('/api/atlas/calendar-events/sync', {
      events: events
        .filter((e) => e.id)
        .map((e) => ({
          id: e.id,
          summary: e.summary,
          start: e.start?.dateTime || e.start?.date || undefined,
          end: e.end?.dateTime || e.end?.date || undefined,
          attendees: e.attendees?.map((a) => ({
            email: a.email,
            displayName: a.displayName,
            responseStatus: a.responseStatus,
            self: a.self,
          })),
        })),
    }),

  /** Auto-enrich meeting info from attendee email */
  enrichMeeting: (eventId: string, forceRefresh: boolean = false) =>
    api.post<MeetingEnrichResponse>('/api/atlas/meeting-enrich', {
      event_id: eventId,
      force_refresh: forceRefresh,
    }, { timeout: 180000 }),  // 3 minute timeout for slow company search API

  /** Enrich a single participant via LinkedIn (Apify + AI) */
  enrichParticipant: (params: {
    event_id: string
    email: string
    name?: string
    linkedin_url?: string
    force?: boolean
  }) =>
    api.post<ParticipantEnrichResponse>('/api/atlas/participant-enrich', params, { timeout: 240000 }),

  /** Get previously enriched LinkedIn profile for a participant */
  getParticipantProfile: (email: string) =>
    api.get<{ email: string; linkedin_url?: string; profile_data: EnrichedProfileData }>('/api/atlas/participant-profile', { params: { email } }),

  /** Update a participant's LinkedIn URL without full enrichment */
  updateParticipantLinkedIn: (params: { email: string; linkedin_url: string }) =>
    api.patch<{ email: string; linkedin_url: string; updated: boolean }>('/api/atlas/participant-linkedin', params),

  /** Get AI-generated neuro/cognitive profile for contact */
  getNeuroProfile: (params: { event_id?: string; email?: string; name?: string; force?: boolean }) =>
    api.get<NeuroProfile>('/api/atlas/neuro-profile', { params }),

  /** Rolling Q&A Repository CRUD */
  listQna: (params?: { 
    search?: string
    page?: number
    limit?: number
    classification?: AtlasQnAClassification
    status?: AtlasQnAStatus
    sort_by?: 'usage_count' | 'created_at' | 'last_used_at' | 'growth_percent'
    sort_order?: 'asc' | 'desc'
  }) =>
    api.get<{ items: AtlasQnARecord[]; total: number; page: number; limit: number }>('/api/atlas/qna', { params }),
  createQna: (data: { 
    question: string
    answer: string
    classification: AtlasQnAClassification
    topic?: string
    product_tag?: string
    service_tag?: string
    status?: AtlasQnAStatus
    source_meeting_id?: string
  }) =>
    api.post<AtlasQnARecord>('/api/atlas/qna', data),
  getQna: (id: string) => api.get<AtlasQnARecord>(`/api/atlas/qna/${id}`),
  updateQna: (id: string, data: { 
    question?: string
    answer?: string
    classification?: AtlasQnAClassification
    topic?: string
    product_tag?: string
    service_tag?: string
    status?: AtlasQnAStatus
  }) =>
    api.put<AtlasQnARecord>(`/api/atlas/qna/${id}`, data),
  deleteQna: (id: string) => api.delete(`/api/atlas/qna/${id}`),
  approveQna: (id: string) => api.post<AtlasQnARecord>(`/api/atlas/qna/${id}/approve`),
  incrementQnaUsage: (id: string) => api.post<AtlasQnARecord>(`/api/atlas/qna/${id}/increment-usage`),
  getQnaStats: () => api.get<AtlasQnAStats>('/api/atlas/qna/stats'),
  searchSimilarQna: (question: string) => 
    api.post<{ matches: Array<AtlasQnARecord & { similarity: number }> }>('/api/atlas/qna/search-similar', { question }),
  // Extract Q&A from meeting or transcript
  extractQna: (data: { meeting_id?: string; transcript?: string }) =>
    api.post<{ success: boolean; message: string; extracted_count: number; qna_ids: string[] }>('/api/atlas/qna/extract', data),
  // Atlas Knowledge – documents by category (product-info | pricing-plan | objection-handling | competitive-intel | customer-faqs | company-policies)
  getKnowledgeDocuments: (category: string) =>
    api.get<AtlasKnowledgeDocument[]>(`/api/atlas/knowledge/${category}/documents`),
  uploadKnowledgeDocument: (category: string, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post<{ id: string; filename: string; status: string; total_chunks: number; message: string }>(
      `/api/atlas/knowledge/${category}/documents`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 }
    )
  },
  downloadKnowledgeDocument: (category: string, documentId: string) =>
    api.get(`/api/atlas/knowledge/${category}/documents/${documentId}/download`, { responseType: 'blob' }),
  deleteKnowledgeDocument: (category: string, documentId: string) =>
    api.delete<{ message: string; id: string; chunks_deleted: number }>(
      `/api/atlas/knowledge/${category}/documents/${documentId}`
    ),
  
  /** Transcribe audio file using backend proxy */
  transcribeAudio: (file: Blob, filename: string, language: string = 'en') => {
    const formData = new FormData()
    formData.append('file', file, filename)
    return api.post<{ text: string }>(
      `/api/atlas/transcribe?language=${encodeURIComponent(language)}`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120000 }
    )
  },
}

export const workflowsAPI = {
  // Get workflow by function
  getWorkflow: (functionName: string, campaignId?: string) => 
    api.get('/api/workflows', { params: { function: functionName, ...(campaignId ? { campaign_id: campaignId } : {}) } }),
  
  // Create workflow
  createWorkflow: (data: {
    function: string;
    name?: string;
    description?: string;
    nodes: any[];
    connections: any[];
  }) => api.post('/api/workflows', data),
  
  // Update workflow (creates if not exists)
  updateWorkflow: (functionName: string, data: {
    name?: string;
    description?: string;
    nodes?: any[];
    connections?: any[];
  }) => api.put('/api/workflows', data, { params: { function: functionName } }),
  
  // Delete workflow
  deleteWorkflow: (functionName: string) => api.delete('/api/workflows', { params: { function: functionName } }),
  
  // Get company workflows (from colleagues in the same company)
  getCompanyWorkflows: (functionName: string) => 
    api.get('/api/workflows/company-workflows', { params: { function: functionName } }),
  
  // Get colleagues who have a workflow for this function
  getColleaguesWithWorkflow: (functionName: string) => 
    api.get('/api/workflows/colleagues-with-workflow', { params: { function: functionName } }),
  
  // Get a specific colleague's workflow
  getColleagueWorkflow: (colleagueId: string, functionName: string) => 
    api.get(`/api/workflows/colleague/${colleagueId}`, { params: { function: functionName } }),
  
  // Get workflows by goal ID
  getWorkflowsByGoal: (goalId: string) => 
    api.get(`/api/workflows/by-goal/${goalId}`),
  
  // Get workflow by ID
  getWorkflowById: (workflowId: string, campaignId?: string) => 
    api.get(`/api/workflows/${workflowId}`, { params: campaignId ? { campaign_id: campaignId } : {} }),
  
  // Update workflow by ID
  updateWorkflowById: (workflowId: string, data: {
    name?: string;
    description?: string;
    nodes?: any[];
    connections?: any[];
  }) => api.put(`/api/workflows/${workflowId}`, data),
}

// Campaign Workflow Scripts API
// Companies API
export const companiesAPI = {
  registerCompany: (data: any) => api.post('/api/companies/register', data),
  getMyCompany: () => api.get('/api/companies/me'),
  updateMyCompany: (data: any) => api.put('/api/companies/me', data),
  getPublicCompanies: () => api.get('/api/companies/public/list'),
  inviteEmployee: (companyId: string, data: any) => 
    api.post(`/api/companies/${companyId}/invite-employee`, data),
  acceptInvite: (inviteToken: string, password: string) =>
    api.post(`/api/companies/accept-invite/${inviteToken}`, { password }),
  linkColleague: (data: any) => api.post('/api/companies/link-colleague', data),
  acceptColleagueLink: (linkToken: string) =>
    api.post(`/api/companies/accept-colleague-link/${linkToken}`),
  linkAdmin: (data: any) => api.post('/api/companies/link-admin', data),
  getEmployees: (companyId: string) => api.get(`/api/companies/${companyId}/employees`),
}

export const campaignWorkflowScriptsAPI = {
  // Get all node scripts for a campaign workflow
  getCampaignWorkflowScripts: (campaignId: string, workflowFunction: string) =>
    api.get('/api/campaign-workflow-scripts', { params: { campaign_id: campaignId, workflow_function: workflowFunction } }),
  
  // Get script for a specific node
  getNodeScript: (campaignId: string, workflowFunction: string, nodeId: string) =>
    api.get('/api/campaign-workflow-scripts/by-node', { params: { campaign_id: campaignId, workflow_function: workflowFunction, node_id: nodeId } }),
  
  // Get all node scripts as dictionary
  getAllNodeScripts: (campaignId: string, workflowFunction: string) =>
    api.get('/api/campaign-workflow-scripts/all-nodes', { params: { campaign_id: campaignId, workflow_function: workflowFunction } }),
  
  // Create or update script for a node
  saveNodeScript: (data: {
    campaign_id: string;
    workflow_function: string;
    node_id: string;
    script: string;
    config?: any;
  }) => api.post('/api/campaign-workflow-scripts', data),
  
  // Update script
  updateNodeScript: (scriptId: string, data: {
    script?: string;
    config?: any;
  }) => api.put(`/api/campaign-workflow-scripts/${scriptId}`, data),
  
  // Delete script
  deleteNodeScript: (scriptId: string) => api.delete(`/api/campaign-workflow-scripts/${scriptId}`),
}

// Prioritized Prospects API
export const prioritizedProspectsAPI = {
  generate: (params?: { limit?: number }) => api.post('/api/prioritized-prospects/generate', null, { params }),
  getPrioritizedProspects: (params?: { page?: number; limit?: number }) => 
    api.get('/api/prioritized-prospects', { params }),
  getPrioritizedProspect: (id: string) => api.get(`/api/prioritized-prospects/${id}`),
  deletePrioritizedProspect: (id: string) => api.delete(`/api/prioritized-prospects/${id}`),
  shortenContent: (id: string) => api.post(`/api/prioritized-prospects/${id}/shorten`),
  generateDifferentApproach: (id: string) => api.post(`/api/prioritized-prospects/${id}/different-approach`),
}

// Meetings API
export type MeetingPlatform = 'teams' | 'zoom' | 'google_meet' | 'local'

export const meetingsAPI = {
  getMeetings: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    platform?: MeetingPlatform;
  }) => api.get('/api/meetings', { params }),

  /** Get meeting by link (404 if not found). Use to check before creating from calendar Bot join. */
  getMeetingByLink: (link: string) =>
    api.get<{ id: string; title: string; link: string; platform: MeetingPlatform; created_at?: string; updated_at?: string }>(
      '/api/meetings/by-link',
      { params: { link } }
    ),
  
  getMeeting: (id: string) => api.get(`/api/meetings/${id}`),
  
  createMeeting: (data: {
    title: string;
    description?: string;
    platform: MeetingPlatform;
    link: string;
  }) => api.post('/api/meetings', data),
  
  updateMeeting: (id: string, data: {
    title?: string;
    description?: string;
    platform?: MeetingPlatform;
    link?: string;
    transcript_lines?: Array<{ speaker: string; role?: string; time: string; text: string }>;
  }) => api.put(`/api/meetings/${id}`, data),

  /** Backend will try Vexa, then fall back to cached DB transcript */
  getMeetingTranscription: (id: string, params?: { refresh_ttl_seconds?: number }) =>
    api.get<{ meeting_id: string; source: 'vexa' | 'cache' | 'none'; transcript_lines: Array<{ speaker: string; role?: string; time: string; text: string }>; fetched_at?: string; message?: string }>(
      `/api/meetings/${id}/transcription`,
      { params }
    ),

  getAtlasMeetingInsights: (id: string, params?: { force_refresh?: boolean }) =>
    api.get<{
      meeting_id: string;
      source: 'llm' | 'cache' | 'none';
      generated_at?: string;
      summary: {
        key_takeaways?: string[];
        introduction_and_overview?: string[];
        current_challenges?: string[];
        product_fit_and_capabilities?: string[];
      };
      next_steps: Array<{ assignee: string; description: string; time?: string | null }>;
      questions_and_objections: Array<{ question: string; time?: string | null; answer: string }>;
      message?: string;
    }>(`/api/meetings/${id}/atlas-insights`, { params }),
  getMeetingPlaybookAnalysis: (
    id: string,
    params?: { force_refresh?: boolean; template_id?: string }
  ) => api.get<MeetingPlaybookAnalysis>(`/api/meetings/${id}/playbook-analysis`, { params }),
  getMeetingFeedback: (id: string, params?: { force_refresh?: boolean }) =>
    api.get<MeetingFeedback>(`/api/meetings/${id}/feedback`, { params }),

  getMeetingEvaluation: (id: string, params?: { force_refresh?: boolean }) =>
    api.get<MeetingEvaluation>(`/api/meetings/${id}/evaluation`, { params }),

  getMeetingSmartSummary: (id: string, params?: { force_refresh?: boolean }) =>
    api.get<MeetingSmartSummary>(`/api/meetings/${id}/smart-summary`, { params }),

  getNextMeetingStrategy: (id: string, params?: { force_refresh?: boolean }) =>
    api.post<NextMeetingStrategy>(`/api/meetings/${id}/strategy-next-meeting`, null, { params }),

  getMeetingComments: (id: string) =>
    api.get<MeetingComment[]>(`/api/meetings/${id}/comments`),
  createMeetingComment: (id: string, data: { text: string }) =>
    api.post<MeetingComment>(`/api/meetings/${id}/comments`, data),
  updateMeetingComment: (id: string, commentId: string, data: { text: string }) =>
    api.put<MeetingComment>(`/api/meetings/${id}/comments/${commentId}`, data),
  deleteMeetingComment: (id: string, commentId: string) =>
    api.delete(`/api/meetings/${id}/comments/${commentId}`),
  
  deleteMeeting: (id: string) => api.delete(`/api/meetings/${id}`),

  /** Full re-analysis: regenerate insights, feedback, playbook + extract Q&A */
  reanalyzeMeeting: (id: string) =>
    api.post<{
      meeting_id: string;
      insights_regenerated: boolean;
      feedback_regenerated: boolean;
      playbook_regenerated: boolean;
      qna_extracted_count: number;
      qna_ids: string[];
      message: string;
    }>(`/api/meetings/${id}/reanalyze`),

  /** Playbook scores per day for Insights page (last N days). */
  getPlaybookScoresInsights: (params?: { days?: number; offset_days?: number }) =>
    api.get<{
      days: Array<{
        date: string
        label: string
        score_pct: number | null
        count: number
        dimension_scores?: Record<string, number> | null
      }>
    }>('/api/meetings/insights/playbook-scores', { params: params ?? { days: 5 } }),

  /** Speaking metrics per day + averages for Insights > Speaking Skills (from feedback_coach.speaking_metrics). */
  getSpeakingScoresInsights: (params?: { days?: number; offset_days?: number }) =>
    api.get<{
      days: Array<{
        date: string
        label: string
        count: number
        speech_pace_wpm?: number | null
        talk_ratio_pct?: number | null
        longest_customer_monologue_sec?: number | null
        questions_asked_avg?: number | null
        filler_words_avg?: number | null
      }>;
      averages: {
        speech_pace_wpm?: number
        talk_ratio_pct?: number
        longest_customer_monologue_sec?: number
        questions_asked_avg?: number
        filler_words_avg?: number
      }
    }>('/api/meetings/insights/speaking-scores', { params: params ?? { days: 5 } }),

  /** To-Do items insights across meetings for Atlas /todo (day or week). */
  getTodoInsights: (params?: { range_type?: 'day' | 'week' }) =>
    api.get<{
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
    }>('/api/meetings/insights/todo', { params: params ?? { range_type: 'day' } }),

  analyzeTodoInsights: (params?: { range_type?: 'day' | 'week' }) =>
    api.post<{
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
    }>('/api/meetings/insights/todo/analyze', null, { params: params ?? { range_type: 'day' } }),

  /** Update todo item status (mark as done/open) */
  updateTodoItemStatus: (data: {
    meeting_id: string
    description: string
    time?: string | null
    status: 'open' | 'done'
  }, params?: { range_type?: 'day' | 'week' }) =>
    api.patch<{ success: boolean; status: string }>(
      '/api/meetings/insights/todo/item',
      data,
      { params: params ?? { range_type: 'week' } }
    ),

  /** Objection Handling insights across calls (aggregated questions & objections by topic). */
  getObjectionInsights: () =>
    api.get<{
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
          user_actual_answer?: string | null
          suggested_answer?: string | null
          match_score?: number | null
          key_points_covered?: string[]
          learning_opportunities?: string[]
        }>
      }>
      generated_at: string
    }>('/api/meetings/insights/objections'),

  analyzeObjectionInsights: (params?: { days?: number }) =>
    api.post<{
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
          user_actual_answer?: string | null
          suggested_answer?: string | null
          match_score?: number | null
          key_points_covered?: string[]
          learning_opportunities?: string[]
        }>
      }>
      generated_at: string
    }>('/api/meetings/insights/objections/analyze', null, { params: params ?? { days: 5 } }),

  /** Toggle a next-step item's checked state by index. */
  toggleNextStep: async (meetingId: string, index: number): Promise<{ success: boolean; checked: boolean }> => {
    const response = await api.post(`/api/meetings/${meetingId}/next-steps/${index}/toggle`)
    return response.data
  },

  /** Download playbook analysis report for a meeting as a JSON file. */
  downloadPlaybookReport: async (meetingId: string): Promise<void> => {
    const response = await api.get(`/api/meetings/${meetingId}/playbook-report`, {
      responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `playbook-report-${meetingId}.json`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  },

  /** Update media URLs (video / audio) for a meeting. */
  updateMediaUrls: async (meetingId: string, videoUrl?: string, audioUrl?: string): Promise<any> => {
    const params: any = {}
    if (videoUrl) params.video_url = videoUrl
    if (audioUrl) params.audio_url = audioUrl
    const response = await api.patch(`/api/meetings/${meetingId}/media-urls`, null, { params })
    return response.data
  },
}

// Playbook template types
export type PlaybookTemplateRule = { id?: string; label: string; description: string }

export type PlaybookTemplate = {
  id: string
  user_id: string
  name: string
  rules: PlaybookTemplateRule[]
  is_default: boolean
  template_type: string
  prompt?: string
  meeting_type: string
  title_keyword?: string
  active: boolean
  created_at: string
  updated_at: string
}

export type PlaybookTemplateCreate = {
  name: string
  rules: PlaybookTemplateRule[]
  template_type?: 'personal' | 'team' | 'suggested'
  prompt?: string
  meeting_type?: 'external' | 'internal' | 'all'
  title_keyword?: string
  active?: boolean
}

export type PlaybookTemplateUpdate = {
  name?: string
  rules?: PlaybookTemplateRule[]
  is_default?: boolean
  template_type?: 'personal' | 'team' | 'suggested'
  prompt?: string
  meeting_type?: 'external' | 'internal' | 'all'
  title_keyword?: string
  active?: boolean
}

// Playbooks API (Sales playbook templates / rules)
export const playbooksAPI = {
  list: (params?: { limit?: number; template_type?: string }) => api.get<{ templates: PlaybookTemplate[]; total: number }>(
    '/api/playbooks',
    { params }
  ),
  create: (data: PlaybookTemplateCreate) =>
    api.post('/api/playbooks', data),
  get: (id: string) => api.get<PlaybookTemplate>(`/api/playbooks/${id}`),
  update: (id: string, data: PlaybookTemplateUpdate) =>
    api.put(`/api/playbooks/${id}`, data),
  setDefault: (id: string) => api.post(`/api/playbooks/${id}/set-default`),
  delete: (id: string) => api.delete(`/api/playbooks/${id}`),
}

// Gmail API
export interface GmailEmail {
  id: string
  thread_id: string
  subject: string
  from: string
  snippet: string
  date: string | null
  internal_date: string | null
}

export interface GmailStatusResponse {
  configured: boolean
  has_access_token: boolean
  has_gmail_scope: boolean
  /** Backend returns a single space-separated scope string or null */
  token_scopes: string | null
  token_expiry: string | null
  email: string
  needs_reauthorization: boolean
}

export const gmailAPI = {
  /** Get Gmail connection status */
  getStatus: () => api.get<GmailStatusResponse>('/api/gmail/status'),
  
  /** Get latest emails from user's Gmail inbox */
  getLatestEmails: (params?: { max_results?: number; query?: string }) =>
    api.get<{ success: boolean; count: number; emails: GmailEmail[] }>(
      '/api/gmail/latest',
      { params }
    ),
  
  /** Get reauthorization URL if Gmail scope is missing */
  getReauthorizeUrl: () =>
    api.get<{ auth_url: string; state: string; message: string }>('/api/gmail/reauthorize'),
}

// Vexa AI API (proxied via backend; API key is on server, see .env VEXA_API_KEY / VEXA_API_BASE)
export const vexaAPI = {
  joinGoogleMeet: (nativeMeetingId: string) =>
    api.post('/api/vexa/bots', {
      platform: 'google_meet',
      native_meeting_id: nativeMeetingId,
      bot_name: 'Atlas Assistant',
    }),
  joinTeams: (nativeMeetingId: string, passcode: string) =>
    api.post('/api/vexa/bots', {
      platform: 'teams',
      native_meeting_id: nativeMeetingId,
      passcode,
      bot_name: 'Atlas Assistant',
    }),
  getGoogleMeetTranscription: (googleMeetId: string) =>
    api.get(`/api/vexa/transcripts/google_meet/${googleMeetId}`),
  getTeamsTranscription: (teamsMeetingId: string) =>
    api.get(`/api/vexa/transcripts/teams/${teamsMeetingId}`),
}

/** Message to show when Vexa bot join fails. Use for Calendar and Record bot-join errors. */
export function getVexaBotJoinErrorMessage(err: unknown): string {
  const data = (err as { response?: { data?: unknown } })?.response?.data
  if (!data || typeof data !== 'object') return 'Failed to join meeting with bot'
  const detail = (data as { detail?: unknown }).detail
  const msg =
    typeof detail === 'string'
      ? detail
      : detail && typeof detail === 'object' && 'detail' in detail
        ? String((detail as { detail: string }).detail)
        : ''
  if (/already exists|active or requested meeting/i.test(msg)) return 'Your bot has already joined the meeting'
  return msg || 'Failed to join meeting with bot'
}

// ============================================
// To-Do Ready API (Unified task management)
// ============================================

export type TodoSource = 'email' | 'meeting' | 'manual'
export type TodoStatus = 'ready' | 'needs_input' | 'overdue' | 'done'
export type TodoPriority = 'high' | 'medium' | 'low'
export type TodoTaskType =
  | 'send_integration_doc'
  | 'respond_to_email'
  | 'handle_pricing_objection'
  | 'competitive_followup'
  | 'schedule_demo'
  | 'send_case_study'
  | 'general_followup'

export interface DealIntelligence {
  company_name: string
  company_id?: string | null
  deal_id?: string | null
  deal_stage?: string | null
  last_call_sentiment?: string | null
  last_objection?: string | null
  competitor_mentioned?: string | null
}

export interface ThreadMessage {
  id: string
  role: 'prospect' | 'sales'
  sender_name: string
  content: string
  timestamp: string
}

export interface InteractionHistoryItem {
  type: 'email' | 'call' | 'meeting'
  time_ago: string
  summary: string
}

export type DraftTone = 'professional' | 'warm' | 'direct'

export interface ToneDrafts {
  professional?: string | null
  warm?: string | null
  direct?: string | null
}

export interface PreparedAction {
  strategy_label: string
  explanation: string
  draft_text: string
  variants?: string[] | null
  tone_drafts?: ToneDrafts | null
}

/** Recommended next step type (PRD multi-path). */
export type NextStepType =
  | 'send_email'
  | 'make_call'
  | 'share_case_study'
  | 'escalate_technical_validation'
  | 'schedule_followup_call'

export interface AlternativeAction {
  action_type: string
  label: string
  confidence: number
}

export interface TaskStrategy {
  recommended_next_step_type: string
  recommended_next_step_label?: string | null
  objective?: string | null
  key_topics?: string[] | null
  strategic_reasoning?: string | null
  decision_factors?: string[] | null
  alternative_actions?: AlternativeAction[] | null
  confidence?: number | null
}

/** Intent category for a todo (from email/meeting analysis). */
export type IntentCategory =
  | 'interested'
  | 'not_interested'
  | 'do_not_contact'
  | 'not_now'
  | 'forwarded'
  | 'meeting_intent'
  | 'non_in_target'

export interface TodoItem {
  id: string
  user_id: string
  title: string
  description?: string | null
  task_type: TodoTaskType
  priority: TodoPriority
  status: TodoStatus
  due_at?: string | null
  assignee?: string | null
  source: TodoSource
  source_id?: string | null
  deal_intelligence?: DealIntelligence | null
  thread_id?: string | null
  prepared_action?: PreparedAction | null
  task_strategy?: TaskStrategy | null
  intent_category?: IntentCategory | null
  reviewed_at?: string | null
  interaction_summary?: string | null
  interaction_history?: InteractionHistoryItem[] | null
  triggered_from?: string | null
  attention_required?: boolean
  risk_label?: string | null
  created_at: string
  updated_at: string
}

export interface TodoListResponse {
  items: TodoItem[]
  total: number
  page: number
  limit: number
}

export type MemorySignalType = 'sla_breach' | 'promise_pending' | 'objection_unhandled' | 'followup_overdue'

export interface MemorySignal {
  id: string
  type: MemorySignalType
  label: string
  task_id: string
  severity: 'warning' | 'critical'
  detected_at: string
}

export interface MemorySignalsResponse {
  signals: MemorySignal[]
  total: number
}

export interface AnalyzeResponse {
  success: boolean
  new_todos_created: number
  emails_analyzed: number
  meetings_analyzed: number
  message: string
  gmail_auth_error?: boolean
  needs_reauthorization?: boolean
}

export interface AnalysisState {
  email: {
    analyzed_count: number
    last_analysis_at: string | null
  }
  meeting: {
    analyzed_count: number
    last_analysis_at: string | null
  }
}

export const todoReadyAPI = {
  /** List todo items with optional filters */
  listItems: (params?: { status?: TodoStatus; source?: TodoSource; priority?: TodoPriority; unreviewed_only?: boolean; search?: string; sentiment?: IntentCategory; page?: number; limit?: number }) =>
    api.get<TodoListResponse>('/api/todo-ready/items', { params }),

  /** Get a single todo item by ID */
  getItem: (id: string) =>
    api.get<TodoItem>(`/api/todo-ready/items/${id}`),

  /** Create a new todo item */
  createItem: (data: {
    title: string
    description?: string
    task_type?: TodoTaskType
    priority?: TodoPriority
    status?: TodoStatus
    due_at?: string
    assignee?: string
    source?: TodoSource
    source_id?: string
    deal_intelligence?: DealIntelligence
    prepared_action?: PreparedAction
  }) => api.post<TodoItem>('/api/todo-ready/items', data),

  /** Update a todo item */
  updateItem: (id: string, data: {
    title?: string
    description?: string
    status?: TodoStatus
    priority?: TodoPriority
    due_at?: string
    prepared_action?: PreparedAction
    intent_category?: IntentCategory
    reviewed_at?: string | null
    task_strategy?: TaskStrategy | null
  }) => api.patch<TodoItem>(`/api/todo-ready/items/${id}`, data),

  /** Run AI to set intent_category if missing; returns updated item */
  analyzeIntent: (itemId: string) =>
    api.post<TodoItem>(`/api/todo-ready/items/${itemId}/analyze-intent`),

  /** Generate strategy (objective, key topics, reasoning, alternatives); returns updated item */
  generateStrategy: (itemId: string) =>
    api.post<TodoItem>(`/api/todo-ready/items/${itemId}/generate-strategy`),

  /** Ensure item has intent + strategy; runs analysis if incomplete. Call when user opens item. */
  ensureAnalyzed: (itemId: string) =>
    api.post<TodoItem>(`/api/todo-ready/items/${itemId}/ensure-analyzed`),

  /** Generate draft script from strategy key_topics; returns updated item */
  suggestScript: (itemId: string) =>
    api.post<TodoItem>(`/api/todo-ready/items/${itemId}/suggest-script`),

  /** Delete a todo item */
  deleteItem: (id: string) =>
    api.delete<{ success: boolean; deleted_id: string }>(`/api/todo-ready/items/${id}`),

  /** Mark a todo item as complete */
  completeItem: (id: string) =>
    api.post<TodoItem>(`/api/todo-ready/items/${id}/complete`),

  /** Get memory signals (reminders) */
  getMemorySignals: () =>
    api.get<MemorySignalsResponse>('/api/todo-ready/memory-signals'),

  /** Analyze new emails and meetings to create todo items */
  analyze: () =>
    api.post<AnalyzeResponse>('/api/todo-ready/analyze'),

  /** Get analysis state (which items have been analyzed) */
  getAnalysisState: () =>
    api.get<AnalysisState>('/api/todo-ready/analysis-state'),

  /** Reset analysis state to re-analyze */
  resetAnalysis: (source?: 'email' | 'meeting' | 'all') =>
    api.post<{ success: boolean; reset: string }>('/api/todo-ready/reset-analysis', null, { params: { source: source ?? 'all' } }),

  /** Get source content for a task (email body or meeting transcript) */
  getSourceContent: (taskId: string) =>
    api.get<TaskSourceContent>(`/api/todo-ready/items/${taskId}/source-content`),

  /** Send email for a task (optionally with edited draft text) */
  sendEmail: (taskId: string, draftText?: string) =>
    api.post<SendEmailResponse>(`/api/todo-ready/items/${taskId}/send-email`, draftText ? { draft_text: draftText } : undefined),

  /** Check if Gmail has send permission */
  checkGmailSendStatus: () =>
    api.get<GmailSendStatusResponse>('/api/todo-ready/gmail-send-status'),

  /** Resolve/complete an action (PRD: PATCH /api/actions/:id/resolve) */
  resolveItem: (id: string) =>
    api.patch<TodoItem>(`/api/todo-ready/items/${id}/resolve`),

  /** Get AI draft for a specific tone */
  getDraft: (id: string, tone?: DraftTone) =>
    api.get<{ draft: string; tone: string }>(`/api/todo-ready/items/${id}/draft`, { params: { tone } }),

  /** Ingest raw email for signal extraction */
  ingestEmail: (data: { subject?: string; body: string; from?: string; to?: string }) =>
    api.post<TodoItem>('/api/todo-ready/ingest/email', data),

  /** Schedule action (meeting/call) */
  scheduleAction: (id: string, data?: { proposed_times?: string[] }) =>
    api.post<TodoItem>(`/api/todo-ready/items/${id}/schedule`, data),
}

// Send email response
export interface SendEmailResponse {
  success: boolean
  message?: string
  message_id?: string
  thread_id?: string
  needs_reauthorization?: boolean
  auth_url?: string
}

// Gmail send status response
export interface GmailSendStatusResponse {
  can_send: boolean
  needs_reauthorization: boolean
  auth_url?: string
  message?: string
}

// Task source content types
export interface EmailSourceContent {
  id: string
  subject: string
  from: string
  to: string
  date: string | null
  body: string
  snippet: string
}

export interface MeetingSourceContent {
  id: string
  title: string
  created_at: string | null
  platform: string
  transcript: string | null
  summary: string | null
  next_steps: Array<{ description: string; assignee?: string }> | null
  questions_and_objections: Array<{ question: string; answer?: string }> | null
}

export interface TaskSourceContent {
  type: 'email' | 'meeting' | 'manual'
  content: EmailSourceContent | MeetingSourceContent | null
  message?: string
}

// ============================================================================
// Enablement Feedback API (Cross-meeting, longitudinal feedback)
// ============================================================================

export type FeedbackType = 'observation' | 'risk_signal' | 'improvement'
export type FeedbackTheme = 'communication' | 'discovery' | 'objection_handling' | 'closing' | 'pacing' | 'engagement'

export interface FeedbackEvidence {
  calls_analyzed: number
  calls_below_threshold?: number
  calls_above_threshold?: number
  metric_average?: number
  metric_median?: number
}

export interface EnablementFeedbackCard {
  id: string
  type: FeedbackType
  theme: FeedbackTheme
  title: string
  description: string
  evidence: FeedbackEvidence
  confidence: number
  suggestions: string[]
  priority: number
}

export interface EnablementFeedbackResponse {
  user_id: string
  analyzed_from: string
  analyzed_to: string
  total_calls_analyzed: number
  analysis_window_days: number
  observations: EnablementFeedbackCard[]
  risk_signals: EnablementFeedbackCard[]
  improvements: EnablementFeedbackCard[]
  overall_quality_trend?: 'improving' | 'stable' | 'declining' | null
  top_strength?: string | null
  top_opportunity?: string | null
  generated_at: string
}

export const enablementAPI = {
  /** Get enablement feedback (cross-meeting, longitudinal insights) */
  getFeedback: (params?: {
    days?: number
    min_calls?: number
    force_refresh?: boolean
  }) =>
    api.get<EnablementFeedbackResponse>('/api/enablement/enablement-feedback', { params }),

  /** Extract metrics for a specific meeting */
  extractMetrics: (meetingId: string) =>
    api.post<{ message: string; meeting_id: string; metrics: any }>(
      `/api/enablement/enablement-feedback/extract-metrics/${meetingId}`
    ),

  /** Backfill metrics for all meetings in time window */
  backfillMetrics: (params?: { days?: number }) =>
    api.post<{ message: string; success_count: number; error_count: number; errors: any[] }>(
      '/api/enablement/enablement-feedback/backfill',
      null,
      { params }
    ),
}