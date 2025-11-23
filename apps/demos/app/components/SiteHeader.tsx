"use client";

import parallaxScenePackage from "@pronotron/parallax-scene-js/package.json";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

import { GithubIcon } from "./SiteSVG";
import { Expandable } from "./Expandable";
import { ParallaxScenesDebug } from "./ParallaxScenesDebug";

export function SiteHeader()
{
	return (
		<div className="fixed top-0 left-0 w-1/2 max-w-[150px] landscape:max-w-[200px] m-spacing-sm space-y-spacing-xs z-50">
			<SiteNavigation />
			<ParallaxScenesDebug />
		</div>
	)
}

function SiteNavigation()
{
	const [ isExpanded, setIsExpanded ] = useState( false );

	const pathname = usePathname();
	const demos = useMemo(() => ([
		{
			href: "/",
			title: "Home",
			description: "Initial demo"
		},
		{
			href: "/multiple-scenes",
			title: "Multiple Scenes",
			description: "Demo showing multiple Parallax Scenes rendered with a single canvas"
		},
		{
			href: "/limits",
			title: "Limits",
			description: "Demonstrates system limits"
		},
		{
			href: "/intersection",
			title: "Intersection",
			description: "Demonstrates intersection behavior"
		},
	]), [] );

	// Close menu on demo changes
	useEffect( () => {
		setIsExpanded( false );
	}, [ pathname ] );

	return (
		<Expandable 
			title="Examples"
			className="bg-white rounded-xl overflow-hidden"
			description={ demos.find( demo => demo.href === pathname )?.title }
			expand={ isExpanded }
			setExpand={ setIsExpanded }
		>
			<header className="container">
				<nav className="flex flex-col bg-slate-300 divide-y divide-gray-100">

					{ demos.map( demo => <DemoElement key={ demo.href } { ...demo } /> ) }

					<div className="flex flex-col bg-white p-spacing-sm text-slate-500 fill-slate-500 hover:fill-black hover:text-black transition-colors items-end">
						<a className="flex flex-row align-center" target="_blank" href="https://github.com/yunusbayraktaroglu/parallax-scene-js">
							Github <GithubIcon fill="inherit" stroke="none" className="ml-1" />
						</a>
						<div className="mt-1">
							<p className="text-xs">parallax-scene-js v{ parallaxScenePackage.version }</p>
						</div>
					</div>

				</nav>
			</header>
		</Expandable>
	)
}

function DemoElement( { href, title, description }: { href: string; title: string; description: string } )
{
	return (
		<Link href={ href } className="p-spacing-sm hover:bg-slate-100 transition-colors group">
			<p className="group-hover:underline">{ title }</p>
			{ description && <p className="text-xs">{ description }</p> }
		</Link>
	)
}