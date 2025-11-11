"use client";

import { useRef, useEffect, useState } from "react";
import { type ParallaxSceneLayer, type ParallaxSceneOptions } from "@pronotron/parallax-scene-js";

import { usePointerDataContext } from "./hooks/PointerDataProvider";
import { useParallaxManagerContext } from "./hooks/ParallaxManagerProvider";
import { useParallaxScene } from "./hooks/useParallaxScene";
import { usePointerTargetContext } from "./hooks/PointerTargetProvider";

const SCENE_01_LAYERS: ParallaxSceneLayer[] = [
	{
		url: "images/parallax-1.png",
		sizeInBytes: 548864,
		parallax: { x: 0.7, y: 1 },
		fit: { h: 1.1 }
	},
	{
		url: "images/parallax-3.png",
		sizeInBytes: 430882,
		parallax: { x: 0.8, y: 1 },
		fit: { h: 1.1 }
	},
	{
		url: "images/parallax-motor.png",
		sizeInBytes: 425055,
		parallax: { x: 1, y: 1 },
		fit: { h: 1.1 }
	},
];

const SCENE_02_LAYERS: ParallaxSceneLayer[] = [
	{
		url: "images/parallax-1.png",
		sizeInBytes: 548864,
		parallax: { x: 0.7, y: 1 },
		fit: { h: 1.1 }
	},
	{
		url: "images/parallax-2.png",
		sizeInBytes: 471647,
		parallax: { x: 0.8, y: 1 },
		fit: { h: 1.1 }
	},
	{
		url: "images/parallax-motor.png",
		sizeInBytes: 425055,
		parallax: { x: 1, y: 1 },
		fit: { h: 1.1 }
	},
];

export default function HomePage()
{
	const { parallaxController } = useParallaxManagerContext();

	/**
	 * Start render scene after load
	 */
	useEffect( () => {

		let animationFrameId = 0;

		const tick = () => {
			parallaxController.render();
			animationFrameId = requestAnimationFrame( tick );
		};

		animationFrameId = requestAnimationFrame( tick );

		return () => cancelAnimationFrame( animationFrameId );

	}, [] );

	return (
		<div className="grid grid-cols-2 grid-rows-1 gap-spacing-xs w-full h-full">
			<ParallaxScene id={ "#0" } layers={ SCENE_01_LAYERS } />
			<ParallaxScene id={ "#1" } layers={ SCENE_02_LAYERS } />
		</div>
	);
}


function ParallaxScene({ id, layers }: ParallaxSceneOptions )
{
	const sceneRef = useRef<HTMLDivElement>( null ! );

	const { scene, sceneRect, loaded } = useParallaxScene( { id, layers }, sceneRef );
	const { pointerEasedPosition, pointerPosition, pointerDelta } = usePointerDataContext();

	const { pointerTarget, setPointerTarget } = usePointerTargetContext();

	useEffect(() => {

		if ( ! scene ) return;

		if ( pointerTarget !== sceneRef.current ){
			return;
		}

		//console.log( pointerDelta )

		const xDelta = scene.pointer.x + pointerDelta.x * 0.005;
		const yDelta = scene.pointer.y + pointerDelta.y * 0.005;

		let x = xDelta;
		let y = yDelta;
		
		x = Math.min( Math.max( x, 0 ), 1 );
		y = Math.min( Math.max( y, 0 ), 1 );

		scene.setPointer( x, y );

		return () => {
			// Do not dispose scene for later uses
			// scene.active = false;
		}

	}, [ sceneRect, pointerEasedPosition ]);

	return (
		<div ref={ sceneRef } className="border parallaxScene">
			<div className="label p-3">
				<h1 className="text-red">Scene { id }</h1>
				<h1 className="text-black">{ loaded }</h1>
			</div>
		</div>
	);
}


