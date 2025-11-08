# parallax-scene-js

[![NPM Package][npm]][npm-url]
[![Build Size][build-size]][build-size-url]
[![Codecov][codecov-pointer]][codecov-url-pointer]

Create **raw WebGL** parallax scenes with only **1 draw call**. The aim of the project is to create parallax scenes can run **smoothly even very low-end mobile devices**.

Supports WebGL 1 & 2.

<pre>npm i <a href="https://www.npmjs.com/package/@pronotron/parallax-scene-js" target="_blank">@pronotron/parallax-scene-js</a></pre>

<br/>

https://github.com/yunusbayraktaroglu/parallax-scene-js/assets/25721593/03b2734f-f50b-41c9-a172-b1118c52e2e9

Live: [https://yunusbayraktaroglu.github.io/parallax-scene-js/](https://yunusbayraktaroglu.github.io/parallax-scene-js/)
<br /><br />

### Setup
```typescript
import { ParallaxScene, AdvancedAssetLoader, BasicAssetLoader } from "@pronotron/parallax-scene-js";

const MANAGER = new ParallaxScene({
	canvas: HTMLCanvasElement,
	attributes: {
		alpha: true
	},
	// Basic or Advanced loader. Advanced supports onProgress event
	loader: AdvancedAssetLoader
});

const SCENE_SETTINGS = [
    // The first object in the array represents the bottom-most layer
    { 
        url: 'images/parallax-1.png',
        fit: {
            h: 1.5 // Scale the layer to 1.5 times the height of the canvas while maintaining its ratio
        },
        parallax: {
            x: 0.3,
            y: 1 // Move the layer without it moving out of the canvas.
        },
        translate: {
            x: -0.25, // Position the layer respective to its size
        }
    },
    items...
];

const PARALLAX_SCENE = await MANAGER.initScene( SCENE_SETTINGS );

// Now scene is renderable
MANAGER.renderScene( PARALLAX_SCENE );
```

<br/><br/>
https://github.com/yunusbayraktaroglu/parallax-scene-js/assets/25721593/03b2734f-f50b-41c9-a172-b1118c52e2e9
<br/><br/>
<br/><br/>
See [CONTRIBUTING ↗](.github/CONTRIBUTING.md)

<div align="right">
	<sub>Created by <a href="https://www.linkedin.com/in/yunusbayraktaroglu/">Yunus Bayraktaroglu</a> with ❤️</sub>
</div>

[npm]: https://img.shields.io/npm/v/@pronotron/parallax-scene-js
[npm-url]: https://www.npmjs.com/package/@pronotron/parallax-scene-js
[build-size]: https://badgen.net/bundlephobia/minzip/@pronotron/parallax-scene-js
[build-size-url]: https://bundlephobia.com/result?p=@pronotron/parallax-scene-js
[codecov-pointer]: https://codecov.io/gh/yunusbayraktaroglu/parallax-scene-js/branch/main/graph/badge.svg
[codecov-url-pointer]: https://app.codecov.io/gh/yunusbayraktaroglu/parallax-scene-js