import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Play, Pause, MoreVertical } from 'lucide-react';

export default function PipelinesPage() {
  const pipelines = [
    {
      id: '1',
      name: 'user-onboarding',
      description: 'New user registration and setup workflow',
      status: 'active',
      tasks: 5,
      lastRun: '2 minutes ago',
      successRate: '98.5%',
    },
    {
      id: '2',
      name: 'payment-processing',
      description: 'Payment verification and processing pipeline',
      status: 'active',
      tasks: 8,
      lastRun: '5 minutes ago',
      successRate: '99.2%',
    },
    {
      id: '3',
      name: 'data-sync',
      description: 'Sync data across multiple services',
      status: 'paused',
      tasks: 12,
      lastRun: '1 hour ago',
      successRate: '97.8%',
    },
    {
      id: '4',
      name: 'email-campaign',
      description: 'Automated email campaign delivery',
      status: 'active',
      tasks: 6,
      lastRun: '15 minutes ago',
      successRate: '96.4%',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Pipelines</h1>
            <p className="text-muted-foreground">
              Manage and monitor your task orchestration pipelines
            </p>
          </div>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Pipeline
          </Button>
        </div>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList>
            <TabsTrigger value="all">All Pipelines</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="paused">Paused</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            <div className="grid gap-4">
              {pipelines.map((pipeline) => (
                <Card key={pipeline.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl">{pipeline.name}</CardTitle>
                          <Badge
                            variant={pipeline.status === 'active' ? 'success' : 'secondary'}
                          >
                            {pipeline.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {pipeline.description}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon">
                          {pipeline.status === 'active' ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Tasks</p>
                        <p className="font-medium">{pipeline.tasks}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Last Run</p>
                        <p className="font-medium">{pipeline.lastRun}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Success Rate</p>
                        <p className="font-medium">{pipeline.successRate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="active" className="space-y-4">
            <div className="grid gap-4">
              {pipelines
                .filter((p) => p.status === 'active')
                .map((pipeline) => (
                  <Card key={pipeline.id}>
                    <CardHeader>
                      <CardTitle>{pipeline.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {pipeline.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="paused" className="space-y-4">
            <div className="grid gap-4">
              {pipelines
                .filter((p) => p.status === 'paused')
                .map((pipeline) => (
                  <Card key={pipeline.id}>
                    <CardHeader>
                      <CardTitle>{pipeline.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground">
                        {pipeline.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
