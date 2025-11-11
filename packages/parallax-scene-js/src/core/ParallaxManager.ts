import { GLController } from './controllers/GLController';
import { GLOBAL_UNIFORMS, RenderController } from './controllers/RenderController';
import { ResourceController } from './controllers/ResourceController';

import { BasicAssetLoader } from './loaders/basic/BasicAssetLoader';
import { AdvancedAssetLoader } from './loaders/advanced/AdvancedAssetLoader';

import { ParallaxScene, type ParallaxLayer, type ParallaxSceneLayer } from './components/ParallaxScene';
import { DEFAULT_MATERIAL } from './components/Material';

/**
 * Options for creating a new ParallaxScene.
 */
export type ParallaxSceneOptions = {
	/**
	 * Unique scene identifier used to prevent duplicate resource allocation.
	 */
	id: string,
	/**
	 * Scene layers defining depth and parallax data.
	 */
	layers: ParallaxSceneLayer[];
};

/**
 * Dependencies required for ParallaxManager operation.
 */
export type ParallaxManagerDeps = {
	glController: GLController;
	renderController: RenderController;
	resourceController: ResourceController;
	loader: AdvancedAssetLoader | BasicAssetLoader;
};

/**
 * Manages creation, rendering, and disposal of multiple ParallaxScene instances.
 */
export class ParallaxManager
{	
	scenes: Map<string, ParallaxScene> = new Map();

	/**
	 * Internal asset loader instance.
	 * @internal
	 */
	private _loadController: BasicAssetLoader | AdvancedAssetLoader;

	/**
	 * Internal WebGL controller.
	 * @internal
	 */
	private _glController: GLController;

	/**
	 * Internal render controller.
	 * @internal
	 */
	private _renderController: RenderController;

	/**
	 * Internal resource controller.
	 * @internal
	 */
	private _resourceController: ResourceController;

	/**
	 * Initializes a new ParallaxManager instance with required dependencies.
	 * 
	 * @param dependencies - An object containing all required controllers:
	 *   - loader: Asset loader (BasicAssetLoader or AdvancedAssetLoader) for downloading scene images.
	 *   - glController: WebGL context controller.
	 *   - renderController: Handles rendering of ParallaxScene instances.
	 *   - resourceController: Manages image and texture resources on the GPU and CPU.
	 */
	constructor( dependencies: ParallaxManagerDeps )
	{
		this._loadController = dependencies.loader;
		this._glController = dependencies.glController;
		this._renderController = dependencies.renderController;
		this._resourceController = dependencies.resourceController;
	}

	/**
	 * Initializes and loads a new ParallaxScene.
	 * Downloads assets, merges textures, and creates GPU resources.
	 * 
	 * @param scene Scene configuration options.
	 * @param onProgress Optional callback for loading progress percentage.
	 * @returns The initialized ParallaxScene instance.
	 */
	async initScene( scene: ParallaxSceneOptions, onProgress?: ( percent: number ) => void ): Promise<ParallaxScene>
	{
		try {

			const { id, layers } = scene;

			// Check if the scene already exists in the manager
			if ( this.scenes.has( id ) ){

				//console.log( `Scene: '${ id }' is exist` );

				const sceneCache = this.scenes.get( id )!;
				sceneCache.active = true;

				return sceneCache;

			}

			// 1. Download scene assets
			const images = await this._loadController.loadImagesAsync( layers, onProgress );

			// Merge all images into a single ImageBitmap
			const { image, data, hash } = await this._resourceController.merge( images, { alpha: true } );
			//image.close();

			// Create a WebGL texture from the merged image
			const mergedImageTexture = this._resourceController.createTexture( hash, image, { premultiplyAlpha: false } );

			// Register resources in the resource controller
			this._resourceController.add( `Merged:${ scene.id }`, image );

			for ( const { url, file } of images ){
				/**
				 * @TODO
				 * - Close ImageBitmaps to release memory.
				 * - Provide option for user to dispose ImageBitmaps if not reused.
				 * 
				 * file.close(); 
				 */
				this._resourceController.add( url, file );				
			}

			// Build layer data for ParallaxScene construction
			const finalSceneData: ParallaxLayer[] = layers.map( ( layerOption, index ) => {

				const atlas = data.atlas.find( atlasLayer => atlasLayer.id === layerOption.url );

				if ( ! atlas ) throw new Error( `Texture packing error` );

				return {
					// Expand with index: allows multiple uses of same image URL in one scene
					id: `${ layerOption.url }_${ index }`,
					settings: layerOption,
					atlas: atlas,
					ratio: atlas.w / atlas.h,
				};

			} );

			const parallaxScene = new ParallaxScene( {
				id: id,
				layers: finalSceneData,
				texture: mergedImageTexture,
				material: DEFAULT_MATERIAL
			} );

			this.scenes.set( parallaxScene.id, parallaxScene );

			return parallaxScene;

		} catch( error ){

			throw error;
		
		}
	}

	/**
	 * Updates renderer and uniform resolution when the canvas is resized.
	 * 
	 * @param width Canvas width in pixels.
	 * @param height Canvas height in pixels.
	 * @param pixelRatio Optional pixel ratio for HiDPI displays.
	 */
	updateResolution( width: number, height: number, pixelRatio: number = 1.0 )
	{
		this._renderController.setPixelRatio( pixelRatio );
		this._renderController.updateResolution( width, height );
		GLOBAL_UNIFORMS.u_resolution.value.x = width;
		GLOBAL_UNIFORMS.u_resolution.value.y = height;
	}

	/**
	 * Disposes a ParallaxScene and frees its GPU and CPU resources.
	 * 
	 * @info Use `scene.active = false` for temporary deactivation instead of disposal.
	 * @param scene Scene to be disposed.
	 */
	dispose( scene: ParallaxScene )
	{
		// Dispose individual ImageBitmaps
		for ( const layer of scene.settings.layers ){

			// @bug, we are modifying id by #0, #1 above
			this._resourceController.deleteImage( layer.id );
		}

		// Remove merged atlas ImageBitmap
		this._resourceController.deleteImage( `Merged:${ scene.id }` );

		// Release GPU buffers and textures
		this._renderController.dispose( scene );

		// Remove scene reference from manager
		this.scenes.delete( scene.id );

		console.warn( `Scene '${ scene.id }' disposed.` );
	}

	/**
	 * Renders all active ParallaxScenes managed by this instance.
	 */
	render()
	{
		const gl = this._glController.gl;

		gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT );

		this.scenes.forEach( scene => {
			if ( scene.active ){
				this._renderController.render( scene );
			}
		} );
	}

}