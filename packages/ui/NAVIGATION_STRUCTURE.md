# Navigation Structure

## URL Hierarchy

The application uses a flattened URL structure where each resource type is nested under its own path:

```
/[locale]/services                              # All services list
/[locale]/services/[serviceId]                  # Service detail
/[locale]/services/[serviceId]/pipelines        # Pipelines for a service
/[locale]/services/[serviceId]/pipelines/[pipelineId]  # Pipeline detail
/[locale]/services/[serviceId]/pipelines/[pipelineId]/tasks  # Tasks for a pipeline
/[locale]/services/[serviceId]/pipelines/[pipelineId]/tasks/[taskId]  # Task detail
/[locale]/services/[serviceId]/pipelines/[pipelineId]/tasks/[taskId]/runs/[runId]  # Run detail

/[locale]/pipelines                             # All pipelines list (across all services)
/[locale]/tasks                                 # All tasks list (across all services)
/[locale]/runs                                  # All runs list (across all services)
```

## Breadcrumb Management

Breadcrumbs are managed through Zustand state, not derived from the URL. Each page is responsible for setting its own breadcrumbs using the `useBreadcrumbs` hook.

### Usage Example

```tsx
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs"

export default function ServiceDetailPage({ params }) {
  const { locale, serviceId } = use(params)

  useBreadcrumbs([
    { label: 'Home', href: `/${locale}` },
    { label: 'Services', href: `/${locale}/services` },
    { label: serviceId }  // Current page - no href
  ])

  return <div>...</div>
}
```

**Key Points:**
- Last breadcrumb item should not have an `href` (it's the current page)
- All other items should have an `href` for navigation
- Breadcrumbs are automatically cleared when the component unmounts

## Secondary Sidebar Management

The secondary sidebar is managed through the `useSecondarySidebar` hook. Each detail page controls what appears in the sidebar.

### Usage Example

```tsx
import { useSecondarySidebar } from "@/hooks/useSecondarySidebar"

export default function ServiceDetailPage({ params }) {
  const { locale, serviceId } = use(params)
  const [pipelines, setPipelines] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch data for sidebar
  useEffect(() => {
    fetchPipelines(serviceId).then(data => {
      setPipelines(data)
      setIsLoading(false)
    })
  }, [serviceId])

  // Populate secondary sidebar
  useSecondarySidebar({
    title: 'Pipelines',
    items: pipelines,
    isLoading,
    context: 'pipelines'
  })

  return <div>...</div>
}
```

**Key Points:**
- Each detail page decides what to show in the sidebar
- The sidebar shows child resources (e.g., service page shows pipelines, pipeline page shows tasks)
- The sidebar automatically clears when the component unmounts
- Pages that don't call `useSecondarySidebar` won't show a secondary sidebar

## Page Hierarchy Pattern

### List Pages
- Don't set secondary sidebar (it will be hidden)
- Set breadcrumbs to show current location

### Detail Pages
- Set breadcrumbs to show full navigation path
- Set secondary sidebar to show child resources
- Fetch and display the child resources that will appear in the sidebar

## Example: Complete Service Detail Page

```tsx
"use client"

import { use, useEffect, useState } from "react"
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs"
import { useSecondarySidebar } from "@/hooks/useSecondarySidebar"

export default function ServiceDetailPage({ params }) {
  const { locale, serviceId } = use(params)
  const [pipelines, setPipelines] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Set breadcrumbs
  useBreadcrumbs([
    { label: 'Home', href: `/${locale}` },
    { label: 'Services', href: `/${locale}/services` },
    { label: serviceId }
  ])

  // Fetch pipelines
  useEffect(() => {
    fetchPipelines(serviceId).then(data => {
      setPipelines(data)
      setIsLoading(false)
    })
  }, [serviceId])

  // Populate sidebar
  useSecondarySidebar({
    title: 'Pipelines',
    items: pipelines,
    isLoading,
    context: 'pipelines'
  })

  return (
    <div>
      <h1>Service: {serviceId}</h1>
      {/* Service content */}
    </div>
  )
}
```

## Migration Checklist

When creating or updating pages:

1. ✅ Use the flattened URL structure (e.g., `/services/[serviceId]` not `/[serviceId]`)
2. ✅ Call `useBreadcrumbs()` to set breadcrumbs
3. ✅ Call `useSecondarySidebar()` on detail pages to populate the sidebar
4. ✅ Ensure the last breadcrumb item has no `href`
5. ✅ Fetch child resources and pass them to `useSecondarySidebar()`
