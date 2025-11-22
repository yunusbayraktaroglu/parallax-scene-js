"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { usePointerContext } from "./PointerProvider";

interface PointerDataContextProps {
	pointerPosition: { x: number; y: number };
	pointerEasedPosition: { x: number; y: number };
	pointerDelta: { x: number; y: number };
	pointerDeltaAdditive: { x: number; y: number };
	pointerTargetInteractable: boolean;
	pointerState: string;
};

const PointerDataContext = createContext<PointerDataContextProps | undefined>( undefined );

export const usePointerDataContext = () => {
	const context = useContext( PointerDataContext );
	if ( ! context ){
	  	throw new Error( "usePointerDataContext must be used within a PronotronPointerDataProvider" );
	}
	return context;
};

export function PronotronPointerDataProvider({ children }: { children: React.ReactNode })
{
	const { pointerController } = usePointerContext();

	// Given startPosition option, applies directly to the controller position
	const { x, y } = pointerController.getPosition();

	// Pointer position easing
	const [ pointerPosition, setPointerPosition ] = useState({ x, y });
	const [ pointerEasedPosition, setPointerEasedPosition ] = useState({ x, y });
	const easedPosRef = useRef({ x, y });

	// Pointer delta easing for inertia/glide effect
	const [ pointerDelta, setPointerDelta ] = useState({ x: 0, y: 0 });
	const [ pointerDeltaAdditive, setpointerDeltaAdditive ] = useState({ x: 0, y: 0 });
	const easedDeltaEasedRef = useRef({ x: 0, y: 0 });
	const easedDeltaDistanceRef = useRef({ x: 0, y: 0 });
	
	// Other pointer datas
	const [ pointerState, setPointerState ] = useState( "" );
	const [ pointerTargetInteractable, setPointerTargetInteractable ] = useState<boolean>( false );

	useEffect( () => {
		
		let animationFrameId = 0;

		const tick = () => {

			/**
			 * Ease pointer
			 */
			const currentPointerPosition = pointerController.getPosition();

    		easedPosRef.current.x += ( currentPointerPosition.x - easedPosRef.current.x ) * 0.1;
      		easedPosRef.current.y += ( currentPointerPosition.y - easedPosRef.current.y ) * 0.1;

			setPointerPosition({ x: currentPointerPosition.x, y: currentPointerPosition.y });
			setPointerEasedPosition({ x: easedPosRef.current.x, y: easedPosRef.current.y });

			/**
			 * Accumulates the total, unconsumed delta registered 
			 * from pointer events. This serves as the target position for the
			 * inertia/glide effect.
			 */
			const deltaTarget = pointerController.getDeltaAdditive();

    		easedDeltaDistanceRef.current.x = ( deltaTarget.x - easedDeltaEasedRef.current.x );
      		easedDeltaDistanceRef.current.y = ( deltaTarget.y - easedDeltaEasedRef.current.y );

			easedDeltaEasedRef.current.x += ( easedDeltaDistanceRef.current.x * 0.1 );
			easedDeltaEasedRef.current.y += ( easedDeltaDistanceRef.current.y * 0.1 );

			setPointerDelta( pointerController.getDelta() );
			setpointerDeltaAdditive( easedDeltaDistanceRef.current );

			// Other pointer datas
			setPointerState( pointerController.getState() );
			setPointerTargetInteractable( pointerController.canInteract() );
			
			animationFrameId = requestAnimationFrame( tick );
			
		};

		animationFrameId = requestAnimationFrame( tick );

		return () => {
			cancelAnimationFrame( animationFrameId );
		};

	}, [] );

	return (
		<PointerDataContext
			value={{
				pointerPosition,
				pointerEasedPosition,
				pointerDelta,
				pointerDeltaAdditive,
				pointerTargetInteractable,
				pointerState
			}}
		>
			{ children }
		</PointerDataContext>
	);
}


function lenghtDistance( { x, y }: { x: number, y: number } )
{
	return x + y * x + y;
}