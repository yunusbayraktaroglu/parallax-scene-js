# parallax-scene-js

Create **raw WebGL** parallax scenes with only **1 draw call**. The aim of the project is to create parallax scenes can run **smoothly even very low-end mobile devices**.

Supports WebGL 1 & 2. 
Bundle size < 20 kb.

Live: [https://yunusbayraktaroglu.github.io/parallax-scene-js/](https://yunusbayraktaroglu.github.io/parallax-scene-js/)

### Usage

```html
<div data-parallax-scene='[{"imageUrl":"images/parallax-1.png","parallax":{"x":0.3,"y":1},"fit":{"h":1.075}},{"imageUrl":"images/parallax-2.png","parallax":{"x":0.6,"y":1},"fit":{"h":1.05}},{"imageUrl":"images/parallax-3.png","parallax":{"x":0.6,"y":1},"fit":{"h":1.05}},{"imageUrl":"images/parallax-motor.png","parallax":{"x":1,"y":1},"fit":{"h":1.025}},{"imageUrl":"images/parallax-light.png","parallax":{"x":1,"y":1},"translate":{"x":-0.25},"fit":{"h":1.5}}]'></div>
```

### Import & Setup

```html
<script src="./parallax-scene.umd.cjs"></script>
```

```javascript
const canvas = document.getElementById( "canvas" );
const parallaxManager = new window.ParallaxManager( canvas );

// Collects all ['data-parallax-scene']
parallaxManager.setup( () => {
	parallaxManager.activateScene( 0 );
	parallaxManager.start();

	window.addEventListener( "resize", () => {
		parallaxManager.updateResolution();
	} );
} );
```
