import { useEffect } from 'react'
import { useSecondarySidebarStore } from '@/store/sidebar-store'

interface SecondarySidebarItem {
  id: string
  name: string
  description?: string
  status?: string
  [key: string]: any
}

interface UseSecondarySidebarOptions {
  title: string
  items: SecondarySidebarItem[]
  isLoading?: boolean
  context: 'services' | 'pipelines' | 'tasks' | 'runs'
}

/**
 * Hook to manage the secondary sidebar from detail pages
 * Call this hook from any page component to populate the secondary sidebar
 */
export function useSecondarySidebar({
  title,
  items,
  isLoading = false,
  context,
}: UseSecondarySidebarOptions) {
  const { setItems, setLoading, setContext, setTitle, clearSidebar } = useSecondarySidebarStore()

  useEffect(() => {
    setTitle(title)
    setContext(context)
    setItems(items)
    setLoading(isLoading)

    // Cleanup on unmount
    return () => {
      clearSidebar()
    }
  }, [title, items, isLoading, context, setItems, setLoading, setContext, setTitle, clearSidebar])
}
