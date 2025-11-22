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

export function PronotronParallaxManagerProvider({ children }: { children: React.ReactNode })
{
	const canvasRef = useRef<HTMLCanvasElement>( null );
	const [ parallaxManager, setParallaxManager ] = useState<ParallaxManager | null>( null );

	useLayoutEffect( () => {

		if ( ! canvasRef.current ) return;

		// Create parallax manager
		const parallaxManager = createParallaxManager( {
			canvas: canvasRef.current,
			version: "2",
			attributes: {
				alpha: false,
				depth: false,
				stencil: false,
				premultipliedAlpha: true
			},
			loader: "advanced",
		} );

		setParallaxManager( parallaxManager );

		// Connect resize observer
		const ResizeObserver = window.ResizeObserver || Polyfill;

		const ro = new ResizeObserver( ( entries, observer ) => {
			const { clientWidth, clientHeight } = canvasRef.current!;
			parallaxManager.updateResolution( clientWidth, clientHeight );
		} );

		ro.observe( canvasRef.current );

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
			<canvas ref={ canvasRef } className="flex w-full h-full fixed left-0 top-0 z-[-1]" />
			{ parallaxManager && (
				<ParallaxManagerContext value={{ parallaxManager }}>
					{ children	}
				</ParallaxManagerContext>
			) }
		</>
	);
}