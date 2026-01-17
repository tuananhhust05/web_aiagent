import axios from 'axios'

// const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://forskale.com'
// const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://forskale.com:8000'
// const API_URL = 'https://forskale.com:8000'

// Ensure API URL uses HTTPS when in production
const getApiUrl = () => {
  const url = (import.meta as any).env?.VITE_API_URL || 'https://forskale.com'
  // const url = 'http://localhost:8000'
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
  // Google OAuth
  getGoogleAuthUrl: () => api.get('/auth/google/login'),
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
}

// Calls API
export const callsAPI = {
  getCalls: (params?: any) => api.get('/api/calls', { params }),
  getCall: (id: string) => api.get(`/api/calls/${id}`),
  createCall: (data: any) => api.post('/api/calls', data),
  updateCall: (id: string, data: any) => api.put(`/api/calls/${id}`, data),
  updateCallByPhone: (phoneNumber: string, data: any) => api.put(`/api/calls/update-by-phone/${phoneNumber}`, data),
  autoUpdateCallByPhone: (phoneNumber: string, data: any) => api.put(`/api/calls/auto-update/${phoneNumber}`, data),
  autoUpdateLatestCall: (data: any) => api.put('/api/calls/auto-update-latest', data),
  deleteCall: (id: string) => api.delete(`/api/calls/${id}`),
  getKPISummary: (params?: any) => api.get('/api/calls/kpis/summary', { params }),
  getSentimentStats: (params?: any) => api.get('/api/calls/stats/sentiment', { params }),
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

  // Analyze conversation with AI Sales Coach
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

  // Chat with AI Sales Coach
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
// Gmail API
export const gmailAPI = {
  getLatestEmails: (maxResults: number = 10, query?: string) =>
    api.get('/api/gmail/latest', { params: { max_results: maxResults, query } }),
  getStatus: () => api.get('/api/gmail/status'),
  getReauthorizeUrl: () => api.get('/api/gmail/reauthorize'),
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