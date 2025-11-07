import "./globals.css";

import type { Metadata } from "next";

import { PronotronPointerProvider } from "./hooks/PointerProvider";
import { PronotronPointerDataProvider } from "./hooks/PointerDataProvider";

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
				<PronotronPointerProvider>
					<PronotronPointerDataProvider>
						{ children }
					</PronotronPointerDataProvider>
				</PronotronPointerProvider>
			</body>
		</html>
	);
}