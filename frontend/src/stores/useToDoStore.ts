import { create } from 'zustand'

export type TodoActiveTab = 'ready' | 'needs_input' | 'overdue' | 'completed'
export type DateRangeOption = 'today' | 'week' | 'custom'

interface ToDoState {
  selectedTaskId: string | null
  filters: { prospect?: string }
  activeTab: TodoActiveTab
  dateRange: DateRangeOption
  customDateFrom: string | null
  customDateTo: string | null
  setSelectedTaskId: (id: string | null) => void
  setFilters: (f: Partial<ToDoState['filters']>) => void
  setActiveTab: (tab: TodoActiveTab) => void
  setDateRange: (range: DateRangeOption) => void
  setCustomDates: (from: string | null, to: string | null) => void
}

export const useToDoStore = create<ToDoState>((set) => ({
  selectedTaskId: null,
  filters: {},
  activeTab: 'ready',
  dateRange: 'week',
  customDateFrom: null,
  customDateTo: null,
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setDateRange: (dateRange) => set({ dateRange }),
  setCustomDates: (customDateFrom, customDateTo) => set({ customDateFrom, customDateTo }),
}))
