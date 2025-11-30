import gridExtractLogoDark from "@/assets/images/logo/gridextract-logo-dark.png";
import gridExtractLogo from "@/assets/images/logo/gridextract-logo.png";
import Image from "next/image";
import Link from "next/link";

export default function Logo({ className = "", size = "default" }) {
	const heightClasses = {
		small: "h-5",
		default: "h-8",
		large: "h-10",
	};

	const heightClass = heightClasses[size] || heightClasses.default;

	return (
		<Link
			href={"/"}
			rel="noopener noreferrer"
			className="inline-flex items-center gap-1 hover:underline" // Added gap-1 for spacing and hover effect
		>
			<Image
				src={gridExtractLogo}
				alt="GridExtract Logo"
				height={1024}
				width={5043}
				quality={100}
				priority
				sizes="(max-width: 768px) 160px, 192px"
				className={`visible w-auto dark:hidden ${heightClass}`} // Adjusted size slightly, 'w-auto' maintains aspect ratio
			/>
			<Image
				src={gridExtractLogoDark}
				alt="GridExtract Logo Dark"
				height={1024}
				width={5043}
				quality={100}
				priority
				sizes="(max-width: 768px) 160px, 192px"
				className={`hidden w-auto dark:block ${heightClass}`} // Adjusted size slightly, 'w-auto' maintains aspect ratio
			/>
		</Link>
	);
}
