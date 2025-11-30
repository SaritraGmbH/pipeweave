"use client";

import { AppSidebar } from "@/components/navigations/AppSidebar";
import { DynamicBreadcrumbs } from "@/components/navigations/DynamicBreadcrumbs";
import FooterSmall from "@/components/navigations/FooterSmall";
import { Separator } from "@/components/ui/separator";
import {
	SidebarInset,
	SidebarProvider,
	SidebarTrigger,
} from "@/components/ui/sidebar";

const MainLayout = ({ children }) => {
	return (
		<SidebarProvider
			style={{
				"--sidebar-width": "520px",
			}}
		>
			<AppSidebar />
			<SidebarInset className="overflow-auto">
				<header className="bg-background sticky top-0 flex h-16 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<DynamicBreadcrumbs />
				</header>
				<div className="flex flex-1 flex-col gap-4 p-4">{children}</div>
				<FooterSmall width="full" />
			</SidebarInset>
		</SidebarProvider>
	);
};

export default MainLayout;
