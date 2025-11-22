"use client";

import { type ParallaxSceneLayer } from "@pronotron/parallax-scene-js";

import { ParallaxScene } from "@/app/components/ParallaxScene";

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

export default function IntersectionPage()
{
	return (
		<main className="w-full p-spacing-lg space-y-spacing-lg">
			<div className="bg-slate-300 p-spacing-lg py-[20vh] rounded-4xl space-y-spacing-xs">
				<h1>This is an observing demo</h1>
				<p>Parallax Scenes can be appear anywhere on the screen. Following parallax-scenes will be stop rendering when they are not visible. See `Scenes Debug`.</p>
				<p>Utilizes <a className="text-link" href="https://www.npmjs.com/package/@pronotron/io" target="_blank">@pronotron/io</a></p>
			</div>
			<div className="flex">
				<div className="w-full landscape:w-2/3 h-150 border relative">
					<p className="absolute left-0 top-0 p-spacing-xs m-spacing-xs bg-white text-xs rounded-lg">#scene-1</p>
					<ParallaxScene 
						layers={ SCENE_01_LAYERS } 
						id="#scene-1" 
						controlType="standard" 
						limitControl={ false } 
					/>
				</div>
				<div className="flex items-center justify-center w-1/3 bg-slate-300 p-spacing-lg py-[20vh] rounded-4xl ml-spacing-lg portrait:hidden">
					<h1>Another space</h1>
				</div>
			</div>

			<div className="bg-slate-300 p-spacing-lg py-[20vh] rounded-4xl">
				<h1>Another space</h1>
			</div>
			<div className="flex">
				<div className="flex items-center justify-center w-1/3 bg-slate-300 p-spacing-lg py-[20vh] rounded-4xl mr-spacing-lg portrait:hidden">
					<h1>Another space</h1>
				</div>
				<div className="w-full landscape:w-2/3 h-150 border relative">
					<p className="absolute left-0 top-0 p-spacing-xs m-spacing-xs bg-white text-xs rounded-lg">#scene-2</p>
					<ParallaxScene 
						layers={ SCENE_02_LAYERS } 
						id="#scene-2" 
						controlType="glide"
					/>
				</div>
			</div>
		</main>
	);
}
