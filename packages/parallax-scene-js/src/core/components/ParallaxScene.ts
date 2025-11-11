import { type RequireAtLeastOne, type RequireExactlyOne } from "@pronotron/utils";
import { type AtlasResultWithNormalized } from '../packers/BaseTexturePacker';

import { BufferGeometry } from '../geometries/BufferGeometry';
import { ParallaxGeometry } from '../geometries/ParallaxGeometry';
import { mergeGeometries } from '../helpers/mergeGeometries';
import { interleaveAttributes } from '../helpers/attributeInterleaver';

import { BufferAttribute } from '../buffers/BufferAttribute';
import { InterleavedBufferAttribute } from '../buffers/InterleavedBufferAttribute';

import { Material } from "./Material";

/**
 * Configuration used to initialize a {@link ParallaxScene}.
 */
export type ParallaxSceneSettings = Readonly<{
	/**
	 * Unique identifier for this parallax scene.
	 */
	id: string;
	/**
	 * Ordered list of scene layers.
	 */
	layers: ParallaxLayer[];
	/**
	 * Material used for rendering the scene.
	 */
	material: Material;
	/**
	 * Combined WebGL texture containing all layer images.
	 */
	texture: WebGLTexture;
}>;

/**
 * Defines a single layer within a parallax scene.
 */
export type ParallaxLayer = Readonly<{
	/**
	 * Unique identifier for this layer, usually tied to its image source URL. +index
	 */
	id: string;
	/**
	 * Normalized atlas data specifying this layer’s position in the merged texture.
	 */
	atlas: AtlasResultWithNormalized;
	/**
	 * Aspect ratio (width/height) of the source image, used for scaling.
	 */
	ratio: number;
	/**
	 * Layer-specific parallax configuration.
	 */
	settings: ParallaxLayerSettings;
}>;

/**
 * Defines movement, size, and position settings for a parallax layer.
 */
export type ParallaxLayerSettings = Readonly<{
	/**
	 * Controls the relative movement of this layer.
	 * Value `1` means the layer stays within canvas bounds.
	 * 
	 * @example
	 * { x: 0.3, y: 1.0 }
	 */
	parallax: RequireAtLeastOne<Vector2>;
	/**
	 * Optional scaling factor. 
	 * Resizes the layer relative to the canvas while preserving aspect ratio.
	 * 
	 * @example
	 * { h: 1.5 } | { w: 1.3 }
	 */
	fit?: RequireExactlyOne<Size>;
	/**
	 * Optional offset, moving the layer relative to its size.
	 * 
	 * @example
	 * { x: -0.25 }
	 */
	translate?: RequireAtLeastOne<Vector2>;
}>;

/**
 * User-defined data for each parallax scene layer.
 */
export type ParallaxSceneLayer = ParallaxLayerSettings & {
	/**
	 * Absolute or relative image URL of this layer.
	 */
	url: string;
	/**
	 * Expected file size in bytes.
	 * If not provided, the loader will attempt to read the `Content-Length` header.
	 */
	sizeInBytes?: number;
};

/**
 * Base implementation of a parallax scene.
 * Handles geometry creation, resizing, and rendering data management.
 */
export class ParallaxSceneBase
{
	/**
	 * User-defined unique scene identifier.
	 */
	readonly id: string;

	/**
	 * Scene configuration used to initialize this instance.
	 */
	readonly settings: ParallaxSceneSettings;

	/**
	 * Whether the scene should be rendered.
	 */
	active: boolean = true;

	/**
	 * Vertex Array Object created during first rendering.
	 * 
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLVertexArrayObject
	 */
	vao?: WebGLVertexArrayObject | WebGLVertexArrayObjectOES;

	/**
	 * Combined geometry containing all scene layers.
	 */
	geometry: BufferGeometry;

	/**
	 * Material assigned to this scene.
	 */
	material!: Material;

	/**
	 * Merged texture containing all layer images.
	 */
	texture: WebGLTexture;

	/**
	 * **Normalized** pointer position within the scene (0–1 range).
	 * Must be updated externally when the scene moves on screen.
	 * 
	 * @default { x: 0.5, y: 0.5 }
	 */
	pointer: Vector2 = { x: 0.5, y: 0.5 };

	/**
	 * Viewport rectangle in canvas coordinates.
	 * Used for `gl.viewport()` and `gl.scissor()`.
	 * 
	 * @note `y` must represent the bottom in WebGL coordinates (+Y is up).
	 */
	rect: Rectangle = { x: 0, y: 0, w: 0, h: 0 };

	/**
	 * Creates a new parallax scene base instance.
	 * 
	 * @param settings - Configuration object defining scene layers, material, and texture.
	 */
	constructor( settings: ParallaxSceneSettings )
	{
		this.id = settings.id;
		this.settings = settings;

		this.geometry = this._createGeometry( settings.layers );
		this.material = settings.material;
		this.texture = settings.texture;

		this.material.updateUniforms({
			u_texture: {
				value: this.texture
			},
		});
	}

