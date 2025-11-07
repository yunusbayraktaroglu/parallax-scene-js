import { type RequireAtLeastOne, type RequireExactlyOne } from "@pronotron/utils";

import { BufferGeometry } from '../geometries/BufferGeometry';
import { ParallaxGeometry } from '../geometries/ParallaxGeometry';
import { mergeGeometries } from '../helpers/mergeGeometries';
import { interleaveAttributes } from '../helpers/attributeInterleaver';

import { type AtlasResultWithNormalized } from '../packers/BaseTexturePacker';
import { BufferAttribute } from '../buffers/BufferAttribute';
import { InterleavedBufferAttribute } from '../buffers/InterleavedBufferAttribute';

import { Material } from "./Material";
import { Camera2D } from "./Camera2D";

/**
 * The settings when creating a new {@link ParallaxScene}
 */
export type ParallaxSceneSettings = Readonly<{
	/**
	 * Unique ID of the parallax scene
	 */
	id: string;
	/**
	 * Each layer in the scene, must be ordered
	 */
	layers: ParallaxLayer[];
	/**
	 * Material will be used in rendering
	 */
	material: Material;
	/**
	 * Merged WebGL texture of the scene layers
	 */
	texture: WebGLTexture;
}>;

/**
 * These options required by user, used for creating each layer of the scene
 */
export type ParallaxLayer = Readonly<{
	/**
	 * Layer ID, probably pointing to layer image URL
	 */
	id: string;
	/**
	 * Where to find layer image in the given merged texture
	 */
	atlas: AtlasResultWithNormalized;
	/**
	 * Layer image source width/height ratio to be able easy resizing
	 */
	ratio: number;
	/**
	 * Parallax settings
	 */
	settings: ParallaxLayerSettings;
}>;

/**
 * These options required by user
 */
export type ParallaxLayerSettings = Readonly<{
	/**
	 * Value: 1 -> Moves the layer without it moving out of the canvas.
	 * 
	 * @example
	 * { x: 0.3, y: 1.0 }
	 */
	parallax: RequireAtLeastOne<Vector2>;
	/**
	 * Scale the layer to 1.5 times the height of the canvas while maintaining its ratio
	 * 
	 * @example
	 * { h: 1.5 } | { w: 1.3 }
	 */
	fit?: RequireExactlyOne<Size>;
	/**
	 * Positions the layer respective to its size
	 * 
	 * @example
	 * { x: -0.25 }
	 */
	translate?: RequireAtLeastOne<Vector2>;
}>;

export type ParallaxSceneLayer = ParallaxLayerSettings & {
	/**
	 * URL of the image of the layer. Absolute or relative
	 */
	url: string;
	/**
	 * Byte value of the URL.
	 * If missing FileLoader checks for 'Content-Length' HTTP header to determine the total size of any asset. 
	 * Try to make sure that your server is setting this on the response, other-wise it will be 0.
	 */
	sizeInBytes?: number;
};

export class ParallaxSceneBase
{
	/**
	 * Unique ID given by user for the scene
	 */
	readonly id: string;

	/**
	 * Used settings to create Parallax Scene
	 */
	readonly settings: ParallaxSceneSettings;

	/**
	 * Vertex Array Object
	 * Will be created by rendering process
	 * 
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/WebGLVertexArrayObject
	 */
	vao?: WebGLVertexArrayObject | WebGLVertexArrayObjectOES;

	/**
	 * Merged geometry using all the layers
	 */
	geometry: BufferGeometry;

	/**
	 * Material
	 */
	material!: Material;

	/**
	 * Merged texture of the scene
	 */
	texture: WebGLTexture;

	/**
	 * Each scene has its own camera to decide {@link Camera2D.zoom}
	 */
	camera: Camera2D;

	/**
	 * **Normalized** pointer position to ParallaxScene,
	 * Scene might be at any position with some offsets in the screen. So must updated by user
	 * 
	 * @default
	 * { x: 0.5, y: 0.5 } // Centered
	 */
	pointer: Vector2 = { x: 0.5, y: 0.5 };

