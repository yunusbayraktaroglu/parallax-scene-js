"use client";

import { useEffect, useState } from "react";
import { type ParallaxSceneOptions } from "@pronotron/parallax-scene-js";

import { usePointerContext } from "../hooks/PointerProvider";
import { ParallaxScene } from "./ParallaxScene";

type ParallaxSceneDelayedProps = ParallaxSceneOptions & {
	/**
	 * Scene load will be waiting for given seconds
	 */
	delay: number;
};

export function ParallaxSceneDelayed( { id, layers, delay }: ParallaxSceneDelayedProps )
{
	const { animatorRef } = usePointerContext();

	const [ displayScene, setDisplayScene ] = useState( false );
	const [ countdown, setCountDown ] = useState( 0 );

	useEffect( () => {

		const animator = animatorRef.current;

		if ( ! animator ) return;

		animator.add( {
			id: "Countdown",
			duration: 5.0,
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
			<div className="border parallaxScene flex items-center justify-center text-center">
				<div className="label p-spacing-sm rounded-xl bg-white">
					<h1 className="text-black text-sm">{ countdown }</h1>
				</div>
			</div>
		)
	}

	return <ParallaxScene id={ id } layers={ layers } />;
}