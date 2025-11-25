import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, CheckCircle2, Clock, XCircle, TrendingUp, Zap } from 'lucide-react';

export default function OverviewPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard Overview</h1>
          <p className="text-muted-foreground">
            Monitor your task orchestration and pipeline execution
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">24</div>
              <p className="text-xs text-muted-foreground">
                +3 from last hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,249</div>
              <p className="text-xs text-muted-foreground">
                +18% from last hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12</div>
              <p className="text-xs text-muted-foreground">
                -2% from last hour
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.4s</div>
              <p className="text-xs text-muted-foreground">
                -0.3s from last hour
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent Pipelines</CardTitle>
              <CardDescription>Latest pipeline executions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'user-onboarding', status: 'completed', time: '2m ago' },
                  { name: 'payment-processing', status: 'running', time: '5m ago' },
                  { name: 'data-sync', status: 'completed', time: '8m ago' },
                  { name: 'email-campaign', status: 'failed', time: '12m ago' },
                ].map((pipeline, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Zap className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{pipeline.name}</p>
                        <p className="text-xs text-muted-foreground">{pipeline.time}</p>
                      </div>
                    </div>
                    <Badge
                      variant={
                        pipeline.status === 'completed'
                          ? 'success'
                          : pipeline.status === 'failed'
                          ? 'destructive'
                          : 'default'
                      }
                    >
                      {pipeline.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Workers</CardTitle>
              <CardDescription>Connected task workers</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'worker-01', tasks: 5, uptime: '12h' },
                  { name: 'worker-02', tasks: 3, uptime: '8h' },
                  { name: 'worker-03', tasks: 7, uptime: '24h' },
                  { name: 'worker-04', tasks: 2, uptime: '6h' },
                ].map((worker, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <TrendingUp className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{worker.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {worker.tasks} tasks • Uptime: {worker.uptime}
                        </p>
                      </div>
                    </div>
                    <Badge variant="success">online</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
