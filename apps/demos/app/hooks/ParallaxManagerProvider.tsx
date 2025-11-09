"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { ResizeObserver as Polyfill } from '@juggle/resize-observer';
import { ParallaxManager } from "@pronotron/parallax-scene-js";

interface PointerContextProps {
	parallaxController: ParallaxManager;
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
	const [ parallaxController, setParallaxController ] = useState<ParallaxManager | null>( null );

	useEffect(() => {

		if ( ! canvasRef.current ) return;

		const controller = new ParallaxManager( {
			canvas: canvasRef.current!,
			attributes: {
				alpha: true,
				depth: false,
				stencil: false,
				premultipliedAlpha: false
			}
		} );

		const ResizeObserver = window.ResizeObserver || Polyfill;

		const ro = new ResizeObserver( ( entries, observer ) => {
			const { clientWidth, clientHeight } = canvasRef.current!;
			controller.updateResolution( clientWidth, clientHeight );
		} );

		ro.observe( canvasRef.current );

		setParallaxController( controller );

		return () => {
			ro.disconnect();
		};
		
	}, []);

	return (
		<>
			<canvas ref={ canvasRef } className="flex w-full h-full absolute left-0 top-0 z-[-1]" />
			{ parallaxController && (
				<ParallaxManagerContext.Provider value={{ parallaxController }}>
					{ children	}
				</ParallaxManagerContext.Provider>
			) }
		</>
	);
}