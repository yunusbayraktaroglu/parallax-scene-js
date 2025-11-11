import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Demo showing multiple scenes",
	description: "Demo setup for Parallax Scene JS. Multiple scenes in one WebGL context",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return children;
}