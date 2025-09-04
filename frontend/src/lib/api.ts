import axios from 'axios'

const API_URL = (import.meta as any).env?.VITE_API_URL || 'https://4skale.com'
//'http://localhost:8000'


export const api = axios.create({
  baseURL: API_URL,
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
    api.post('/api/auth/login', credentials),
  register: (userData: any) => api.post('/api/auth/register', userData),
  forgotPassword: (email: string) =>
    api.post('/api/auth/forgot-password', { email }),
  resetPassword: (token: string, newPassword: string) =>
    api.post('/api/auth/reset-password', { token, new_password: newPassword }),
  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/api/auth/change-password', data),
  acceptTerms: () => api.post('/api/auth/accept-terms'),
  gdprConsent: () => api.post('/api/auth/gdpr-consent'),
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