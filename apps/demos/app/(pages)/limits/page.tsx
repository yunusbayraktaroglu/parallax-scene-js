"use client";

import { type ParallaxSceneLayer } from "@pronotron/parallax-scene-js";

import { ParallaxScene } from "@/app/components/ParallaxScene";

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

/**
 * Demo displays control bounds
 * 
 * @todo
 * Add regression testing to that page
 * 
 * @todo
 * 'limitControl': true
 * 'controlRect': window
 * 
 * - generates control bug, limit control can only active if target is not 'window'
 * - limit control should be connected with controlRect not self? (and if window it should disabled) 
 */
export default function LimitsPage()
{
	return (
		<main className="flex h-full w-full p-spacing-base landscape:p-spacing-xl">
			<ParallaxScene 
				id="#limits-scene" 
				layers={ SCENE_01_LAYERS }
				controlType="standard"
				// controlRect="window"
				limitControl={ false }
			/>
		</main>
	);
}