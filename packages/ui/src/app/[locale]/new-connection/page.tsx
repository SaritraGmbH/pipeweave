"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { useConnectionsStore } from "@/store/connections-store";

export default function NewConnectionPage() {
	const router = useRouter();
	const params = useParams();
	const { locale } = params as { locale: string };
	const { addConnection, connections } = useConnectionsStore();

	const [formData, setFormData] = useState({
		name: "",
		description: "",
		connection_url: "",
	});

	const [errors, setErrors] = useState<Record<string, string>>({});

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();

		// Validate form
		const newErrors: Record<string, string> = {};

		if (!formData.name.trim()) {
			newErrors.name = "Connection name is required";
		}

		if (!formData.connection_url.trim()) {
			newErrors.connection_url = "Connection URL is required";
		} else {
			// Validate URL format
			try {
				new URL(formData.connection_url);
			} catch {
				newErrors.connection_url = "Please enter a valid URL";
			}
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		// Generate ID from name (lowercase, replace spaces with hyphens)
		const id = formData.name
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, "");

		// Check if ID already exists
		if (connections.some((conn) => conn.id === id)) {
			setErrors({ name: "A connection with this name already exists" });
			return;
		}

		// Add the connection
		addConnection({
			id,
			name: formData.name,
			description: formData.description || undefined,
			connection_url: formData.connection_url,
		});

		// Navigate to the new connection's services page
		router.push(`/${locale}/${id}/services`);
	};

	return (
		<div className="flex min-h-screen items-center justify-center p-4">
			<Card className="w-full max-w-lg">
				<CardHeader>
					<CardTitle>Add New Connection</CardTitle>
					<CardDescription>
						Create a new connection to a Pipeweave instance
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="name">
								Connection Name <span className="text-destructive">*</span>
							</Label>
							<Input
								id="name"
								placeholder="e.g., Production, Staging, Local"
								value={formData.name}
								onChange={(e) => {
									setFormData({ ...formData, name: e.target.value });
									setErrors({ ...errors, name: "" });
								}}
								className={errors.name ? "border-destructive" : ""}
							/>
							{errors.name && (
								<p className="text-destructive text-sm">{errors.name}</p>
							)}
						</div>

						<div className="space-y-2">
							<Label htmlFor="description">Description</Label>
							<Input
								id="description"
								placeholder="Optional description"
								value={formData.description}
								onChange={(e) =>
									setFormData({ ...formData, description: e.target.value })
								}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="connection_url">
								Connection URL <span className="text-destructive">*</span>
							</Label>
							<Input
								id="connection_url"
								type="url"
								placeholder="https://api.example.com"
								value={formData.connection_url}
								onChange={(e) => {
									setFormData({ ...formData, connection_url: e.target.value });
									setErrors({ ...errors, connection_url: "" });
								}}
								className={errors.connection_url ? "border-destructive" : ""}
							/>
							{errors.connection_url && (
								<p className="text-destructive text-sm">
									{errors.connection_url}
								</p>
							)}
						</div>

						<div className="flex flex-col gap-3 pt-4">
							<Button type="submit" className="w-full">
								Add Connection
							</Button>
							<Button
								type="button"
								variant="outline"
								className="w-full"
								onClick={() => router.push(`/${locale}/connections`)}
							>
								Manage Connections
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	);
}
