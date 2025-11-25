import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">
            Manage your orchestrator configuration and preferences
          </p>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Orchestrator Connection</CardTitle>
              <CardDescription>
                Configure connection to the PipeWeave orchestrator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Orchestrator URL</label>
                <input
                  type="text"
                  defaultValue="http://localhost:3000"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">API Key</label>
                <input
                  type="password"
                  placeholder="Enter your API key"
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <Button>Save Connection Settings</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Configure how you receive notifications about task execution
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Task Failures</div>
                  <div className="text-sm text-muted-foreground">
                    Get notified when a task fails
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Worker Disconnections</div>
                  <div className="text-sm text-muted-foreground">
                    Get notified when a worker goes offline
                  </div>
                </div>
                <input type="checkbox" defaultChecked className="h-4 w-4" />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium">Pipeline Completions</div>
                  <div className="text-sm text-muted-foreground">
                    Get notified when a pipeline completes
                  </div>
                </div>
                <input type="checkbox" className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Display Preferences</CardTitle>
              <CardDescription>
                Customize how data is displayed in the dashboard
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Refresh Interval</label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="5">5 seconds</option>
                  <option value="10" selected>10 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">60 seconds</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Timezone</label>
                <select className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="utc">UTC</option>
                  <option value="local" selected>Local Time</option>
                </select>
              </div>
              <Button>Save Preferences</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
