"use client"

import { use } from "react"

export default function RunDetailPage({
  params
}: {
  params: Promise<{
    locale: string
    connectionId: string
    serviceId: string
    pipelineId: string
    taskId: string
    runId: string
  }>
}) {
  const { serviceId, pipelineId, taskId, runId } = use(params)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Run: {runId}</h1>
        <p className="text-muted-foreground mt-2">
          Task: {taskId} | Pipeline: {pipelineId} | Service: {serviceId}
        </p>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Execution Details</h2>
        <p className="text-muted-foreground text-sm">
          View logs, execution status, duration, and detailed run information here.
        </p>
        {/* Run logs, status, execution details will go here */}
      </div>
    </div>
  )
}
