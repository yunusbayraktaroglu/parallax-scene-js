"use client";

import { type ParallaxSceneLayer } from "@pronotron/parallax-scene-js";

import { ParallaxSceneDelayed } from "@/app/components/ParallaxSceneDelayed";

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
	return (
		<main className="w-full h-full grid grid-cols-2 grid-rows-2 gap-spacing-sm">
			<ParallaxSceneDelayed delay={ 1 } id="#multiple-1" layers={ SCENE_01_LAYERS } controlType="standard" />
			<ParallaxSceneDelayed delay={ 2 } id="#multiple-2" layers={ SCENE_02_LAYERS } controlType="standard" />
			<ParallaxSceneDelayed delay={ 3 } id="#multiple-3" layers={ SCENE_01_LAYERS } controlType="standard" />
			<ParallaxSceneDelayed delay={ 4 } id="#multiple-4" layers={ SCENE_02_LAYERS } controlType="standard" />
		</main>
	);
}