"use client"

import { use } from "react"

export default function TaskDetailPage({
  params
}: {
  params: Promise<{
    locale: string
    connectionId: string
    serviceId: string
    pipelineId: string
    taskId: string
  }>
}) {
  const { serviceId, pipelineId, taskId } = use(params)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Task: {taskId}</h1>
        <p className="text-muted-foreground mt-2">
          Pipeline: {pipelineId} | Service: {serviceId}
        </p>
      </div>

      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Recent Runs</h2>
        <p className="text-muted-foreground text-sm">
          Task runs will appear in the secondary sidebar. Configure task settings, view execution history, and monitor performance metrics here.
        </p>
        {/* Task configuration, runs history, metrics will go here */}
      </div>
    </div>
  )
}