	/**
	 * Updates the normalized pointer position (0–1 range).
	 * 
	 * @param x - Normalized X coordinate.
	 * @param y - Normalized Y coordinate.
	 */
	setPointer( x: number, y: number )
	{
		this.pointer.x = x;
		this.pointer.y = y;
	}

	/**
	 * Updates the scene’s canvas rectangle and resizes accordingly.
	 * 
	 * @param newRect - Updated rectangle dimensions.
	 * @note `y` must represent the bottom in WebGL coordinates.
	 */
	setRect( newRect: Rectangle )
	{
		this.rect = newRect;
		this.resize( newRect.w, newRect.h );
	}

	/**
	 * Updates the layer scaling attributes based on the scene size.
	 * 
	 * @param sceneWidth - Width of the scene in pixels.
	 * @param sceneHeight - Height of the scene in pixels.
	 */
	resize( sceneWidth: number, sceneHeight: number )
	{
		const scaleAttribute = this.geometry.attributes[ "scale" ];

		this._resize( sceneWidth, sceneHeight, scaleAttribute );
	}

	/**
	 * Creates and merges plane geometries for all layers.
	 * 
	 * @param layers - List of parallax layers.
	 * @returns Combined geometry.
	 * @internal
	 */
	private _createGeometry( layers: ParallaxLayer[] ): BufferGeometry
	{
		// Merge parallax geometries
		const parallaxes = [];

		for ( const parallaxLayer of layers ){

			const parallax = new ParallaxGeometry( parallaxLayer );
			parallax.name = parallaxLayer.id;

			if ( parallaxLayer.settings.translate ){
				parallax.translate( parallaxLayer.settings.translate.x, parallaxLayer.settings.translate.y );
			}

			parallaxes.push( parallax );
		}

		// Merge parallaxes
		return mergeGeometries( parallaxes, true );;
	}

	/**
	 * Updates scale attribute with given settings and dimensions.
	 * if {@link ParallaxLayerSettings.fit} is not defined, scale is equal to source image size.
	 * 
	 * @param sceneWidth - Render width.
	 * @param sceneHeight - Render height.
	 * @param scaleAttribute - Geometry scale attribute buffer.
	 * @internal 
	 */
	protected _resize( sceneWidth: number, sceneHeight: number, scaleAttribute: InterleavedBufferAttribute | BufferAttribute ): void
	{
		for ( const { id, ratio, settings } of this.settings.layers ){

			// default scale: image source size
			if ( ! settings.fit ) return;

			let width = 0;
			let height = 0;

			if ( settings.fit.h ){

				height = sceneHeight * settings.fit.h;
				width = height * ratio;

			} else if ( settings.fit.w ){

				width = sceneWidth * settings.fit.w;
				height = width / ratio;

			}

			if ( ! width || ! height ){
				throw new Error( `Scene: ${ this.settings.id }, scaling failed.` );
			}

			width = Math.floor( width );
			height = Math.floor( height );

			// Select the layer geometry in merged geometry
			const layerGeometry = this.geometry.groups.find( planeGeo => planeGeo.id === id )!;

			for ( let i = 0; i < layerGeometry.count; i++ ){

				const indice = this.geometry.index!.getX( layerGeometry.start + i );
				scaleAttribute.setXY( indice, width, height );

			}

		}

		// End of the scale, related buffer must be updated with the new data
		if ( scaleAttribute instanceof InterleavedBufferAttribute ){
			scaleAttribute.data.version++;
		} else {
			scaleAttribute.version++;
		}
	}

}


/**
 * Extended parallax scene that uses interleaved buffer attributes.
 */
export class ParallaxScene extends ParallaxSceneBase
{
	/**
	 * Interleaved geometry attributes.
	 */
	attributes!: InterleavedBufferAttribute[];

	/**
	 * Creates a parallax scene that uses interleaved buffer attributes for better GPU performance.
	 * 
	 * @param settings - Configuration object defining scene layers, material, and texture.
	 */
	constructor( settings: ParallaxSceneSettings )
	{
		super( settings );
		this._interleaveAttributes();
	}

	/**
	 * Resizes the scene and updates interleaved attributes.
	 * 
	 * @param sceneWidth - Width of the scene in pixels.
	 * @param sceneHeight - Height of the scene in pixels.
	 */
	resize( sceneWidth: number, sceneHeight: number )
	{
		// Get scale attribute in InterleavedAttributes
		const scaleAttribute = this.attributes.find( attribute => attribute.name === "scale" )!;

		this._resize( sceneWidth, sceneHeight, scaleAttribute );
	}

	/**
	 * Converts regular geometry attributes into interleaved attributes for performance.
	 * @internal
	 */
	private _interleaveAttributes()
	{
		const attributes = Object.values( this.geometry.attributes ) as BufferAttribute[];
		const interleavedAttributes = interleaveAttributes( attributes );
		
		this.attributes = interleavedAttributes;
	}

}