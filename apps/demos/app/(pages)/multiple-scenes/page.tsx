"use client";

import { useRef, useEffect, useState } from "react";
import { ParallaxScene as ParallaxSceneType, type ParallaxSceneLayer, type ParallaxSceneOptions } from "@pronotron/parallax-scene-js";

import { usePointerDataContext } from "../../hooks/PointerDataProvider";
import { useParallaxManagerContext } from "../../hooks/ParallaxManagerProvider";
import { useParallaxScene } from "../../hooks/useParallaxScene";

const SCENE_01_LAYERS: ParallaxSceneLayer[] = [
	{
		url: "images/texture-grid.png",
		sizeInBytes: 425055,
		parallax: { x: 1, y: 1 },
		fit: { w: 1.5 }
	},
	// {
	// 	url: "images/texture-grid.png",
	// 	sizeInBytes: 425055,
	// 	parallax: { x: 1, y: 1 },
	// 	fit: { h: 0.5 }
	// },
];

export default function LimitsPage()
{
	const { parallaxController } = useParallaxManagerContext();

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
		<div className="grid grid-cols-1 grid-rows-1 gap-spacing-xs w-full h-full">
			<ParallaxScene id={ "#Limits" } layers={ SCENE_01_LAYERS } />
		</div>
	);
}


function ParallaxScene({ id, layers }: ParallaxSceneOptions )
{
	const sceneRef = useRef<HTMLDivElement>( null ! );

	const { scene, sceneRect, loaded } = useParallaxScene( { id, layers }, sceneRef );

	return (
		<div ref={ sceneRef } className="border border-white parallaxScene">
			<div className="label p-3">
				{ scene && <PointerComponent scene={ scene } sceneRect={ sceneRect } /> }
				<h1 className="text-red">Scene { id }</h1>
				<h1 className="text-black">{ loaded }</h1>
			</div>
		</div>
	);
}



type SceneRect = {
    left: number;
    top: number;
    bottom: number;
    width: number;
    height: number;
};

type PointerComponentProps = {
	sceneRect: SceneRect,
	scene: ParallaxSceneType
};

function PointerComponent({ scene, sceneRect }: PointerComponentProps)
{
	const { pointerEasedPosition } = usePointerDataContext();

	useEffect(() => {

		let x = ( pointerEasedPosition.x - sceneRect.left ) / sceneRect.width;
		let y = ( pointerEasedPosition.y - sceneRect.top ) / sceneRect.height;
		
		x = Math.min( Math.max( x, 0 ), 1 );
		y = Math.min( Math.max( y, 0 ), 1 );

		scene.setPointer( x, y );

	}, [ sceneRect, pointerEasedPosition ]);

	return null;
}