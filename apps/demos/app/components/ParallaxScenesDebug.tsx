"use client";

import { useState } from "react";
import { useParallaxDebugProviderContext } from "@/app/providers/ParallaxDebugProvider";
import { Expandable } from "./Expandable";

export function ParallaxScenesDebug()
{
	const [ isExpanded, setIsExpanded ] = useState( false );
	
	return (
		<Expandable 
			title="Scenes Debug"
			className="bg-white top-0 left-0 rounded-xl overflow-hidden"
			description="list of registered scenes"
			expand={ isExpanded }
			setExpand={ setIsExpanded }
		>
			<ParallaxScenes key="SCENES" />
		</Expandable>
	)
}

export function ParallaxScenes()
{
	const { scenes } = useParallaxDebugProviderContext();

	if ( ! scenes.length ){
		return null;
	}

	return (
		<div className="flex flex-col bg-slate-300 divide-y divide-gray-500">
			{ scenes.map( ({ id, isActive, controlType, controlRect, limitControl }) => (
				<div key={ id } className={ `p-spacing-sm` + ' ' + ( isActive ? 'bg-green-500' : 'bg-orange-400' ) }>
					<p className="text-sm font-bold">{ id }</p>
					<p className="text-sm">Status: { isActive ? "active" : "deactive" }</p>
					<p className="text-xs">Control Type: { controlType }</p>
					<p className="text-xs">Control Rect: { controlRect instanceof HTMLElement ? "other" : controlRect }</p>
					<p className="text-xs">Limited: { limitControl ? "true" : "false" }</p>
				</div>
			))}
		</div>
	)
}
