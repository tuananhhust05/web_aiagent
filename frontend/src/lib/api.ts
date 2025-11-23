import axios from 'axios'

// const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://4skale.com'
// const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://4skale.com:8000'
// const API_URL = 'https://4skale.com:8000'

// Ensure API URL uses HTTPS when in production
const getApiUrl = () => {
  const url = (import.meta as any).env?.VITE_API_URL || 'https://4skale.com'
  // const url = 'http://localhost:8000'
  // If we're on HTTPS and the API URL is HTTP, convert to HTTPS
  if (window.location.protocol === 'https:' && url.startsWith('http://')) {
    return url.replace('http://', 'https://')
  }
  return url
}

const FINAL_API_URL = getApiUrl()

// Debug log
console.log('🔧 API Configuration:', {
  originalUrl: (import.meta as any).env?.VITE_API_URL || 'https://4skale.com',
  finalUrl: FINAL_API_URL,
  protocol: window.location.protocol
})

export const api = axios.create({
  baseURL: FINAL_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
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
}

// Inbox API
export const inboxAPI = {
  // Receive inbox response (public endpoint)
  receiveResponse: (data: {
    platform: string
    contact: string
    content: string
  }) => api.post('/api/inbox/receive', data),
  
  // Get responses by campaign (requires auth)
  getResponsesByCampaign: (campaignId: string, params?: { limit?: number; skip?: number }) => 
    api.get(`/api/inbox/by-campaign/${campaignId}`, { params }),
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
};

// Deals API
export const dealsAPI = {
  // Get deals with pagination and filtering
  getDeals: (params?: {
    page?: number;
    limit?: number;
    status?: 'new' | 'contacted' | 'negotiation';
    search?: string;
  }) => api.get('/api/deals/all', { params }),
  
  // Get deal by ID
  getDeal: (dealId: string) => api.get(`/api/deals/${dealId}`),
  
  // Create new deal
  createDeal: (data: {
    name: string;
    description?: string;
    contact_id: string;
    campaign_id?: string;
    start_date?: string;
    end_date?: string;
    status: 'new' | 'contacted' | 'negotiation';
    cost: number;
    revenue: number;
  }) => api.post('/api/deals/create', data),
  
  // Update deal
  updateDeal: (dealId: string, data: {
    name?: string;
    description?: string;
    contact_id?: string;
    campaign_id?: string;
    start_date?: string;
    end_date?: string;
    status?: 'new' | 'contacted' | 'negotiation';
    cost?: number;
    revenue?: number;
  }) => api.put(`/api/deals/${dealId}`, data),
  
  // Delete deal
  deleteDeal: (dealId: string) => api.delete(`/api/deals/${dealId}`),
  
  // Get deal statistics
  getStats: () => api.get('/api/deals/stats'),
  
  // Get contacts for deal creation
  getContacts: (search?: string) => api.get('/api/contacts', { params: { search } }),
  
  // Get campaigns for deal creation
  getCampaigns: () => api.get('/api/deals/campaigns/list'),
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
export const workflowsAPI = {
  // Get workflow by function
  getWorkflow: (functionName: string) => api.get('/api/workflows', { params: { function: functionName } }),
  
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
}