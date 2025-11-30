"use client"

import Link from "next/link"
import { use } from "react"

export default function PipelineTasksPage({
  params
}: {
  params: Promise<{ locale: string; connectionId: string; serviceId: string; pipelineId: string }>
}) {
  const { locale, connectionId, serviceId, pipelineId } = use(params)

  // Sample data - replace with real data fetching
  const sampleTasks = [
    { id: "extract-task", name: "Extract Data", status: "completed" },
    { id: "transform-task", name: "Transform Data", status: "running" },
    { id: "load-task", name: "Load Data", status: "pending" },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tasks in {pipelineId}</h1>
        <p className="text-muted-foreground mt-2">Service: {serviceId}</p>
      </div>

      <div className="grid gap-4">
        {sampleTasks.map((task) => (
          <Link
            key={task.id}
            href={`/${locale}/${connectionId}/${serviceId}/${pipelineId}/${task.id}`}
            className="border rounded-lg p-4 hover:bg-accent transition-colors"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{task.name}</h3>
              <span className="text-sm text-muted-foreground">{task.status}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
