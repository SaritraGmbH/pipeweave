import { useEffect } from 'react'
import { useBreadcrumbStore, type BreadcrumbItem } from '@/store/breadcrumb-store'

/**
 * Hook to manage breadcrumbs from page components
 * Call this hook from any page component to set the breadcrumbs
 *
 * @example
 * ```tsx
 * useBreadcrumbs([
 *   { label: 'Home', href: '/en/conn-1' },
 *   { label: 'Services', href: '/en/conn-1/services' },
 *   { label: 'my-service' }
 * ])
 * ```
 */
export function useBreadcrumbs(breadcrumbs: BreadcrumbItem[]) {
  const { setBreadcrumbs, clearBreadcrumbs } = useBreadcrumbStore()

  useEffect(() => {
    setBreadcrumbs(breadcrumbs)

    // Cleanup on unmount
    return () => {
      clearBreadcrumbs()
    }
  }, [breadcrumbs, setBreadcrumbs, clearBreadcrumbs])
}
