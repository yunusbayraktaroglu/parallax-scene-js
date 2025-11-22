"use client";

import { useEffect, useState } from "react";

import { usePointerContext } from "@/app/providers/PointerProvider";
import { ParallaxSceneProps, ParallaxScene } from "./ParallaxScene";

interface ParallaxSceneDelayedProps extends ParallaxSceneProps {
	/**
	 * The scene load will wait for the specified number of seconds.
	 */
	delay: number;
};

export function ParallaxSceneDelayed( { id, layers, controlType, delay }: ParallaxSceneDelayedProps )
{
	const { animatorRef } = usePointerContext();

	const [ displayScene, setDisplayScene ] = useState( false );
	const [ countdown, setCountDown ] = useState( delay );

	useEffect( () => {

		const animator = animatorRef.current;

		if ( ! animator ) return;

		animator.add( {
			id,
			duration: delay,
			autoPause: true,
			onRender: ( currentTime, startTime, duration ) => {
				const remaining = duration - Math.floor( currentTime - startTime );
				setCountDown( remaining );
			},
			onEnd: ( forced ) => {
				if ( forced ) return;
				setDisplayScene( true );
			}
		} );

	}, [] );

	if ( ! displayScene ){
		return (
			<div className="border flex items-center justify-center text-center">
				<div className="label p-spacing-sm rounded-xl bg-white">
					<h1 className="w-16 h-auto">{ countdown }</h1>
				</div>
			</div>
		)
	}

	return <ParallaxScene id={ id } layers={ layers } controlType={ controlType } />;
}