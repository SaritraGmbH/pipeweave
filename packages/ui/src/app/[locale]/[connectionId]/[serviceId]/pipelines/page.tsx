"use client"

import Link from "next/link"
import { use } from "react"

export default function ServicePipelinesPage({
  params
}: {
  params: Promise<{ locale: string; connectionId: string; serviceId: string }>
}) {
  const { locale, connectionId, serviceId } = use(params)

  // Sample data - replace with real data fetching
  const samplePipelines = [
    { id: "etl-pipeline", name: "ETL Pipeline", status: "active" },
    { id: "data-sync", name: "Data Sync", status: "inactive" },
    { id: "transform-job", name: "Transform Job", status: "active" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Pipelines in {serviceId}</h1>
        <p className="text-muted-foreground mt-2">All pipelines for this service</p>
      </div>

      <div className="grid gap-4">
        {samplePipelines.map((pipeline) => (
          <Link
            key={pipeline.id}
            href={`/${locale}/${connectionId}/${serviceId}/${pipeline.id}`}
            className="border rounded-lg p-4 hover:bg-accent transition-colors"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{pipeline.name}</h3>
              <span className="text-sm text-muted-foreground">{pipeline.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
