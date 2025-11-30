"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Globe, Pencil, Trash2, Plus } from "lucide-react";
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
import { useConnectionsStore, type Connection } from "@/store/connections-store";

export default function ConnectionsPage() {
	const router = useRouter();
	const params = useParams();
	const { locale } = params as { locale: string };
	const { connections, updateConnection, deleteConnection } =
		useConnectionsStore();

	const [editingId, setEditingId] = useState<string | null>(null);
	const [editFormData, setEditFormData] = useState<Connection | null>(null);
	const [errors, setErrors] = useState<Record<string, string>>({});

	const handleEdit = (connection: Connection) => {
		setEditingId(connection.id);
		setEditFormData({ ...connection });
		setErrors({});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditFormData(null);
		setErrors({});
	};

	const handleSaveEdit = () => {
		if (!editFormData) return;

		// Validate form
		const newErrors: Record<string, string> = {};

		if (!editFormData.name.trim()) {
			newErrors.name = "Connection name is required";
		}

		if (!editFormData.connection_url.trim()) {
			newErrors.connection_url = "Connection URL is required";
		} else {
			// Validate URL format
			try {
				new URL(editFormData.connection_url);
			} catch {
				newErrors.connection_url = "Please enter a valid URL";
			}
		}

		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			return;
		}

		updateConnection(editingId!, {
			name: editFormData.name,
			description: editFormData.description,
			connection_url: editFormData.connection_url,
		});

		setEditingId(null);
		setEditFormData(null);
	};

	const handleDelete = (id: string) => {
		if (
			confirm(
				"Are you sure you want to delete this connection? This action cannot be undone."
			)
		) {
			deleteConnection(id);
		}
	};

	const getUrlDisplay = (url: string) => {
		try {
			const urlObj = new URL(url);
			return urlObj.hostname;
		} catch {
			return url;
		}
	};

	return (
		<div className="container max-w-4xl py-8">
			<div className="mb-8 flex items-center justify-between">
				<div>
					<h1 className="text-3xl font-bold">Manage Connections</h1>
					<p className="text-muted-foreground mt-2">
						Add, edit, or remove your Pipeweave connections
					</p>
				</div>
				<Button onClick={() => router.push(`/${locale}/new-connection`)}>
					<Plus className="mr-2 h-4 w-4" />
					Add Connection
				</Button>
			</div>

			<div className="space-y-4">
				{connections.length === 0 ? (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-12">
							<Globe className="text-muted-foreground mb-4 h-12 w-12" />
							<p className="text-muted-foreground mb-4 text-center">
								No connections yet. Add your first connection to get started.
							</p>
							<Button onClick={() => router.push(`/${locale}/new-connection`)}>
								<Plus className="mr-2 h-4 w-4" />
								Add Connection
							</Button>
						</CardContent>
					</Card>
				) : (
					connections.map((connection) => (
						<Card key={connection.id}>
							<CardHeader>
								<div className="flex items-start justify-between">
									<div className="flex items-start gap-3">
										<div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-10 items-center justify-center rounded-lg">
											<Globe className="size-5" />
										</div>
										<div>
											{editingId === connection.id ? (
												<div className="space-y-3">
													<div className="space-y-2">
														<Label htmlFor={`edit-name-${connection.id}`}>
															Connection Name{" "}
															<span className="text-destructive">*</span>
														</Label>
														<Input
															id={`edit-name-${connection.id}`}
															value={editFormData?.name || ""}
															onChange={(e) =>
																setEditFormData({
																	...editFormData!,
																	name: e.target.value,
																})
															}
															className={
																errors.name ? "border-destructive" : ""
															}
														/>
														{errors.name && (
															<p className="text-destructive text-sm">
																{errors.name}
															</p>
														)}
													</div>
													<div className="space-y-2">
														<Label htmlFor={`edit-description-${connection.id}`}>
															Description
														</Label>
														<Input
															id={`edit-description-${connection.id}`}
															value={editFormData?.description || ""}
															onChange={(e) =>
																setEditFormData({
																	...editFormData!,
																	description: e.target.value,
																})
															}
														/>
													</div>
													<div className="space-y-2">
														<Label htmlFor={`edit-url-${connection.id}`}>
															Connection URL{" "}
															<span className="text-destructive">*</span>
														</Label>
														<Input
															id={`edit-url-${connection.id}`}
															type="url"
															value={editFormData?.connection_url || ""}
															onChange={(e) =>
																setEditFormData({
																	...editFormData!,
																	connection_url: e.target.value,
																})
															}
															className={
																errors.connection_url
																	? "border-destructive"
																	: ""
															}
														/>
														{errors.connection_url && (
															<p className="text-destructive text-sm">
																{errors.connection_url}
															</p>
														)}
													</div>
												</div>
											) : (
												<>
													<CardTitle>{connection.name}</CardTitle>
													<CardDescription className="mt-1">
														{connection.description || "No description"}
													</CardDescription>
												</>
											)}
										</div>
									</div>
									{editingId === connection.id ? (
										<div className="flex gap-2">
											<Button size="sm" onClick={handleSaveEdit}>
												Save
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={handleCancelEdit}
											>
												Cancel
											</Button>
										</div>
									) : (
										<div className="flex gap-2">
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleEdit(connection)}
											>
												<Pencil className="h-4 w-4" />
											</Button>
											<Button
												size="sm"
												variant="outline"
												onClick={() => handleDelete(connection.id)}
											>
												<Trash2 className="h-4 w-4" />
											</Button>
										</div>
									)}
								</div>
							</CardHeader>
							{editingId !== connection.id && (
								<CardContent>
									<div className="flex items-center gap-2">
										<span className="text-muted-foreground text-sm">URL:</span>
										<code className="bg-muted rounded px-2 py-1 text-sm">
											{connection.connection_url}
										</code>
										<span className="text-muted-foreground ml-auto text-xs">
											{getUrlDisplay(connection.connection_url)}
										</span>
									</div>
								</CardContent>
							)}
						</Card>
					))
				)}
			</div>
		</div>
	);
}
