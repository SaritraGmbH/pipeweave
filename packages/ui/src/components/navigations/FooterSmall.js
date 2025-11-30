"use client";

import LanguageSwitch from "@/components/LanguageSwitch";
import Logo from "@/components/Logo";
import SaritraLogo from "@/components/SaritraLogo";
import ThemeSelector from "@/components/ThemeSelector";
import { cn } from "@/components/lib/utils";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export default function FooterSmall({ position = "relative", width = "default", height = "default", className = "" }) {
	const t = useTranslations("FOOTER");

	const positionClasses = {
		relative: "",
		fixed: "fixed bottom-0 left-0 right-0",
		sticky: "sticky bottom-0",
	};

	const widthClasses = {
		default: "max-w-6xl",
		full: "",
	};

	const heightVariants = {
		default: {
			container: "py-4",
			text: "text-xs",
		},
		small: {
			container: "py-2",
			text: "text-[10px] sm:text-xs",
		},
	};

	const currentHeight = heightVariants[height];

	return (
		<footer
			className={cn(
				"w-full border-t border-gray-200 bg-white text-gray-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-gray-400/70",
				currentHeight.container,
				currentHeight.text,
				positionClasses[position],
				className
			)}
		>
			<div className={cn("mx-auto px-4", widthClasses[width])}>
				<div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
					{/* Brand */}
					<div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start sm:gap-3">
						<Logo size="small" />
						<span className="xs:inline hidden text-gray-400 dark:text-neutral-600">|</span>
						<span className="text-gray-600 dark:text-neutral-400">© {new Date().getFullYear()}</span>
						<span className="hidden text-gray-400 sm:inline dark:text-neutral-600">|</span>
						<div className="flex items-center gap-2">
							<span className="text-gray-600 dark:text-neutral-400">{t("a_service_by")}</span>
							<SaritraLogo size="small" />
						</div>
					</div>

					{/* Quick Links */}
					<div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
						<Link
							className="text-gray-600 transition-colors hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-200"
							href="/#pricing"
						>
							{t("pricing")}
						</Link>
						<Link
							className="text-gray-600 transition-colors hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-200"
							href="/contact"
						>
							{t("contact.contact")}
						</Link>
						<a
							className="flex items-center gap-1.5 text-gray-600 transition-colors hover:text-gray-900 dark:text-neutral-400 dark:hover:text-neutral-200"
							href="https://status.gridextract.com"
							target="_blank"
							rel="noopener noreferrer"
						>
							<span className="relative flex h-1.5 w-1.5">
								<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75 dark:bg-green-500"></span>
								<span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-green-500 dark:bg-green-700"></span>
							</span>
							{t("contact.system_status")}
						</a>
						<LanguageSwitch size="small" />
						<ThemeSelector size="sm" />
					</div>
				</div>
			</div>
		</footer>
	);
}
