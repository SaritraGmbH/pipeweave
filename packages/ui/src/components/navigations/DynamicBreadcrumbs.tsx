"use client";

import * as React from "react";
import { ChevronRight, Home } from "lucide-react";

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useBreadcrumbStore } from "@/store/breadcrumb-store";

export function DynamicBreadcrumbs() {
	const { breadcrumbs } = useBreadcrumbStore();

	if (breadcrumbs.length === 0) {
		return null;
	}

	return (
		<Breadcrumb>
			<BreadcrumbList>
				{breadcrumbs.map((item, index) => {
					const isLast = index === breadcrumbs.length - 1;
					const isHome = index === 0;

					return (
						<React.Fragment key={index}>
							<BreadcrumbItem>
								{isLast ? (
									<BreadcrumbPage>{item.label}</BreadcrumbPage>
								) : (
									<BreadcrumbLink href={item.href}>
										{isHome ? <Home className="h-4 w-4" /> : item.label}
									</BreadcrumbLink>
								)}
							</BreadcrumbItem>
							{!isLast && (
								<BreadcrumbSeparator>
									<ChevronRight className="h-4 w-4" />
								</BreadcrumbSeparator>
							)}
						</React.Fragment>
					);
				})}
			</BreadcrumbList>
		</Breadcrumb>
	);
}
