"use client";

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { languages } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useTransition } from "react";

export default function LanguageSwitch({ size = "default" }) {
	const locale = useLocale();
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isPending, startTransition] = useTransition();

	const currentLanguage = languages.find((lang) => lang.code === locale);

	const handleLanguageChange = (newLocale) => {
		startTransition(() => {
			const params = new URLSearchParams(searchParams.toString());
			const queryString = params.toString();
			const pathnameWithQuery = queryString ? `${pathname}?${queryString}` : pathname;
			router.replace(pathnameWithQuery, { locale: newLocale });
		});
	};

	const isSmall = size === "small";

	return (
		<DropdownMenu>
			<DropdownMenuTrigger
				className={buttonVariants({
					variant: "outline",
					size: isSmall ? "sm" : "default"
				})}
				disabled={isPending}
			>
				<span className={isSmall ? "text-base" : "text-lg"}>{currentLanguage?.flag}</span>
				{!isSmall && <span>{currentLanguage?.name}</span>}
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="min-w-[160px]">
				{languages.map((language) => (
					<DropdownMenuItem
						key={language.code}
						onClick={() => handleLanguageChange(language.code)}
						className={`flex cursor-pointer items-center gap-2 ${
							locale === language.code ? "bg-accent text-accent-foreground" : ""
						}`}
					>
						<span className="text-lg">{language.flag}</span>
						<span>{language.name}</span>
					</DropdownMenuItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
