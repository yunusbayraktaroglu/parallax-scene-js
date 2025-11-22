"use client";

import { type ParallaxSceneLayer } from "@pronotron/parallax-scene-js";

import { ParallaxScene } from "@/app/components/ParallaxScene";

const HOME_PAGE_SCENE_LAYERS: ParallaxSceneLayer[] = [
	{
		url: "images/parallax-1.png",
		sizeInBytes: 548864,
		parallax: { x: 0.3, y: 1 },
		fit: { h: 1.075 }
	},
		{
		url: "images/parallax-2.png",
		sizeInBytes: 471647,
		parallax: { x: 0.6, y: 1 },
		fit: { h: 1.05 }
	},
	{
		url: "images/parallax-3.png",
		sizeInBytes: 430882,
		parallax: { x: 0.6, y: 1 },
		fit: { h: 1.05 }
	},
	{
		url: "images/parallax-light.png",
		sizeInBytes: 343443,
		parallax: { x: 0.8, y: 1 },
		fit: { h: 1.25 }
	},
	{
		url: "images/parallax-motor.png",
		sizeInBytes: 425055,
		parallax: { x: 1, y: 1 },
		fit: { h: 1.025 }
	},
	{
		url: "images/parallax-light.png",
		sizeInBytes: 343443,
		parallax: { x: 1, y: 1 },
		translate: { x: -0.25},
		fit: { h: 1.5 }
	},
];

export default function HomePage()
{
	return (
		<main className="flex h-full w-full p-spacing-xl">
			<ParallaxScene 
				layers={ HOME_PAGE_SCENE_LAYERS } 
				id="#home-scene" 
				controlRect="window"
				controlType="standard" 
				limitControl={ false }
			/>
		</main>
	);
}