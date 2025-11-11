"use client";

import { useEffect } from "react";
import { type ParallaxSceneLayer, type ParallaxSceneOptions } from "@pronotron/parallax-scene-js";

import { useParallaxManagerContext } from "./hooks/ParallaxManagerProvider";

import { ParallaxScene } from "./components/ParallaxScene";

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

export default function HomePage()
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
			<ParallaxScene id={ "#0" } layers={ SCENE_01_LAYERS } />
		</div>
	);
}