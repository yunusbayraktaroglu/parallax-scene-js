import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Demo showing scenes stopping when not visible",
	description: "Demo setup for Parallax Scene JS with multiple scenes in a single WebGL context.",
};

export default function Layout({ children }: Readonly<{ children: React.ReactNode }> )
{
	return children;
}