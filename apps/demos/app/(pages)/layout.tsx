import "../globals.css";

import type { Metadata } from "next";

import { PronotronPointerProvider } from "@/app/providers/PointerProvider";
import { PronotronPointerDataProvider } from "@/app/providers/PointerDataProvider";
import { PronotronParallaxManagerProvider } from "@/app/providers/ParallaxManagerProvider";
import { ParallaxDebugProvider } from "@/app/providers/ParallaxDebugProvider";
import { PronotronIOProvider } from "@/app/providers/PronotronIOProvider";

import { SiteSVG } from "@/app/components/SiteSVG";
import { SiteHeader } from "@/app/components/SiteHeader";
import { PointerView } from "@/app/components/CustomPointer";

// Define the base URL for relative links (like OG images) to work correctly
const BASE_URL = "https://yunusbayraktaroglu.github.io/parallax-scene-js";

export const metadata: Metadata = {
	metadataBase: new URL( BASE_URL ),
	title: {
		default: "Homepage | Parallax Scene JS",
		template: '%s | Parallax Scene JS',
	},
	description: "Create raw WebGL parallax scenes with only 1 draw call. A lightweight, high-performance library optimized for smooth rendering on all devices, including low-end mobile.",
	applicationName: "Parallax Scene JS",
	authors: [
		{ 
			name: "Yunus Bayraktaroglu",
			url: "https://www.linkedin.com/in/yunusbayraktaroglu",
		}
	],
	publisher: "Yunus Bayraktaroglu",
	openGraph: {
		title: "Parallax Scene JS | High Performance WebGL Parallax",
		description: "Generate smooth, raw WebGL parallax scenes with a single draw call. optimized for performance.",
		url: BASE_URL,
		siteName: "Parallax Scene JS",
		locale: "en_US",
		type: "website",
		// images: [
		// 	{
		// 		url: "/og-image.jpg",
		// 		width: 1200,
		// 		height: 630,
		// 		alt: "Parallax Scene JS Demo Preview",
		// 	},
		// ],
	},
	// Robots: Ensures search engines can find and index your page
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			"max-video-preview": -1,
			"max-image-preview": "large",
			"max-snippet": -1,
		},
	},
};

export default function RootLayout({ children }: { children: React.ReactNode })
{
	/**
	 * To be able create full sized, but empty layout,
	 * we need to start add: `height: 100%` from <html>
	 * 
	 * @see https://getbootstrap.com/docs/5.3/examples/cover/
	 */
	return (
		<html lang="en" className="h-full">
			<body className="h-full">
				<SiteSVG />
				<PronotronIOProvider>
					<ParallaxDebugProvider>
				<SiteHeader />

						<PronotronPointerProvider>
							<PronotronPointerDataProvider>
								<PointerView />
									<PronotronParallaxManagerProvider>
										<div id="content" className="w-full h-full">
											{ children }
										</div>
									</PronotronParallaxManagerProvider>
							</PronotronPointerDataProvider>
						</PronotronPointerProvider>
					</ParallaxDebugProvider>
				</PronotronIOProvider>
			</body>
		</html>
	);
}

