"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarInput,
	useSidebar,
} from "@/components/ui/sidebar";
import { Switch } from "@/components/ui/switch";
import { useSecondarySidebarStore } from "@/store/sidebar-store";

export function DynamicSecondarySidebar() {
	const { state } = useSidebar();
	const {
		items,
		isLoading,
		searchQuery,
		filterEnabled,
		title,
		setSearchQuery,
		setFilterEnabled,
	} = useSecondarySidebarStore();

	// Filter items based on search query
	const filteredItems = React.useMemo(() => {
		if (!searchQuery) return items;
		return items.filter(
			(item) =>
				item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
				item.description?.toLowerCase().includes(searchQuery.toLowerCase()),
		);
	}, [items, searchQuery]);

	// Don't show sidebar if no title is set (pages control this via the hook)
	if (!title) {
		return null;
	}

	return (
		<Sidebar
			collapsible="none"
			className={`hidden flex-1 ${state === "expanded" ? "md:flex" : "md:hidden"}`}
		>
			<SidebarHeader className="gap-3.5 border-b p-4">
				<div className="flex w-full items-center justify-between">
					<div className="text-foreground text-base font-medium">
						{title}
					</div>
					<Label className="flex items-center gap-2 text-sm">
						<span>Filter</span>
						<Switch
							className="shadow-none"
							checked={filterEnabled}
							onCheckedChange={setFilterEnabled}
						/>
					</Label>
				</div>
				<SidebarInput
					placeholder={`Search ${title.toLowerCase()}...`}
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
				/>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup className="px-0">
					<SidebarGroupContent>
						{isLoading ? (
							<div className="text-muted-foreground p-4 text-sm">
								Loading...
							</div>
						) : filteredItems.length === 0 ? (
							<div className="text-muted-foreground p-4 text-sm">
								{searchQuery ? "No items match your search" : "No items found"}
							</div>
						) : (
							filteredItems.map((item) => (
								<a
									href="#"
									key={item.id}
									className="hover:bg-sidebar-accent hover:text-sidebar-accent-foreground flex flex-col items-start gap-2 border-b p-4 text-sm leading-tight whitespace-nowrap last:border-b-0"
								>
									<div className="flex w-full items-center gap-2">
										<span className="font-medium">{item.name}</span>
										{item.status && (
											<span className="text-muted-foreground ml-auto text-xs">
												{item.status}
											</span>
										)}
									</div>
									{item.description && (
										<span className="text-muted-foreground line-clamp-2 w-[260px] text-xs whitespace-break-spaces">
											{item.description}
										</span>
									)}
								</a>
							))
						)}
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
		</Sidebar>
	);
}
