"use client";

import { ChevronsUpDown, Globe, Plus } from "lucide-react";
import * as React from "react";
import { useParams, usePathname, useRouter } from "next/navigation";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuShortcut,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	useSidebar,
} from "@/components/ui/sidebar";

export function ConnectionSwitcher({
	connections,
}: {
	connections: {
		id: string;
		name: string;
		description?: string;
		connection_url: string;
	}[];
}) {
	const { isMobile } = useSidebar();
	const params = useParams();
	const pathname = usePathname();
	const router = useRouter();

	const { locale, connectionId } = params as { locale: string; connectionId?: string };

	// Find the active connection based on the current URL
	const activeConnection = React.useMemo(
		() => connections.find((conn) => conn.id === connectionId) || connections[0],
		[connections, connectionId]
	);

	if (!activeConnection) {
		return null;
	}

	// Extract domain/subdomain/IP from URL
	const getUrlDisplay = (url: string) => {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname;
		} catch {
			return url;
		}
	};

	// Handle connection switch and navigate to the new connection URL
	const handleConnectionSwitch = (newConnectionId: string) => {
		if (newConnectionId === connectionId) return;

		// Build the new path by replacing the connectionId
		// pathname format: /[locale]/[connectionId]/...rest
		const pathSegments = pathname?.split("/").filter(Boolean) || [];

		if (pathSegments.length >= 2) {
			// Replace the connectionId (second segment after locale)
			pathSegments[1] = newConnectionId;
			const newPath = "/" + pathSegments.join("/");
			router.push(newPath);
		} else {
			// If we're at the root, just navigate to the connection's services page
			router.push(`/${locale}/${newConnectionId}/services`);
		}
	};

	return (
		<SidebarMenu>
			<SidebarMenuItem>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<SidebarMenuButton
							size="lg"
							className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						>
							<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
								<Globe className="size-4" />
							</div>
							<div className="grid flex-1 text-left text-sm leading-tight">
								<span className="truncate font-medium">
									{activeConnection.name}
								</span>
								<span className="truncate text-xs text-muted-foreground">
									{getUrlDisplay(activeConnection.connection_url)}
								</span>
							</div>
							<ChevronsUpDown className="ml-auto" />
						</SidebarMenuButton>
					</DropdownMenuTrigger>
					<DropdownMenuContent
						className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
						align="start"
						side={isMobile ? "bottom" : "right"}
						sideOffset={4}
					>
						<DropdownMenuLabel className="text-muted-foreground text-xs">
							Connections
						</DropdownMenuLabel>
						{connections.map((connection, index) => (
							<DropdownMenuItem
								key={connection.id}
								onClick={() => handleConnectionSwitch(connection.id)}
								className="gap-2 p-2"
							>
								<div className="flex size-6 items-center justify-center rounded-md border">
									<Globe className="size-3.5 shrink-0" />
								</div>
								<div className="grid flex-1 text-left text-sm leading-tight">
									<span className="truncate font-medium">
										{connection.name}
									</span>
									<span className="truncate text-xs text-muted-foreground">
										{getUrlDisplay(connection.connection_url)}
									</span>
								</div>
								<DropdownMenuShortcut>
									⌘{index + 1}
								</DropdownMenuShortcut>
							</DropdownMenuItem>
						))}
						<DropdownMenuSeparator />
						<DropdownMenuItem
							className="gap-2 p-2"
							onClick={() => router.push(`/${locale}/new-connection`)}
						>
							<div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
								<Plus className="size-4" />
							</div>
							<div className="text-muted-foreground font-medium">
								Add connection
							</div>
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</SidebarMenuItem>
		</SidebarMenu>
	);
}
