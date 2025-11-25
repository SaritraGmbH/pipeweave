import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server, Cpu, HardDrive, Activity } from 'lucide-react';

export default function WorkersPage() {
  const workers = [
    {
      id: 'worker-01',
      serviceId: 'payment-service',
      status: 'online',
      tasks: 5,
      uptime: '12h 34m',
      cpu: '45%',
      memory: '62%',
      lastHeartbeat: '2s ago',
      version: '1.2.0',
    },
    {
      id: 'worker-02',
      serviceId: 'email-service',
      status: 'online',
      tasks: 3,
      uptime: '8h 12m',
      cpu: '32%',
      memory: '48%',
      lastHeartbeat: '1s ago',
      version: '1.2.0',
    },
    {
      id: 'worker-03',
      serviceId: 'data-sync-service',
      status: 'online',
      tasks: 7,
      uptime: '1d 2h',
      cpu: '58%',
      memory: '71%',
      lastHeartbeat: '3s ago',
      version: '1.1.5',
    },
    {
      id: 'worker-04',
      serviceId: 'analytics-service',
      status: 'offline',
      tasks: 0,
      uptime: '0m',
      cpu: '0%',
      memory: '0%',
      lastHeartbeat: '5m ago',
      version: '1.2.0',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workers</h1>
          <p className="text-muted-foreground">
            Monitor connected workers and their health status
          </p>
        </div>

        {/* Worker Stats */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workers</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workers.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online</CardTitle>
              <Activity className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workers.filter((w) => w.status === 'online').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
              <Cpu className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {workers.reduce((acc, w) => acc + w.tasks, 0)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg CPU</CardTitle>
              <HardDrive className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(
                  workers
                    .filter((w) => w.status === 'online')
                    .reduce((acc, w) => acc + parseInt(w.cpu), 0) /
                    workers.filter((w) => w.status === 'online').length
                )}
                %
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Workers List */}
        <div className="grid gap-4">
          {workers.map((worker) => (
            <Card key={worker.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-xl">{worker.id}</CardTitle>
                      <Badge
                        variant={worker.status === 'online' ? 'success' : 'destructive'}
                      >
                        {worker.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {worker.serviceId} • v{worker.version}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="text-muted-foreground">Last heartbeat</p>
                    <p className="font-medium">{worker.lastHeartbeat}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Active Tasks</p>
                    <p className="text-lg font-semibold">{worker.tasks}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Uptime</p>
                    <p className="text-lg font-semibold">{worker.uptime}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">CPU Usage</p>
                    <p className="text-lg font-semibold">{worker.cpu}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Memory</p>
                    <p className="text-lg font-semibold">{worker.memory}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
