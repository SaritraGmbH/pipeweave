"use client"

import Link from "next/link"
import { use } from "react"

export default function ServiceDetailPage({
  params
}: {
  params: Promise<{ locale: string; connectionId: string; serviceId: string }>
}) {
  const { locale, connectionId, serviceId } = use(params)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Service: {serviceId}</h1>
        <p className="text-muted-foreground mt-2">Service overview, metrics, and configuration</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/${locale}/${connectionId}/${serviceId}/pipelines`}
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
