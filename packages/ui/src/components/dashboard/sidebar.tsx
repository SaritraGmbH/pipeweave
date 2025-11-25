'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Workflow,
  ListChecks,
  Server,
  Activity,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Pipelines', href: '/pipelines', icon: Workflow },
  { name: 'Tasks', href: '/tasks', icon: ListChecks },
  { name: 'Workers', href: '/workers', icon: Server },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-full w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Workflow className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold">PipeWeave</span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>
      <div className="border-t p-4">
        <div className="text-xs text-muted-foreground">
          <div>Orchestrator: Connected</div>
          <div className="mt-1">Version: 0.1.0</div>
        </div>
      </div>
    </div>
  );
}
