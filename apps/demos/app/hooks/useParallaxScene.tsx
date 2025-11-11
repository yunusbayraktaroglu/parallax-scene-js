"use client";

import { useRef, useEffect, useState, useLayoutEffect } from "react";
import { ResizeObserver as Polyfill } from '@juggle/resize-observer';
import { ParallaxScene, type ParallaxSceneOptions } from "@pronotron/parallax-scene-js";

import { useParallaxManagerContext } from "./ParallaxManagerProvider";
import { usePointerDataContext } from "./PointerDataProvider";


export function useParallaxScene( sceneOptions: ParallaxSceneOptions, sceneRef: React.RefObject<HTMLDivElement> )
{
	const { parallaxController } = useParallaxManagerContext();

	const [ scene, setScene ] = useState<ParallaxScene>();
	const [ loaded, setLoaded ] = useState( 0 );
	const [ sceneRect, setSceneRect ] = useState( { left: 0, top: 0, bottom: 0, width: 100, height: 100 } );

	const sceneBuildRef = useRef<boolean>( false );

	useEffect( () => {

		if ( sceneBuildRef.current ){
			return;
		}

		sceneBuildRef.current = true;

		const loadScene = async () => {
			try {
				const PARALLAX_SCENE = await parallaxController.initScene( sceneOptions, ( percent: number ) => {
					setLoaded( percent );
				} );
				setScene( PARALLAX_SCENE );
				setLoaded( 100 );
			} catch( error ){
				throw error;
			}
		};

		loadScene();

	}, [] );

	/**
	 * 'useLayoutEffect' runs synchronously before React mutates the DOM. 
	 * This guarantees ro.disconnect() will execute while sceneElement is still attached.
	 */
	useLayoutEffect( () => {

		const sceneElement = sceneRef.current;

		if ( ! scene || ! sceneElement ) return;

		const ResizeObserver = window.ResizeObserver || Polyfill;

		const ro = new ResizeObserver( () => {

			const rect = sceneElement.getBoundingClientRect();

			const width  = rect.right - rect.left;
			const height = rect.bottom - rect.top;
			const left   = rect.left;
			const top = rect.top;
			const bottom = window.innerHeight - rect.bottom;

			scene.setRect( { x: left, y: bottom, w: width, h: height } );
			setSceneRect( { left, top, bottom, width, height } );

		} );

		ro.observe( sceneElement );

		return () => {
			ro.disconnect();
			// Do not disposes scene for later usages
			scene.active = false;
		}

	}, [ scene ] );

	return { scene, sceneRect, loaded };
}





















































function useParallaxSceneRect( sceneRef: React.RefObject<HTMLDivElement> )
{
	const [ sceneRect, setSceneRect ] = useState( { left: 0, top: 0, bottom: 0, width: 100, height: 100 } );
	
	useEffect( () => {

		const sceneElement = sceneRef.current;

		if ( ! sceneElement ) return;

		const ResizeObserver = window.ResizeObserver || Polyfill;

		const ro = new ResizeObserver( () => {

			const rect = sceneElement.getBoundingClientRect();

			const width  = rect.right - rect.left;
			const height = rect.bottom - rect.top;
			const left   = rect.left;
			const top = rect.top;
			const bottom = window.innerHeight - rect.bottom;

			setSceneRect( { left, top, bottom, width, height } );

		} );

		ro.observe( sceneElement );

		return () => {
			ro.disconnect();
		}

	}, [] );

	return sceneRect;
}




type SceneRect = {
    left: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
};
type PointerComponentProps = {
	sceneRect: SceneRect,
	scene: ParallaxScene
};
function ParallaxScenePointer({ scene, sceneRect }: PointerComponentProps)
{
	const { pointerEasedPosition } = usePointerDataContext();

	useEffect(() => {

		let x = ( pointerEasedPosition.x - sceneRect.left ) / sceneRect.width;
		let y = ( pointerEasedPosition.y - sceneRect.top ) / sceneRect.height;
		
		x = Math.min( Math.max( x, 0 ), 1 );
		y = Math.min( Math.max( y, 0 ), 1 );

		scene.setPointer( x, y );

	}, [ sceneRect, pointerEasedPosition ]);

	return null;
}

// function ParallaxScenePointerDelta({ scene, sceneRect }: PointerComponentProps)
// {
// 	const { pointerDelta } = usePointerDataContext();

// 	useEffect(() => {

// 		if ( pointerPosition.x < sceneRect.left ||  )

// 		let x = ( pointerPosition.x - sceneRect.left ) / sceneRect.width;
// 		let y = ( pointerPosition.y - sceneRect.top ) / sceneRect.height;
		
// 		x = Math.min( Math.max( scene.pointer, 0 ), 1 );
// 		y = Math.min( Math.max( y, 0 ), 1 );

// 		scene.setPointer( x, y );

// 	}, [ sceneRect, pointerEasedPosition ]);

// 	return null;
// }
