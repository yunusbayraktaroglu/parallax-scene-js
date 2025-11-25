# parallax-scene-js

[![NPM Package][npm]][npm-url]
[![Build Size][build-size]][build-size-url]
[![Codecov][codecov-parallax-scene-js]][codecov-parallax-scene-js-url]

Create **raw WebGL** parallax scenes with only **1 draw call**. The aim of the project is to create parallax scenes can run **smoothly even very low-end mobile devices**.

Supports WebGL 1 & 2.

<pre>npm i <a href="https://www.npmjs.com/package/@pronotron/parallax-scene-js" target="_blank">@pronotron/parallax-scene-js</a></pre>

<br/>

https://github.com/yunusbayraktaroglu/parallax-scene-js/assets/25721593/03b2734f-f50b-41c9-a172-b1118c52e2e9

Live: [https://yunusbayraktaroglu.github.io/parallax-scene-js/](https://yunusbayraktaroglu.github.io/parallax-scene-js/)
<br /><br />

### Setup
```typescript
import { type ParallaxSceneOptions, createParallaxManager } from "@pronotron/parallax-scene-js";

const MANAGER = createParallaxManager( {
  canvas: HTMLCanvasElement,
  version: "2",
  attributes: {
  alpha: false,
  depth: false,
  stencil: false,
  premultipliedAlpha: false
  },
  /**
   * - advanced: uses AdvancedAssetLoader, supports ProgressEvent, and displays percentage-based progress
   * - basic: uses BasicAssetLoader and provides item-count–based progress
   */
  loader: "advanced",
  /**
   * - binaryTree: uses the binarytree texture packing algorithm
   * - skyline: uses the skyline texture packing algorithm
   * @default 'binaryTree'
   */
  texturePacker?: "binaryTree",
  /**
   * Instead of using the device's MAX_TEXTURE_SIZE,
   * use a custom value:
   * 256, 512, 1024, 2048, 4096, ...
   * Generated textures will be resized to this value.
   * @default number
   */
  maxTextureSize?: 2048
} );

const SCENE_SETTINGS: ParallaxSceneOptions = {
  id: "my_parallax_scene",
  layers: [
  // The first object in the array represents the bottom-most layer
  { 
    url: 'images/parallax-1.png',
    fit: {
    h: 1.5 // Scale the layer to 1.5 times the height of the canvas while maintaining its ratio
    },
    parallax: {
    x: 0.3,
    y: 1 // Keep the layer from moving out of the canvas
    },
    translate: {
    x: -0.25, // Position the layer relative to its size
    }
  },
  items...
  ];
};

const PARALLAX_SCENE = await MANAGER.initScene( SCENE_SETTINGS );
PARALLAX_SCENE.active = true;

// Renders all active scenes
MANAGER.render();
```

<br/><br/>

## Project philosophy

Parallax has been a core visual technique for over 90 years, used since the early days of animation, used in film, animation, and games to create depth and motion. This project continues that tradition in the modern WebGL pushing minimalism, performance, and control over abstraction layers to deliver the most direct and efficient rendering possible.

<br/><br/>
See [CONTRIBUTING ↗](.github/CONTRIBUTING.md)

<div align="right">
  <sub>Created by <a href="https://www.linkedin.com/in/yunusbayraktaroglu/">Yunus Bayraktaroglu</a> with ❤️</sub>
</div>

[npm]: https://img.shields.io/npm/v/@pronotron/parallax-scene-js
[npm-url]: https://www.npmjs.com/package/@pronotron/parallax-scene-js
[build-size]: https://img.shields.io/bundlephobia/minzip/@pronotron/parallax-scene-js
[build-size-url]: https://bundlephobia.com/result?p=@pronotron/parallax-scene-js
[codecov-parallax-scene-js]: https://codecov.io/gh/yunusbayraktaroglu/parallax-scene-js/branch/main/graph/badge.svg
[codecov-parallax-scene-js-url]: https://app.codecov.io/gh/yunusbayraktaroglu/parallax-scene-js