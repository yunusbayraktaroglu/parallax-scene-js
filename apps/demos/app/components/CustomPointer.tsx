"use client";

import { usePointerDataContext } from "@/app/providers/PointerDataProvider";

export function PointerView()
{
	const { pointerState, pointerTargetInteractable, pointerEasedPosition } = usePointerDataContext();

	return (
		<div 
			className="pointer"
			data-interactable={ pointerTargetInteractable }
			data-state={ pointerState }
			style={{ "--x": `${ pointerEasedPosition.x }px`, "--y": `${ pointerEasedPosition.y }px` } as React.CSSProperties }
		>
			<div className="pointer-inside" />
		</div>
	)
}