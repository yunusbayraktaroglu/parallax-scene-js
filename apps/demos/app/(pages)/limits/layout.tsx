import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Demo showing limits",
	description: "Demo setup for Parallax Scene JS",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return children;
}