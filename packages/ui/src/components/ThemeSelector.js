"use client";

import React from "react";
import { useTheme } from "next-themes";
import clsx from "clsx";

const ThemeSelector = ({ size = "md" }) => {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = React.useState(false);

	React.useEffect(() => {
		setMounted(true);
	}, []);

	const handleChange = (e) => {
		setTheme(e.target.value);
	};

	const sizeClasses = {
		sm: "h-6 w-6",
		md: "h-8 w-8",
		lg: "h-10 w-10",
	};

	const iconSizeClasses = {
		sm: "h-3 w-3",
		md: "h-4 w-4",
		lg: "h-5 w-5",
	};

	const buttonSize = sizeClasses[size] || sizeClasses.md;
	const iconSize = iconSizeClasses[size] || iconSizeClasses.md;

	if (!mounted) {
		return (
			<fieldset className="inline-flex gap-1 rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900">
				<legend className="sr-only">Select a display theme:</legend>
				<span className={clsx("flex items-center justify-center rounded-md", buttonSize)} />
				<span className={clsx("flex items-center justify-center rounded-md", buttonSize)} />
				<span className={clsx("flex items-center justify-center rounded-md", buttonSize)} />
			</fieldset>
		);
	}

	return (
		<fieldset className="inline-flex gap-1 rounded-lg border border-neutral-200 bg-white p-1 dark:border-neutral-700 dark:bg-neutral-900">
			<legend className="sr-only">Select a display theme:</legend>
			<span>
				<input
					aria-label="system"
					id="theme-switch-system"
					type="radio"
					value="system"
					checked={theme === "system"}
					onChange={handleChange}
					className="sr-only"
				/>
				<label
					htmlFor="theme-switch-system"
					className={clsx(
						"flex cursor-pointer items-center justify-center rounded-md transition-colors",
						buttonSize,
						theme === "system"
							? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
							: "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300",
					)}
				>
					<span className="sr-only">system</span>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={iconSize}>
						<path
							fillRule="evenodd"
							d="M2 4.25A2.25 2.25 0 0 1 4.25 2h7.5A2.25 2.25 0 0 1 14 4.25v5.5A2.25 2.25 0 0 1 11.75 12h-1.312c.1.128.21.248.328.36a.75.75 0 0 1 .234.545v.345a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1-.75-.75v-.345a.75.75 0 0 1 .234-.545c.118-.111.228-.232.328-.36H4.25A2.25 2.25 0 0 1 2 9.75v-5.5Zm2.25-.75a.75.75 0 0 0-.75.75v4.5c0 .414.336.75.75.75h7.5a.75.75 0 0 0 .75-.75v-4.5a.75.75 0 0 0-.75-.75h-7.5Z"
							clipRule="evenodd"
						/>
					</svg>
				</label>
			</span>
			<span>
				<input
					aria-label="light"
					id="theme-switch-light"
					type="radio"
					value="light"
					checked={theme === "light"}
					onChange={handleChange}
					className="sr-only appearance-none"
				/>
				<label
					htmlFor="theme-switch-light"
					className={clsx(
						"flex cursor-pointer items-center justify-center rounded-md transition-colors",
						buttonSize,
						theme === "light"
							? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
							: "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300",
					)}
				>
					<span className="sr-only">light</span>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={iconSize}>
						<path d="M8 1a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 1ZM10.5 8a2.5 2.5 0 1 1-5 0 2.5 2.5 0 0 1 5 0ZM12.95 4.11a.75.75 0 1 0-1.06-1.06l-1.062 1.06a.75.75 0 0 0 1.061 1.062l1.06-1.061ZM15 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 15 8ZM11.89 12.95a.75.75 0 0 0 1.06-1.06l-1.06-1.062a.75.75 0 0 0-1.062 1.061l1.061 1.06ZM8 12a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-1.5 0v-1.5A.75.75 0 0 1 8 12ZM5.172 11.89a.75.75 0 0 0-1.061-1.062L3.05 11.89a.75.75 0 1 0 1.06 1.06l1.06-1.06ZM4 8a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1 0-1.5h1.5A.75.75 0 0 1 4 8ZM4.11 5.172A.75.75 0 0 0 5.173 4.11L4.11 3.05a.75.75 0 1 0-1.06 1.06l1.06 1.06Z" />
					</svg>
				</label>
			</span>
			<span>
				<input
					aria-label="dark"
					id="theme-switch-dark"
					type="radio"
					value="dark"
					checked={theme === "dark"}
					onChange={handleChange}
					className="sr-only"
				/>
				<label
					htmlFor="theme-switch-dark"
					className={clsx(
						"flex cursor-pointer items-center justify-center rounded-md transition-colors",
						buttonSize,
						theme === "dark"
							? "bg-neutral-100 text-neutral-900 dark:bg-neutral-800 dark:text-white"
							: "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700 dark:text-neutral-400 dark:hover:bg-neutral-800 dark:hover:text-neutral-300",
					)}
				>
					<span className="sr-only">dark</span>
					<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className={iconSize}>
						<path d="M14.438 10.148c.19-.425-.321-.787-.748-.601A5.5 5.5 0 0 1 6.453 2.31c.186-.427-.176-.938-.6-.748a6.501 6.501 0 1 0 8.585 8.586Z" />
					</svg>
				</label>
			</span>
		</fieldset>
	);
};

export default ThemeSelector;
