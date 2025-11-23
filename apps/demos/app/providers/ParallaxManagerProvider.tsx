"use client";

import { createContext, useContext, useLayoutEffect, useEffect, useRef, useState } from "react";
import { ResizeObserver as Polyfill } from '@juggle/resize-observer';
import { ParallaxManager, createParallaxManager } from "@pronotron/parallax-scene-js";

interface PointerContextProps {
	parallaxManager: ParallaxManager;
};

const ParallaxManagerContext = createContext<PointerContextProps | undefined>( undefined );

export const useParallaxManagerContext = () => {
	const context = useContext( ParallaxManagerContext );
	if ( ! context ){
	  	throw new Error( "useParallaxManagerContext must be used within a PronotronParallaxManagerProvider" );
	}
	return context;
};

export function PronotronParallaxManagerProvider( { children }: { children: React.ReactNode } )
{
	const canvasRef = useRef<HTMLCanvasElement>( null );
	const canvasWrapperRef = useRef<HTMLDivElement>( null );

	const [ parallaxManager, setParallaxManager ] = useState<ParallaxManager | null>( null );

	/**
	 * 'useLayoutEffect' runs synchronously before React mutates the DOM. 
	 * This guarantees ro.disconnect() will execute while canvasWrapperElement is still attached.
	 */
	useLayoutEffect( () => {

		const canvasElement = canvasRef.current;
		const canvasWrapperElement = canvasWrapperRef.current;

		if ( ! canvasElement || ! canvasWrapperElement ) return;

		// Create parallax manager
		const parallaxManager = createParallaxManager( {
			canvas: canvasElement,
			version: "2",
			attributes: {
				alpha: false,
				depth: false,
				stencil: false,
				premultipliedAlpha: false
			},
			loader: "advanced",
			// texturePacker: "skyline"
			// maxTextureSize: 1024 * 2
		} );

		setParallaxManager( parallaxManager );

		// Connect resize observer
		const ResizeObserver = window.ResizeObserver || Polyfill;

		const ro = new ResizeObserver( () => {
			const { clientWidth, clientHeight } = canvasWrapperElement;
			parallaxManager.updateResolution( clientWidth, clientHeight, window.devicePixelRatio || 1 );
		} );

		ro.observe( canvasWrapperElement );

		return () => {
			ro.disconnect();
		};
		
	}, [] );

	/**
	 * Start render loop on ParallaxManager initialization
	 */
	useEffect( () => {

		if ( ! parallaxManager ) return;

		let animationFrameId = 0;

		const tick = () => {
			parallaxManager.render();
			animationFrameId = requestAnimationFrame( tick );
		};

		animationFrameId = requestAnimationFrame( tick );

		return () => cancelAnimationFrame( animationFrameId );

	}, [ parallaxManager ] );

	return (
		<>
			{/* Using a wrapper helps us to set PX dimensions to the <canvas> element */}
			<div id="canvas_wrapper" ref={ canvasWrapperRef } className="fixed flex w-full h-full left-0 top-0 z-[-50]">
				<canvas ref={ canvasRef } />
			</div>
			{ parallaxManager && (
				<ParallaxManagerContext value={{ parallaxManager }}>
					{ children	}
				</ParallaxManagerContext>
			) }
		</>
	);
}