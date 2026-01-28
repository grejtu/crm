import axios from 'axios'
import type {
  User,
  Lead,
  LeadHistory,
  PipelineData,
  BidderPipelineData,
  ResignedLeadsData,
  ManagerDashboard,
  UserDashboard,
  CSVPreview,
  CSVImportResult,
  LeadStatus,
  ResignationStatus,
  BiddingStatus,
} from '../types'

const api = axios.create({
  baseURL: 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle auth errors
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

// Auth
export const authApi = {
  login: async (email: string, password: string) => {
    const { data } = await api.post<{ token: string; user: User }>('/auth/login', {
      email,
      password,
    })
    return data
  },
  logout: async () => {
    await api.post('/auth/logout')
  },
  me: async () => {
    const { data } = await api.get<User>('/auth/me')
    return data
  },
}

// Users (Manager)
export const usersApi = {
  getAll: async () => {
    const { data } = await api.get<User[]>('/manager/users')
    return data
  },
  create: async (userData: { email: string; password: string; name: string; role: string }) => {
    const { data } = await api.post<User>('/manager/users/create', userData)
    return data
  },
  update: async (
    userId: number,
    userData: Partial<{ email: string; password: string; name: string; role: string; is_active: boolean }>
  ) => {
    const { data } = await api.put<User>(`/manager/users/${userId}`, userData)
    return data
  },
  delete: async (userId: number) => {
    await api.delete(`/manager/users/${userId}`)
  },
}

// Leads
export const leadsApi = {
  getAll: async (viewMode: 'my' | 'all' = 'my', status?: LeadStatus, assignedUserId?: number) => {
    const params = new URLSearchParams({ view_mode: viewMode })
    if (status) params.append('status', status)
    if (assignedUserId) params.append('assigned_user_id', String(assignedUserId))
    const { data } = await api.get<Lead[]>(`/leads?${params}`)
    return data
  },
  getById: async (id: number) => {
    const { data } = await api.get<Lead>(`/leads/${id}`)
    return data
  },
  create: async (leadData: Partial<Lead>) => {
    const { data } = await api.post<Lead>('/leads', leadData)
    return data
  },
  update: async (id: number, leadData: Partial<Lead>) => {
    const { data } = await api.put<Lead>(`/leads/${id}`, leadData)
    return data
  },
  move: async (id: number, newStatus: LeadStatus) => {
    const { data } = await api.post(`/leads/${id}/move`, { new_status: newStatus })
    return data
  },
  resign: async (id: number, resignationStatus: ResignationStatus) => {
    const { data } = await api.post(`/leads/${id}/resign`, { resignation_status: resignationStatus })
    return data
  },
  restore: async (id: number) => {
    const { data } = await api.post(`/leads/${id}/restore`)
    return data
  },
  getHistory: async (id: number) => {
    const { data } = await api.get<LeadHistory[]>(`/leads/${id}/history`)
    return data
  },
  search: async (phone?: string, email?: string) => {
    const params = new URLSearchParams()
    if (phone) params.append('phone', phone)
    if (email) params.append('email', email)
    const { data } = await api.get<Lead[]>(`/leads/search?${params}`)
    return data
  },
  getByDate: async (filter: 'today' | 'overdue' | 'upcoming', userId?: number) => {
    const params = new URLSearchParams({ filter })
    if (userId) params.append('user_id', String(userId))
    const { data } = await api.get<Lead[]>(`/leads/by-date?${params}`)
    return data
  },
  getResigned: async (userId?: number) => {
    const params = userId ? `?user_id=${userId}` : ''
    const { data } = await api.get<ResignedLeadsData>(`/leads/resigned${params}`)
    return data
  },
}

// Pipeline
export const pipelineApi = {
  get: async (userId?: number) => {
    const params = userId ? `?user_id=${userId}` : ''
    const { data } = await api.get<PipelineData>(`/pipeline${params}`)
    return data
  },
}

// Bidder
export const bidderApi = {
  getPipeline: async () => {
    const { data } = await api.get<BidderPipelineData>('/bidder/pipeline')
    return data
  },
  updateStatus: async (leadId: number, biddingStatus: BiddingStatus) => {
    const { data } = await api.post(`/bidder/leads/${leadId}/update-status`, {
      bidding_status: biddingStatus,
    })
    return data
  },
  updateLead: async (leadId: number, updateData: { bidding_status?: BiddingStatus; final_budget?: number; notes?: string }) => {
    const { data } = await api.put(`/bidder/leads/${leadId}`, updateData)
    return data
  },
}

// Dashboard & Stats
export const dashboardApi = {
  getManagerDashboard: async () => {
    const { data } = await api.get<ManagerDashboard>('/manager/dashboard')
    return data
  },
  getUserDashboard: async () => {
    const { data } = await api.get<UserDashboard>('/user/dashboard')
    return data
  },
  getUserLeads: async (userId: number) => {
    const { data } = await api.get(`/manager/users/${userId}/leads`)
    return data
  },
}

// CSV Import
export const importApi = {
  preview: async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<CSVPreview>('/leads/import/preview', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
  execute: async (file: File, mapping: Record<string, string>) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('mapping', JSON.stringify(mapping))
    const { data } = await api.post<CSVImportResult>('/leads/import/execute', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}

// Stats (alias for dashboard)
export const statsApi = dashboardApi

export default api
