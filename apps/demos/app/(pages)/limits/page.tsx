"use client";

import { useEffect } from "react";
import { type ParallaxSceneLayer, type ParallaxSceneOptions } from "@pronotron/parallax-scene-js";

import { useParallaxManagerContext } from "../../hooks/ParallaxManagerProvider";
import { ParallaxScene } from "../../components/ParallaxScene";

const SCENE_01_LAYERS: ParallaxSceneLayer[] = [
	{
		url: "images/grid.jpg",
		sizeInBytes: 425055,
		parallax: { x: 1, y: 1 },
		fit: { h: 2 }
	},
	{
		url: "images/grid.jpg",
		sizeInBytes: 425055,
		parallax: { x: 1, y: 1 },
		fit: { h: 0.5 }
	},
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

		return () => {
			cancelAnimationFrame( animationFrameId );
		}

	}, [] );

	return (
		<div className="grid grid-cols-1 grid-rows-1 gap-spacing-xs w-full h-full">
			<ParallaxScene id={ "#Limits" } layers={ SCENE_01_LAYERS } />
		</div>
	);
}