"use client";

import { useRef, useEffect } from "react";
import { ParallaxScene as PType, type ParallaxSceneOptions } from "@pronotron/parallax-scene-js";

import { usePointerDataContext } from "@/app/providers/PointerDataProvider";
import { usePointerContext } from "@/app/providers/PointerProvider";
import { useParallaxScene } from "@/app/hooks/useParallaxScene";

import { LoadingBar } from "./LoadingBar";

export type ParallaxSceneProps = ParallaxSceneOptions & {
	/**
     * Defines how pointer movement is mapped to output values.
     *
     * - `standard`: Maps the pointer position directly to the target boundaries.
     * Top-left is -1 (or 0), Bottom-right is +1.
     * Best for: Mouse usage, UI sliders, and precise controls.
     * Note: On touch devices, tapping different spots causes values to "jump" instantly.
     *
     * - `glide`: Movement is calculated as a delta from the initial pointer-down position.
     * The center point is dynamic (wherever the user starts touching).
     * Best for: Touch devices, virtual joysticks, and camera look controls.
     * Note: Highly dependent on sensitivity; extreme movements may be required to reach full values.
	 * 
	 * @default 'standard'
     */
	controlType: 'standard' | 'glide';
	/**
	 * Use different pointer control area instead of Scene rect itself
	 * 
	 * @default 'self'
	 */
	controlRect?: 'self' | 'window' | HTMLElement;
	/**
	 * If true, activates controls only when the pointer is on the ParallaxScene
	 * 
	 * @default true
	 */
	limitControl?: boolean;
};

export function ParallaxScene({ id, layers, controlType = 'standard', controlRect = 'self', limitControl = true }: ParallaxSceneProps )
{
	const sceneRef = useRef<HTMLDivElement>( null ! );
	
	const { scene, sceneRect, loaded } = useParallaxScene( { sceneRef, id, layers, controlType, controlRect, limitControl } );

	return (
		<div ref={ sceneRef } className="parallaxScene flex w-full h-full items-center justify-center text-center">
			{ ! scene ? <LoadingBar loaded={ loaded } sceneID={ id } /> : 
			( controlType === "glide" && <SceneGlidePointer {...{ scene, sceneRect, sceneRef, limitControl }} /> ) ||
			( controlType === "standard" && <SceneStandardPointer {...{ scene, sceneRect, sceneRef, limitControl }} /> ) }
		</div>
	);
}

type SceneRect = {
    left: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
};

type ScenePointerProps = {
	scene: PType;
	sceneRect: SceneRect;
	sceneRef: React.RefObject<HTMLDivElement>;
	limitControl: boolean;
};

function SceneStandardPointer({ scene, sceneRect, sceneRef, limitControl }: ScenePointerProps )
{
	const { pointerPosition } = usePointerDataContext();
	const { pointerController } = usePointerContext();

	// Initial scene pointer position
	const sceneEasedPointerRef = useRef( scene.pointer );

	/**
	 * Ease pointer invidually by ParallaxScene.pointer, helps to avoid jittery pointer controls
	 * Pointer starts at { x: 0.5, y: 0.5 }
	 */
	useEffect( () => {

		// @ts-expect-error - _test
		if ( limitControl && sceneRef.current !== pointerController._test ) return;
 
		let normalizedX = ( pointerPosition.x - sceneRect.left ) / sceneRect.width
		let normalizedY = ( pointerPosition.y - sceneRect.top ) / sceneRect.height;

		sceneEasedPointerRef.current.x += ( normalizedX - scene.pointer.x ) * 0.1;
		sceneEasedPointerRef.current.y += ( normalizedY - scene.pointer.y ) * 0.1;

		sceneEasedPointerRef.current.x = Math.min( Math.max( sceneEasedPointerRef.current.x, 0 ), 1 );
		sceneEasedPointerRef.current.y = Math.min( Math.max( sceneEasedPointerRef.current.y, 0 ), 1 );

		scene.setPointer( sceneEasedPointerRef.current.x, sceneEasedPointerRef.current.y );

	}, [ sceneRect, pointerPosition ] );

	return null;
}



function SceneGlidePointer({ scene, sceneRect, sceneRef, limitControl }: ScenePointerProps )
{
	const { pointerDeltaAdditive, pointerEasedPosition } = usePointerDataContext();
	const { pointerController } = usePointerContext();

	/**
	 * Add pointer delta to scene.pointer.
	 */
	useEffect( () => {

		// @ts-expect-error - _test
		if ( limitControl && sceneRef.current !== pointerController._test ) return;

		let { x, y } = scene.pointer;

		x += pointerDeltaAdditive.x * 0.0001;
		y += pointerDeltaAdditive.y * 0.0001;
		
		x = Math.min( Math.max( x, 0 ), 1 );
		y = Math.min( Math.max( y, 0 ), 1 );

		scene.setPointer( x, y );

	}, [ sceneRect, pointerEasedPosition ] );

	return null;
}