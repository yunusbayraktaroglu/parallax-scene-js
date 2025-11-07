export {};

declare global
{
	declare module '*.glsl'
	{
		const file: string;
		export default file;
	};

	export type TypedArray =
		| Int8Array
		| Uint8Array
		| Uint8ClampedArray
		| Int16Array
		| Uint16Array
		| Int32Array
		| Uint32Array
		| Float32Array
		| Float64Array;

	export type ContextTypes = "webgl2" | "webgl";

	export type ParallaxRenderingContext = WebGL2RenderingContext | WebGLRenderingContext;

	export type Vector2 = {
		x: number;
		y: number;
	};

	export type Size = {
		w: number;
		h: number;
	};

	export type Rectangle = Vector2 & Size;
}