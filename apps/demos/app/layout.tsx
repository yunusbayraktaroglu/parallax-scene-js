import "./globals.css";

import type { Metadata } from "next";
import Link from "next/link";

import { PronotronPointerProvider } from "./hooks/PointerProvider";
import { PronotronPointerDataProvider } from "./hooks/PointerDataProvider";
import { PronotronParallaxManagerProvider } from "./hooks/ParallaxManagerProvider";

import { SiteSVG, GithubIcon } from "./components/SiteSVG";
import { PointerView } from "./components/CustomPointer";
import { Expandable } from "./components/Expandable";
import { PronotronPointerTargetProvider } from "./hooks/PointerTargetProvider";

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
				<SiteSVG />
				<Header />
				<PronotronPointerTargetProvider>
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
				</PronotronPointerTargetProvider>
			</body>
		</html>
	);
}


function Header()
{
	return (
		<Expandable title="Examples" expand={ false } className="fixed p-spacing-sm min-w-[200px] bg-white right-0 m-spacing-xs rounded-xl opacity-50 hover:opacity-100">
			<header className="container">
				<nav className="flex flex-col -mx-spacing-sm">
					<Link href="/" className="p-spacing-sm hover:underline">Home</Link>
					<Link href="/limits" className="p-spacing-sm hover:underline">Limits</Link>
					<a className="ml-auto flex flex-row align-center p-spacing-sm text-slate-500 fill-slate-500 hover:fill-black hover:text-black transition-colors" target="_blank" href="https://github.com/yunusbayraktaroglu/parallax-scene-js">
						Github <GithubIcon fill="inherit" stroke="none" className="ml-1" />
					</a>
				</nav>
			</header>
		</Expandable>
	)
}