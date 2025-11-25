import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

export default function ActivityPage() {
  const activities = [
    {
      id: '1',
      type: 'task_completed',
      title: 'Task completed successfully',
      description: 'validate-payment completed in 2.3s',
      pipeline: 'payment-processing',
      timestamp: '2 minutes ago',
      severity: 'info',
    },
    {
      id: '2',
      type: 'worker_connected',
      title: 'Worker connected',
      description: 'worker-01 connected to orchestrator',
      timestamp: '5 minutes ago',
      severity: 'info',
    },
    {
      id: '3',
      type: 'task_failed',
      title: 'Task execution failed',
      description: 'process-webhook failed after 3 retries: Connection timeout',
      pipeline: 'data-sync',
      timestamp: '8 minutes ago',
      severity: 'error',
    },
    {
      id: '4',
      type: 'pipeline_started',
      title: 'Pipeline execution started',
      description: 'user-onboarding pipeline initiated',
      pipeline: 'user-onboarding',
      timestamp: '12 minutes ago',
      severity: 'info',
    },
    {
      id: '5',
      type: 'task_retry',
      title: 'Task retry attempted',
      description: 'update-inventory retry attempt 1/3',
      pipeline: 'data-sync',
      timestamp: '15 minutes ago',
      severity: 'warning',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'task_completed':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'task_failed':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'task_retry':
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
      default:
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">
            Real-time activity feed of all system events
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Activity</CardTitle>
              <Activity className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {activities.map((activity, index) => (
                <div key={activity.id} className="relative">
                  {index < activities.length - 1 && (
                    <div className="absolute left-[22px] top-10 h-full w-px bg-border" />
                  )}
                  <div className="flex gap-4">
                    <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-background border-2 border-border">
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 space-y-1 pt-1">
                      <div className="flex items-center justify-between">
                        <p className="font-medium">{activity.title}</p>
                        <span className="text-sm text-muted-foreground">
                          {activity.timestamp}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {activity.description}
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        {activity.pipeline && (
                          <Badge variant="outline">{activity.pipeline}</Badge>
                        )}
                        <Badge variant={getSeverityVariant(activity.severity)}>
                          {activity.severity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
