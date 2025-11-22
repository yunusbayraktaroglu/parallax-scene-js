"use client";

import { createContext, useContext, useEffect, useState, useRef } from "react";
import { createBasePointer, createHoldablePointer } from "@pronotron/pointer";
import { PronotronAnimator, PronotronClock, isTouchDevice } from "@pronotron/utils";

export const defaultPointerSettings = {
	tapThreshold: 0.25,
	idleThreshold: 0.5,
	holdThreshold: 0.1,
	movingDeltaLimit: 10,
};

type PointerController = ReturnType<typeof createBasePointer> | ReturnType<typeof createHoldablePointer>;

interface PointerContextProps {
	pointerController: PointerController;
	animatorRef: React.RefObject<PronotronAnimator>;
};

const PointerContext = createContext<PointerContextProps | undefined>( undefined );

export const usePointerContext = () => {
	const context = useContext( PointerContext );
	if ( ! context ){
	  	throw new Error( "usePointerContext must be used within a PronotronPointerProvider" );
	}
	return context;
};

export function PronotronPointerProvider({ children }: { children: React.ReactNode })
{
	const clock = useRef( new PronotronClock() );
	const animator = useRef( new PronotronAnimator( clock.current ) );

	const [ pointerController, setPointerController ] = useState<PointerController>( null ! );

	/**
	 * Pointer controller setup
	 */
	useEffect( () => {

		/**
		 * Uses isTouchDevice() internally and decides the model.
		 * Can be created with:
		 * 
		 * createHoldablePointer( settings, "mouse" | "touch" );
		 * createBasePointer( settings, "mouse" | "touch" );
		 */
		const POINTER_CONTROLLER = createHoldablePointer( {
			...defaultPointerSettings,
			// Start at screen center
			startPosition: {
				x: window.innerWidth / 2,
				y: window.innerHeight / 2,
			},
			target: window.document.body,
			animator: animator.current,
			clock: clock.current,
			isInteractable: ( target: HTMLElement ) => {

				// @ts-expect-error - _test
				POINTER_CONTROLLER._test = target.closest( ".parallaxScene" );

				// If target inside an <a>, <button> or .holdable return true
				if ( target.closest( "a" ) || target.closest( "button" ) || target.closest( ".holdable" ) ){
					return true;
				}
				return false;
	
			},
			isHoldable: ( target: HTMLElement ) => {
				return target.closest( ".parallaxScene" ) ? true : false;
			},
		} );

		POINTER_CONTROLLER.startEvents();

		let animationFrameId = 0;

		const tick = () => {
			const deltaTime = clock.current.tick();
			animator.current.tick();
			animationFrameId = requestAnimationFrame( tick );
		};

		animationFrameId = requestAnimationFrame( tick );

		const handleVisibilityChange = () => {
			if ( document.hidden ){
				clock.current.pause();
			} else {
				clock.current.resume();
			}
		};

		document.addEventListener( 'visibilitychange', handleVisibilityChange );

		setPointerController( POINTER_CONTROLLER );

		return () => {
			cancelAnimationFrame( animationFrameId );
			document.removeEventListener( 'visibilitychange', handleVisibilityChange );
			POINTER_CONTROLLER.stopEvents();
		};
		
	}, [] );

	/**
	 * CustomEvent listeners
	 */
	useEffect( () => {

		const holdHandler = ( event: CustomEvent ) => {
			document.documentElement.classList.add( "holding" );
			console.log( "HOLD", event );
		};
		const holdendHandler = ( event: CustomEvent ) => {
			document.documentElement.classList.remove( "holding" );
			console.log( "HOLD-END", event );
		};
		const tapHandler = ( event: CustomEvent ) => {
			console.log( "TAP", event );
		};

		//window.document.body.addEventListener( "hold", holdHandler as EventListener );
		//window.document.body.addEventListener( "holdend", holdendHandler as EventListener );
		//window.document.body.addEventListener( "tap", tapHandler as EventListener );

		return () => {
			//window.document.body.removeEventListener( "hold", holdHandler as EventListener );
			//window.document.body.removeEventListener( "holdend", holdendHandler as EventListener );
			//window.document.body.removeEventListener( "tap", tapHandler as EventListener );
		}

	}, [] );

	if ( ! pointerController ){
		return null;
	}

	return (
		<PointerContext value={{ pointerController, animatorRef: animator }}>
			{ children }
		</PointerContext>
	);
}