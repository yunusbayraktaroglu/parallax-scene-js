import "./globals.css";

import type { Metadata } from "next";
import Link from "next/link";

import { PronotronPointerProvider } from "./hooks/PointerProvider";
import { PronotronPointerDataProvider } from "./hooks/PointerDataProvider";
import { PronotronParallaxManagerProvider } from "./hooks/ParallaxManagerProvider";

import { SiteSVG, GithubIcon } from "./components/SiteSVG";
import { PointerView } from "./components/CustomPointer";

export const metadata: Metadata = {
	title: {
		default: "Homepage | Parallax Scene JS",
		template: '%s | Parallax Scene JS',
	},
	description: "Demo setup for Parallax Scene JS",
	authors: [
		{ 
			name: "Yunus Bayraktaroglu",
			url: "https://www.linkedin.com/in/yunusbayraktaroglu",
		}
	],
};

export default function RootLayout({ children }: { children: React.ReactNode })
{
	return (
		<html lang="en" className="w-screen">
			<body className="w-screen">
				{/* <header className="container">
					<nav className="flex flex-row -mx-spacing-sm">
						<Link href="/" className="p-spacing-sm hover:underline">Home</Link>
						<Link href="/multiple" className="p-spacing-sm hover:underline">Documents</Link>
						<a className="ml-auto flex flex-row align-center p-spacing-sm text-slate-500 fill-slate-500 hover:fill-black hover:text-black transition-colors" target="_blank" href="https://github.com/yunusbayraktaroglu/pronotron-tech-art-suite">
							Github <GithubIcon fill="inherit" stroke="none" className="ml-1" />
						</a>
					</nav>
				</header> */}
				<PronotronPointerProvider>
					<PronotronPointerDataProvider>
						<PointerView />
						<div className="flex w-screen h-screen">
							<PronotronParallaxManagerProvider>
								<div id="content" className="flex w-full h-full p-spacing-base">
									{ children }
								</div>
							</PronotronParallaxManagerProvider>
						</div>
					</PronotronPointerDataProvider>
				</PronotronPointerProvider>
			</body>
		</html>
	);
}