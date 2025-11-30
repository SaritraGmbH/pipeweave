import { create } from 'zustand'

interface SecondarySidebarItem {
  id: string
  name: string
  description?: string
  status?: string
  [key: string]: any
}

interface SecondarySidebarState {
  // Current items displayed in the secondary sidebar
  items: SecondarySidebarItem[]

  // Loading state
  isLoading: boolean

  // Filter/search state
  searchQuery: string
  filterEnabled: boolean

  // Current sidebar context (what type of items are being shown)
  context: 'services' | 'pipelines' | 'tasks' | 'runs' | null

  // Title for the sidebar
  title: string

  // Actions
  setItems: (items: SecondarySidebarItem[]) => void
  setLoading: (isLoading: boolean) => void
  setSearchQuery: (query: string) => void
  setFilterEnabled: (enabled: boolean) => void
  setContext: (context: 'services' | 'pipelines' | 'tasks' | 'runs' | null) => void
  setTitle: (title: string) => void
  clearSidebar: () => void
}

export const useSecondarySidebarStore = create<SecondarySidebarState>((set) => ({
  items: [],
  isLoading: false,
  searchQuery: '',
  filterEnabled: false,
  context: null,
  title: '',

  setItems: (items) => set({ items }),
  setLoading: (isLoading) => set({ isLoading }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setFilterEnabled: (filterEnabled) => set({ filterEnabled }),
  setContext: (context) => set({ context }),
  setTitle: (title) => set({ title }),
  clearSidebar: () => set({ items: [], searchQuery: '', filterEnabled: false, context: null, title: '' }),
}))
