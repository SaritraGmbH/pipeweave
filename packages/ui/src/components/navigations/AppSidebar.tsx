"use client";

import { Boxes, Layers, ListTodo, PlayCircle } from "lucide-react";
import { useParams, usePathname } from "next/navigation";
import * as React from "react";

import { ConnectionSwitcher } from "@/components/navigations/ConnectionSwitcher";
import { DynamicSecondarySidebar } from "@/components/navigations/DynamicSecondarySidebar";
import {
	Sidebar,
	SidebarContent,
	SidebarFooter,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useConnectionsStore } from "@/store/connections-store";

const navMain = [
	{
		title: "Services",
		url: "/services",
		icon: Boxes,
	},
	{
		title: "Pipelines",
		url: "/pipelines",
		icon: Layers,
	},
	{
		title: "Runs",
		url: "/runs",
		icon: PlayCircle,
	},
	{
		title: "Tasks",
		url: "/tasks",
		icon: ListTodo,
	},
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
	const params = useParams();
	const pathname = usePathname();
	const { locale, connectionId } = params as {
		locale: string;
		connectionId: string;
	};
	const { connections } = useConnectionsStore();

	return (
		<Sidebar
			collapsible="icon"
			className="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
			{...props}
		>
			{/* This is the first sidebar */}
			{/* We disable collapsible and adjust width to icon. */}
			{/* This will make the sidebar appear as icons. */}
			<Sidebar
				collapsible="none"
				className="w-[calc(var(--sidebar-width)/2)] min-w-[calc(var(--sidebar-width)/2)] border-r"
			>
				<SidebarHeader>
					<ConnectionSwitcher connections={connections} />
				</SidebarHeader>
				<SidebarContent>
					<SidebarGroup>
						<SidebarGroupContent className="px-1.5 md:px-0">
							<SidebarMenu>
								{navMain.map((item) => (
									<SidebarMenuItem key={item.title}>
										<SidebarMenuButton
											tooltip={{
												children: item.title,
												hidden: false,
											}}
											asChild
											isActive={
												pathname ===
												`/${locale}/${connectionId}${item.url}`
											}
											className="px-2.5 md:px-2"
										>
											<a
												href={`/${locale}/${connectionId}${item.url}`}
											>
												<item.icon />
												<span>{item.title}</span>
											</a>
										</SidebarMenuButton>
									</SidebarMenuItem>
								))}
							</SidebarMenu>
						</SidebarGroupContent>
					</SidebarGroup>
				</SidebarContent>
				<SidebarFooter>
					{/* <NavUser user={data.user} /> */}
				</SidebarFooter>
			</Sidebar>

			{/* This is the second sidebar - dynamic based on route level */}
			<DynamicSecondarySidebar />
		</Sidebar>
	);
}
