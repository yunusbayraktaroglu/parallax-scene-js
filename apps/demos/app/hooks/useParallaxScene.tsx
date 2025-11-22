"use client";

import { useRef, useEffect, useState, useLayoutEffect } from "react";
import { ParallaxScene } from "@pronotron/parallax-scene-js";

import { useParallaxManagerContext } from "@/app/providers/ParallaxManagerProvider";
import { usePronotronIOContext } from "@/app/providers/PronotronIOProvider";
import { useParallaxDebugProviderContext } from "@/app/providers/ParallaxDebugProvider";

import { ParallaxSceneProps } from "@/app/components/ParallaxScene";

// All the data should be assigned before to use that hook
type UseParallaxSceneProps = Required<ParallaxSceneProps & {
	sceneRef: React.RefObject<HTMLDivElement>;
}>;

export function useParallaxScene( { id, layers, controlType, controlRect, limitControl, sceneRef }: UseParallaxSceneProps )
{
	// --- For debugging, delete in production ---
	const { dispatch } = useParallaxDebugProviderContext();
	// --- For debugging, delete in production ---

	const { parallaxManager } = useParallaxManagerContext();
	const { io } = usePronotronIOContext();

	const [ scene, setScene ] = useState<ParallaxScene>();
	const [ loaded, setLoaded ] = useState( 0 );
	const [ sceneRect, setSceneRect ] = useState( { left: 0, top: 0, bottom: 0, width: 100, height: 100 } );

	const sceneLoadRef = useRef<boolean>( false );

	/**
	 * Start loading of the ParallaxScene on mount
	 */
	useEffect( () => {

		if ( sceneLoadRef.current ){
			return;
		}

		sceneLoadRef.current = true;

		const loadScene = async () => {
			try {
				
				const PARALLAX_SCENE = await parallaxManager.initScene( { id, layers }, ( percent: number ) => {
					setLoaded( percent );
				} );
				
				setScene( PARALLAX_SCENE );
				setLoaded( 100 );

				// --- For debugging, delete in production ---
				dispatch( { 
					type: "add",
					payload: { id: PARALLAX_SCENE.id, layers, controlRect, controlType, limitControl, isActive: true } 
				} );
				// --- For debugging, delete in production ---

			} catch( error ){
				throw error;
			}
		};

		loadScene();

	}, [] );

	/**
	 * 'useLayoutEffect' runs synchronously before React mutates the DOM. 
	 * This guarantees io.removeNode( sceneElement ) will execute while sceneElement is still attached.
	 */
	useLayoutEffect( () => {

		const sceneElement = sceneRef.current;

		if ( ! scene || ! sceneElement ) return;

		const modifySceneRect = () => {

			// Will be used in webgl scrissor
			const { left, right, bottom, top } = sceneElement.getBoundingClientRect();

			const width  = right - left;
			const height = bottom - top;

			// WebGL Y -1
			const webglTop = window.innerHeight - bottom;

			if ( controlRect && controlRect !== "self" ){
				
				if ( controlRect instanceof HTMLElement ){

					// ControlRect is Another HTML element
					// Will be used in pointer normalization
					const { left, right, bottom, top } = controlRect.getBoundingClientRect();

					const width  = right - left;
					const height = bottom - top;


					setSceneRect( { left, top, bottom, width, height } );

				} else {

					// ControlRect is Window
					setSceneRect( { left: 0, top: 0, bottom: 0, width: window.innerWidth, height: window.innerHeight } );

				}
			} else {
				// ControlRect is self
				setSceneRect( { left, top, bottom, width, height } );
			}

			scene.setRect( { x: left, y: webglTop, w: width, h: height } );
		};

		const IONodeID = io.addNode({
			ref: sceneElement,
			onRemoveNode: () => {
				// --- For debugging, delete in production ---
				dispatch( { type: "delete", payload: { id: scene.id } } );
				// parallaxManager.dispose( scene );
				// --- For debugging, delete in production ---
			},
			dispatch: {
				onEnter: () => {
					scene.active = true;
					// --- For debugging, delete in production ---
					dispatch({ type: "change", payload: { id: scene.id, isActive: true } });
					// --- For debugging, delete in production ---
				},
				onExit: () => {
					scene.active = false;
					// --- For debugging, delete in production ---
					dispatch({ type: "change", payload: { id: scene.id, isActive: false } });
					// --- For debugging, delete in production ---
				},
				onInViewport: () => {
					modifySceneRect();
				}
			},
			getBounds: () => {

				const { top, bottom } = sceneElement.getBoundingClientRect();
				
				const start = top + window.scrollY;
				const end = bottom + window.scrollY;

				return { start, end };
			},
		});

		// Initial rect
		modifySceneRect();
		
		return () => {
			if ( IONodeID !== false ){
				io.removeNode( sceneElement );
			}
			scene.active = false;
		};

	}, [ scene ] );

	return { scene, sceneRect, loaded };
}