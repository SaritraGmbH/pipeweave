"use client"

import Link from "next/link"
import { use } from "react"

export default function PipelineDetailPage({
  params
}: {
  params: Promise<{ locale: string; connectionId: string; serviceId: string; pipelineId: string }>
}) {
  const { locale, connectionId, serviceId, pipelineId } = use(params)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pipeline: {pipelineId}</h1>
        <p className="text-muted-foreground mt-2">Service: {serviceId}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link
          href={`/${locale}/${connectionId}/${serviceId}/${pipelineId}/tasks`}
          className="border rounded-lg p-4 hover:bg-accent transition-colors"
        >
          <h3 className="font-semibold">View Tasks</h3>
          <p className="text-sm text-muted-foreground mt-1">Browse all tasks in this pipeline</p>
        </Link>

        {/* Pipeline metrics, configuration, etc. can go here */}
      </div>
    </div>
  )
}
