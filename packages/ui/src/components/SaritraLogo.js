import saritraLogo from "@/assets/images/logo/saritra-logo.png";
import Image from "next/image";
import Link from "next/link";

export default function SaritraLogo({ className = "", size = "default" }) {
	const heightClasses = {
		small: "h-5",
		default: "h-6",
		large: "h-8",
	};

	const heightClass = heightClasses[size] || heightClasses.default;

	return (
		<Link
			href="https://saritra.com"
			target="_blank"
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
		>
			<Image
				src={saritraLogo}
				alt="Saritra Logo"
				height={512}
				width={2048}
				quality={50}
				className={`w-auto dark:brightness-0 dark:invert ${heightClass} ${className}`}
			/>
		</Link>
	);
}
