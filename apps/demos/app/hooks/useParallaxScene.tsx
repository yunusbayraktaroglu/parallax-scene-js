"use client";

import { useRef, useEffect, useState } from "react";
import { ResizeObserver as Polyfill } from '@juggle/resize-observer';
import { ParallaxScene, type ParallaxSceneOptions } from "@pronotron/parallax-scene-js";

import { useParallaxManagerContext } from "./ParallaxManagerProvider";

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

	useEffect( () => {

		const sceneElement = sceneRef.current;

		if ( ! scene || ! sceneElement ) return;

		const ResizeObserver = window.ResizeObserver || Polyfill;

		const ro = new ResizeObserver( () => {
			setSceneX( scene, sceneElement );
		} );

		ro.observe( sceneElement );

		return () => ro.disconnect();

	}, [ scene ] );

	function setSceneX( parallasScene: ParallaxScene, sceneHtml: HTMLDivElement )
	{
		const rect = sceneHtml.getBoundingClientRect();

		const width  = rect.right - rect.left;
		const height = rect.bottom - rect.top;
		const left   = rect.left;
		const top = rect.top;
		const bottom = window.innerHeight - rect.bottom;

		parallasScene.setRect( { x: left, y: bottom, w: width, h: height } );
		setSceneRect( { left: left, top: top, bottom: bottom, width: width, height: height } );
	}

	return { scene, sceneRect, loaded };
}