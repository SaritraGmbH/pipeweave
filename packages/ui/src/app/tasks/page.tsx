import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, CheckCircle2, XCircle, PlayCircle, Timer } from 'lucide-react';

export default function TasksPage() {
  const tasks = [
    {
      id: '1',
      name: 'validate-payment',
      pipeline: 'payment-processing',
      status: 'running',
      startedAt: '2 min ago',
      duration: '2.3s',
      retries: 0,
    },
    {
      id: '2',
      name: 'send-welcome-email',
      pipeline: 'user-onboarding',
      status: 'completed',
      startedAt: '5 min ago',
      duration: '1.8s',
      retries: 0,
    },
    {
      id: '3',
      name: 'process-webhook',
      pipeline: 'data-sync',
      status: 'failed',
      startedAt: '8 min ago',
      duration: '5.2s',
      retries: 2,
      error: 'Connection timeout',
    },
    {
      id: '4',
      name: 'generate-report',
      pipeline: 'email-campaign',
      status: 'completed',
      startedAt: '10 min ago',
      duration: '3.1s',
      retries: 0,
    },
    {
      id: '5',
      name: 'update-inventory',
      pipeline: 'data-sync',
      status: 'running',
      startedAt: '1 min ago',
      duration: '1.2s',
      retries: 0,
    },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <PlayCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'failed':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
        return 'destructive';
      case 'running':
        return 'default';
      default:
        return 'secondary';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tasks</h1>
          <p className="text-muted-foreground">
            Monitor individual task executions and their status
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running</CardTitle>
              <PlayCircle className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">45</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Timer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.6s</div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Tasks</TabsTrigger>
            <TabsTrigger value="running">Running</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="failed">Failed</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Task Executions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                          {getStatusIcon(task.status)}
                        </div>
                        <div>
                          <p className="font-medium">{task.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {task.pipeline} • Started {task.startedAt}
                          </p>
                          {task.error && (
                            <p className="text-sm text-destructive">{task.error}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">Duration</p>
                          <p className="font-medium">{task.duration}</p>
                        </div>
                        {task.retries > 0 && (
                          <Badge variant="warning">
                            {task.retries} {task.retries === 1 ? 'retry' : 'retries'}
                          </Badge>
                        )}
                        <Badge variant={getStatusVariant(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="running">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {tasks.filter((t) => t.status === 'running').length} running tasks
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {tasks.filter((t) => t.status === 'completed').length} completed tasks
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="failed">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">
                  {tasks.filter((t) => t.status === 'failed').length} failed tasks
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
