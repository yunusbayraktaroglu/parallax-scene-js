export {};

declare global {

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

	export type GlTypes = WebGL2RenderingContext | WebGLRenderingContext;

	export type Vector2 = {
		x: number;
		y: number;
	}

	export type Resolution2 = {
		w: number;
		h: number;
	}

	export type Resolution4 = {
		x: number;
		y: number;
		w: number;
		h: number;
	}

	export type SceneOption = {
		imageUrl: string;
		parallax: Vector2;
		translate?: Vector2;
		fit?: Resolution2;
	}

	export type ParallaxItemOptions = SceneOption & {
		imageUrl: string;
		atlas: { 
			x: number; 
			y: number; 
			w: number; 
			h: number;
			ratio: number;
		};
	}

	export interface IBufferAttribute {
		name: string;
		array: TypedArray;
		itemSize: number;
		count: number;
		getX( index: number ): number;
		applyPos( m: Matrix3 ): void;
	}

	export interface IInterleavedBufferAttribute {
		name: string;
		data: IInterleavedBuffer;
		itemSize: number;
		offset: number;
		setXY( index: number, x: number, y: number )
	}

	export interface IInterleavedBuffer {
		name: string;
		array: TypedArray;
		count: number;
		stride: number;
	}


}