"use client";

import { useRef, useEffect } from "react";
import { type ParallaxSceneOptions } from "@pronotron/parallax-scene-js";

import { usePointerDataContext } from "../hooks/PointerDataProvider";
import { useParallaxScene } from "../hooks/useParallaxScene";

export function ParallaxScene({ id, layers }: ParallaxSceneOptions )
{
	const sceneRef = useRef<HTMLDivElement>( null ! );

	const { scene, sceneRect, loaded } = useParallaxScene( { id, layers }, sceneRef );
	const { pointerEasedPosition } = usePointerDataContext();

	// See below.
	// const { pointerTarget, setPointerTarget } = usePointerTargetContext();

	useEffect(() => {

		if ( ! scene ) return;

		// if ( pointerTarget !== sceneRef.current ) return;
		// It works but not implemented yet.
		// Sudden change of scene causes a jittery visual. 
		// Should be implemented with delta based pointer movement.
 
		let x = ( pointerEasedPosition.x - sceneRect.left ) / sceneRect.width;
		let y = ( pointerEasedPosition.y - sceneRect.top ) / sceneRect.height;
		
		x = Math.min( Math.max( x, 0 ), 1 );
		y = Math.min( Math.max( y, 0 ), 1 );

		scene.setPointer( x, y );

	}, [ sceneRect, pointerEasedPosition ]);

	return (
		<div ref={ sceneRef } className="border parallaxScene flex items-center justify-center text-center">
			{ ! scene && (
				<div className="label p-spacing-sm rounded-xl bg-white">
					<h1 className="text-red text-sm">Scene { id }</h1>
					<h1 className="text-black text-sm">{ loaded }%</h1>
				</div>
			) }
		</div>
	);
}