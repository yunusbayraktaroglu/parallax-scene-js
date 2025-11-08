"use client";

import { useRef, useEffect, useState } from "react";
import { ParallaxManager, ParallaxScene, ParallaxSceneLayer } from "@pronotron/parallax-scene-js";
import { ResizeObserver as Polyfill } from '@juggle/resize-observer';

import { usePointerDataContext } from "./hooks/PointerDataProvider";

const prlx = { x: 1, y: 1 };

const basicData: ParallaxSceneLayer[] = [
	{
		url: "images/parallax-1.png",
		sizeInBytes: 548864,
		parallax: { x: 0.7, y: 1 },
		fit: { h: 1.5 }
	},
	{
		url: "images/parallax-3.png",
		sizeInBytes: 430882,
		parallax: { x: 0.8, y: 1 },
		fit: { h: 1.5 }
	},
	{
		url: "images/parallax-motor.png",
		sizeInBytes: 425055,
		parallax: { x: 1, y: 1 },
		fit: { h: 1.5 }
	},
];

export default function HomePage()
{
	const { pointerState, pointerTargetInteractable, pointerEasedPosition } = usePointerDataContext();

	const PARALLAX_MANAGER = useRef<ParallaxManager>( null );

	const canvasRef = useRef<HTMLCanvasElement>( null );
	const sceneRef = useRef<HTMLDivElement>( null );

	const [ scene, setScene ] = useState<ParallaxScene>();
	const [ loaded, setLoaded ] = useState( 0 );

	useEffect(() => {

		if ( PARALLAX_MANAGER.current || ! canvasRef.current ) return;

		// 1. CREATE PARALLAX MANAGER
		PARALLAX_MANAGER.current = new ParallaxManager( {
			canvas: canvasRef.current!,
			attributes: {
				alpha: true,
				depth: false,
				stencil: false,
				premultipliedAlpha: false
			}
		} );

		// 2. ADD OBSERVER TO CANVAS
		const ResizeObserver = window.ResizeObserver || Polyfill;
		const ro = new ResizeObserver( ( entries, observer ) => {
			const { clientWidth, clientHeight } = canvasRef.current!;
			PARALLAX_MANAGER.current!.updateResolution( clientWidth, clientHeight );
		} );
		ro.observe( canvasRef.current );

		// 3. LOAD SCENE
		const loadScene = async () => {
			try {
				const PARALLAX_SCENE = await PARALLAX_MANAGER.current!.initScene( basicData, ( percent: number ) => {
					setLoaded( percent );
					//console.log( `Loaded: %${ percent }` );
				} );
				setScene( PARALLAX_SCENE );
			} catch( error ){
				throw error;
			}
		};

		loadScene();

		return () => ro.unobserve( canvasRef.current! );

	}, []);

	/**
	 * Start render scene after load
	 */
	useEffect(() => {

		if ( scene ){

			let animationFrameId = 0;

			const tick = () => {
				PARALLAX_MANAGER.current!.render();
				animationFrameId = requestAnimationFrame( tick );
			};

			animationFrameId = requestAnimationFrame( tick );

		}

	}, [ scene ])

	useEffect(() => {
		if ( ! canvasRef.current ) return;
		const { clientWidth, clientHeight } = canvasRef.current;
		scene?.setPointer( pointerEasedPosition.x / clientWidth, pointerEasedPosition.y / clientHeight );
	}, [ pointerEasedPosition ]);

	useEffect(() => {

		if ( ! scene ) return;

		const ResizeObserver = window.ResizeObserver || Polyfill;
		const ro = new ResizeObserver( ( entries, observer ) => {
			
			const rect = sceneRef.current!.getBoundingClientRect();
			const width  = rect.right - rect.left;
			const height = rect.bottom - rect.top;
			const left   = rect.left;
			const bottom = canvasRef.current!.clientHeight - rect.bottom;
			
			const { clientWidth, clientHeight } = canvasRef.current!;

			scene.setRect( { x: left, y: bottom, w: width, h: height } );
			//scene.setRect( { x: 0, y: 0, w: clientWidth, h: clientHeight } );
		} );
		ro.observe( canvasRef.current! );


		// // 2. ADD OBSERVER TO SCENE
		// const ResizeObserver = window.ResizeObserver || Polyfill;
		// const ro = new ResizeObserver( () => {

		// 	const rect = sceneRef.current!.getBoundingClientRect();

		// 	const width  = rect.right - rect.left;
		// 	const height = rect.bottom - rect.top;
		// 	const left   = rect.left;
		// 	const bottom = canvasRef.current!.clientHeight - rect.bottom;

		// 	scene.setRect( { x: left, y: bottom, w: width, h: height } );
		// } );

		// ro.observe( sceneRef.current! );

		return () => ro.unobserve( canvasRef.current! );

	}, [ scene ]);

	return (
		<div className="flex w-screen h-screen">
			<canvas ref={ canvasRef } className="flex w-full h-full absolute left-0 top-0 z-[-1]" />
			<div id="content" className="m-3">
				<div ref={ sceneRef } className="w-[500px] h-[500px] border"></div>
				<div className="label">
					<h1 className="text-white">Parallax Scene JS - 01</h1>
					<h1 className="text-black">{ loaded }</h1>
				</div>
			</div>
		</div>
	);
}