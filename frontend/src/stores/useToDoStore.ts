import { create } from 'zustand'

/** Primary nav: Inbox, Needs Input, Overdue, Complete */
export type TodoViewTab = 'inbox' | 'needs_input' | 'overdue' | 'completed'
/** Category filter by intent */
export type TodoCategoryFilter = 'all' | 'no_categories' | string

export type DateRangeOption = 'today' | 'week' | 'custom'

interface ToDoState {
  selectedTaskId: string | null
  filters: { prospect?: string }
  /** Inbox | Needs Input | Overdue | Complete */
  activeTab: TodoViewTab
  /** Categories: All, No categories, or intent_category value */
  categoryFilter: TodoCategoryFilter
  dateRange: DateRangeOption
  customDateFrom: string | null
  customDateTo: string | null
  setSelectedTaskId: (id: string | null) => void
  setFilters: (f: Partial<ToDoState['filters']>) => void
  setActiveTab: (tab: TodoViewTab) => void
  setCategoryFilter: (category: TodoCategoryFilter) => void
  setDateRange: (range: DateRangeOption) => void
  setCustomDates: (from: string | null, to: string | null) => void
}

export const useToDoStore = create<ToDoState>((set) => ({
  selectedTaskId: null,
  filters: {},
  activeTab: 'inbox',
  categoryFilter: 'all',
  dateRange: 'week',
  customDateFrom: null,
  customDateTo: null,
  setSelectedTaskId: (selectedTaskId) => set({ selectedTaskId }),
  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  setActiveTab: (activeTab) => set({ activeTab }),
  setCategoryFilter: (categoryFilter) => set({ categoryFilter }),
  setDateRange: (dateRange) => set({ dateRange }),
  setCustomDates: (customDateFrom, customDateTo) => set({ customDateFrom, customDateTo }),
}))