	/**
	 * How to draw on canvas,
	 * Each scene has its own resolution.
	 * to use in `gl.viewport( x, y, w, h )` and `gl.scissor( x, y, w, h )`
	 */
	rect: Rectangle = { x: 0, y: 0, w: 0, h: 0 };

	/**
	 * Build scale with initial rect, it doesnt matter 100 or 1000,
	 * will be adapted new rect by ratio
	 */
	initialRect: Rectangle = { x: 0, y: 0, w: 100, h: 100 };

	constructor( settings: ParallaxSceneSettings )
	{
		this.id = settings.id;
		this.settings = settings;

		this.camera = new Camera2D();
		this.material = settings.material;
		this.texture = settings.texture;
		this.geometry = this._createGeometry( settings.layers );
		
		this.material.updateUniforms({
			u_projection: {
				value: this.camera.getProjectionMatrix()
			},
			u_pointer: {
				value: this.pointer
			},
			u_image0: {
				value: this.texture
			},
		});
	}

	/**
	 * Normalized pointer position `0 - 1`
	 * 
	 * @param x X position 
	 * @param y Y position
	 */
	setPointer( x: number, y: number )
	{
		this.pointer.x = x;
		this.pointer.y = y;
	}

	/**
	 * Set scene rectangle for scene in canvas
	 * @param rect 
	 */
	setRect( newRect: Rectangle )
	{
		console.log( "SET RECT" );

		const newRatio = newRect.w / this.initialRect.w;
		
		this.rect = newRect;
		this.camera.setProjection( newRect.w, newRect.h, newRatio );
		this.material.updateUniforms({
			u_projection: {
				value: this.camera.getProjectionMatrix()
			},
		});
	}

	/**
	 * Updates scale attribute of each layer geometry
	 * 
	 * @param sceneWidth 
	 * @param sceneHeight 
	 */
	resize( sceneWidth: number, sceneHeight: number )
	{
		const scaleAttribute = this.geometry.attributes[ "scale" ];

		this._resize( sceneWidth, sceneHeight, scaleAttribute );
	}

	/**
	 * Creates a basic plane geometry for each layer, 
	 * then returns a single merged geometry with using {@link mergeGeometries}.
	 *  
	 * @param layers Parallax layers
	 * @returns Merged single geometry
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
	 * Updates scale attribute with given settings and dimensions
	 * 
	 * @param sceneWidth Scene render width 
	 * @param sceneHeight Scene render height
	 * @returns 
	 */
	protected _resize( sceneWidth: number, sceneHeight: number, scaleAttribute: InterleavedBufferAttribute | BufferAttribute ): void
	{
		for ( const { id, ratio, settings } of this.settings.layers ){

			/**
			 * Keep default scale of plane if 'fit' option is not defined 
			 * default scale: image source size
			 */
			if ( ! settings.fit ) return;

			let width, height;
				
			if ( settings.fit.h ){

				height = sceneHeight * settings.fit.h;
				width = height * ratio;

			} else if ( settings.fit.w ){

				width = sceneWidth * settings.fit.w;
				height = width / ratio;

			}

			if ( ! width || ! height ) return;

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



export class ParallaxScene extends ParallaxSceneBase
{
	attributes!: InterleavedBufferAttribute[];

	constructor( settings: ParallaxSceneSettings )
	{
		super( settings );
		this._interleaveAttributes();
		this.resize( this.initialRect.w, this.initialRect.h );
	}

	resize( sceneWidth: number, sceneHeight: number )
	{
		const scaleAttribute = this.attributes.find( attribute => attribute.name === "scale" )!;

		this._resize( sceneWidth, sceneHeight, scaleAttribute );
	}

	private _interleaveAttributes()
	{
		const attributes = Object.values( this.geometry.attributes ) as BufferAttribute[];
		const interleavedAttributes = interleaveAttributes( attributes );
		
		this.attributes = interleavedAttributes;
	}

}