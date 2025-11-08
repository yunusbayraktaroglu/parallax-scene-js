import { GLController } from './controllers/GLController';
import { RenderController } from './controllers/RenderController';
import { ResourceController } from './controllers/ResourceController';

import { BasicAssetLoader } from './loaders/basic/BasicAssetLoader';
import { AdvancedAssetLoader } from './loaders/advanced/AdvancedAssetLoader';

import { ParallaxScene, type ParallaxLayer, type ParallaxSceneLayer } from './components/ParallaxScene';
import { DEFAULT_MATERIAL } from './components/Material';

interface PSJManagerOptions
{
	canvas: HTMLCanvasElement;
	/**
	 * WebGL Version
	 * @default 2
	 */
	version?: "1" | "2";
	attributes: WebGLContextAttributes;
	/**
	 * - AdvancedAssetLoader: Supports {@link ProgressEvent} can display percent based progress.
	 * - BasicAssetLoader: Does not supports {@link ProgressEvent}, instead uses item count based progress.
	 */
	loader?: AdvancedAssetLoader | BasicAssetLoader;
};

export class ParallaxManager
{	
	private _glController: GLController;
	private _renderController: RenderController;
	private _loadController: AdvancedAssetLoader;
	private _resourceController: ResourceController;

	scenes: Map<string, ParallaxScene> = new Map();

	constructor( options: PSJManagerOptions )
	{
		this._loadController = new AdvancedAssetLoader();

		this._glController = new GLController( options );
		this._renderController = new RenderController( this._glController.gl );
		this._resourceController = new ResourceController( this._glController.gl );
	}

	async initScene( scene: ParallaxSceneLayer[], onProgress?: ( percent: number ) => void  ): Promise<ParallaxScene>
	{
		try {

			// 1. Download Scene assets
			const images = await this._loadController.loadImagesAsync( scene, onProgress );

			// Merge images into 1 ImageBitmap
			const { image, data } = await this._resourceController.merge( images, { alpha: true } );

			// Create WebGL texture from merged image
			const mergedImageTexture = this._resourceController.createTexture( image, { premultiplyAlpha: false } );

			// Add merged image to resources
			this._resourceController.add( `Merged:${ scene }`, image );

			// Add all downloaded images to resource manager
			for ( const { url, file } of images ){

				/**
				 * @TODO
				 * - Close ImageBitmap to release memory,
				 * - Give user an option to dispose imageBitmaps if its not will be used in another ParallaxScene
				 * 
				 * file.close(); 
				 */
				this._resourceController.add( url, file );				
			}


			// 2. Create ParallaxScene
			const finalSceneData: ParallaxLayer[] = scene.map( layerOption => {

				const atlas = data.atlas.find( atlasLayer => atlasLayer.id === layerOption.url );

				if ( ! atlas ) throw new Error( `Texture packing error` );

				return {
					id: layerOption.url,
					settings: layerOption,
					atlas: atlas,
					ratio: atlas.w / atlas.h,
				};

			} );

			const parallaxScene = new ParallaxScene( {
				id: "Scene_1",
				layers: finalSceneData,
				texture: mergedImageTexture,
				material: DEFAULT_MATERIAL
			} );


			this.scenes.set( parallaxScene.id, parallaxScene );
			this.render();

			return parallaxScene;

		} catch( error ){

			throw error;
		
		}
	}

	/**
	 * Should be called when `canvas` resized
	 * 
	 * @param width 
	 * @param height 
	 * @param pixelRatio 
	 */
	updateResolution( width: number, height: number, pixelRatio: number = 1.0 )
	{
		console.log( "UPDATE RES", width, height );
		this._renderController.setPixelRatio( pixelRatio );
		this._renderController.updateResolution( width, height );
	}

	render()
	{
		this.scenes.forEach( scene => {
			this._renderController.render( scene )
		} );
	}

}