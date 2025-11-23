import { type TextureOptions, TextureHelper } from "./webgl/TextureHelpers";

import { BinaryTreeTexturePacker } from "../packers/BinaryTreeTexturePacker";
import { SkylineTexturePacker } from "../packers/SkylineTexturePacker";
import { type MergeResult } from "../packers/BaseTexturePacker";

import { generateGroupHash } from "../helpers/hashCreator";
import { isPremultipliedImage } from "../helpers/isPremultiplied";

/**
 * Represents a downloaded image with its source URL and decoded bitmap.
 */
export type ImageDownloadResult = {
	url: string;
	file: ImageBitmap;
};

/**
 * Dependencies required for ResourceController operation.
 */
export type ResourceControllerDeps = {
	texturePacker: BinaryTreeTexturePacker | SkylineTexturePacker;
	textureHelper: TextureHelper;
};

/**
 * Manages all image and texture resources for WebGL rendering. 
 * Handles caching, deduplication, merging, and texture creation.
 */
export class ResourceController
{
	/**
	 * Map of image URLs to ImageBitmaps.
	 * @internal
	 */
	private _images = new Map<string, ImageBitmap>();
	
	/**
	 * Map of texture hashes to WebGLTextures.
	 * @internal
	 */
	private _textures = new Map<string, WebGLTexture>();

	/**
	 * Cache of merged image atlases keyed by hash.
	 * @internal
	 */
	private _mergedImages = new Map<string, MergeResult & { hash: string }>();
	
	/**
	 * Handles WebGL texture creation.
	 * @internal
	 */
	private _textureHelper: TextureHelper;

	/**
	 * Packs multiple images into one large atlas.
	 * @internal
	 */
	private _texturePacker: BinaryTreeTexturePacker | SkylineTexturePacker;

	constructor( dependencies: ResourceControllerDeps )
	{
		this._textureHelper = dependencies.textureHelper;
		this._texturePacker = dependencies.texturePacker;
	}

	/**
	 * Creates and caches a WebGL texture using the provided image and options. {@link TextureOptions}
	 * Will return previosly created Texture if given HASH found in the cache.
	 * 
	 * @param hash Unique identifier for deduplication
	 * @param imageBitmap The image data used to create the texture.
	 * @param options Optional texture creation parameters.
	 */
	createTexture( hash: string, imageBitmap: ImageBitmap, options?: TextureOptions )
	{
		const texture = this._textures.get( hash );

		if ( texture ){
			console.warn( `${ hash }: texture was created previously` );
			return texture;
		}

		const newTexture = this._textureHelper.createTexture( imageBitmap, options );
		
		this._textures.set( hash, newTexture );

		return newTexture;
	}

	/**
	 * Deletes an image from cache and releases its associated bitmap
	 * 
	 * @param url Image URL key used to locate and delete the cached ImageBitmap.
	 */
	deleteImage( url: string )
	{
		const image = this._images.get( url );

		if ( image ){
			image.close();
			this._images.delete( url );
		}
	}
	
	/**
	 * Removes a texture from cache without affecting the underlying WebGL resource.
	 * 
	 * @param hash Unique identifier of the texture to remove from the cache.
	 */
	deleteTexture( hash: string )
	{
		this._textures.delete( hash );
	}

	/**
	 * Stores an `ImageBitmap` in cache under the given key, preventing duplicate entries.
	 * 
	 * @param key Unique identifier for the image, usually its source URL.
	 * @param imageBitmap The decoded bitmap to store in cache.
	 */
	add( key: string, imageBitmap: ImageBitmap )
	{
		if ( this._images.has( key ) ){
			console.warn( `${ key }: Already in the resources.` );
			return;
		}

		this._images.set( key, imageBitmap );
	}

	/**
	 * Combines multiple ImageBitmap instances into a single atlas texture using the binary tree packing algorithm.
	 * 
	 * @param imageBitmaps Array of image download results to merge.
	 * @param canvasSettings Canvas rendering settings. Default `{ alpha: true }`
	 */
	async merge( imageBitmaps: ImageDownloadResult[], canvasSettings: CanvasRenderingContext2DSettings = { alpha: true } ): Promise<MergeResult & { hash: string }>
	{
		// A scene may have different layers with same image source
		// Removes duplicates to merge only unique image sources.
		const uniqueMap = new Map( imageBitmaps.map( item => [ item.url, item ] ) );
		const uniqueImageBitmaps = [ ...uniqueMap.values() ];

		const HASH = generateGroupHash( uniqueImageBitmaps.map( image => image.url ) );
		const mergedImage = this._mergedImages.get( HASH );

		if ( mergedImage ) return mergedImage;

		try {

			const packerData = uniqueImageBitmaps.map( file => ( { id: file.url, source: file.file } ) );
			
			// Start packing
			const packResult = this._texturePacker.pack( packerData );
			const { mergedImage, finalPackResult } = await this._texturePacker._mergeImagesWithCanvas( packResult, true, canvasSettings );

			// Appends texture in document.body to debug
			// this._drawImageOnCanvas( mergedImage );
			// console.log( finalPackResult );
			
			this._mergedImages.set( HASH, { image: mergedImage, data: finalPackResult, hash: HASH } );
			
			return { image: mergedImage, data: finalPackResult, hash: HASH };

		} catch( error ){

			throw error;

		}
	}

	/**
	 * Displays a merged image on-screen for debugging or visualization purposes.
	 * 
	 * @param image The image to draw.
	 * @param settings Optional canvas rendering settings.
	 * 
	 * @internal
	 */
	private _drawImageOnCanvas( image: ImageBitmap, settings?: CanvasRenderingContext2DSettings )
	{
		this._texturePacker.displayImageBitmapOnScreen( image, { alpha: true } );
	}

}