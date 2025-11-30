"use client"

import Link from "next/link"
import { use, useEffect, useState } from "react"
import { useBreadcrumbs } from "@/hooks/useBreadcrumbs"
import { useSecondarySidebar } from "@/hooks/useSecondarySidebar"

export default function ServiceDetailPage({
  params
}: {
  params: Promise<{ locale: string; serviceId: string }>
}) {
  const { locale, serviceId } = use(params)
  const [pipelines, setPipelines] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  // Set breadcrumbs for this page
  useBreadcrumbs([
    { label: 'Home', href: `/${locale}` },
    { label: 'Services', href: `/${locale}/services` },
    { label: serviceId }
  ])

  // Fetch pipelines for this service
  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setPipelines([
        { id: 'pipeline-1', name: 'Data Pipeline 1', description: 'Processes customer data', status: 'running' },
        { id: 'pipeline-2', name: 'Analytics Pipeline', description: 'Generates reports', status: 'idle' },
        { id: 'pipeline-3', name: 'ETL Pipeline', description: 'Extract, transform, load', status: 'running' },
      ])
      setIsLoading(false)
    }, 500)
  }, [serviceId])

  // Populate secondary sidebar with pipelines
  useSecondarySidebar({
    title: 'Pipelines',
    items: pipelines,
    isLoading,
    context: 'pipelines'
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Service: {serviceId}</h1>
        <p className="text-muted-foreground mt-2">Service overview, metrics, and configuration</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/${locale}/services/${serviceId}/pipelines`}
          className="border rounded-lg p-4 hover:bg-accent transition-colors"
        >
          <h3 className="font-semibold">View Pipelines</h3>
          <p className="text-sm text-muted-foreground mt-1">Browse all pipelines in this service</p>
        </Link>

        {/* Service metrics, stats, etc. can go here */}
      </div>
    </div>
  )
}
