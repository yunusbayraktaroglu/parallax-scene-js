import { type TextureOptions, TextureHelper } from "./webgl/TextureHelpers";

import { BinaryTreeTexturePacker } from "../packers/BinaryTreeTexturePacker";
import { SkylineTexturePacker } from "../packers/SkylineTexturePacker";
import { type MergeResult } from "../packers/BaseTexturePacker";

import { generateGroupHash } from "../helpers/hashCreator";

export type ImageDownloadResult = {
	url: string;
	file: ImageBitmap;
};

export class ResourceController
{
	private _textureHelper: TextureHelper;

	private _maxTextureSize: number = 0;
	private _binaryTreeTexturePacker: BinaryTreeTexturePacker;

	private _images = new Map<string, ImageBitmap>();
	private _textures = new Map<string, WebGLTexture>();
	private _mergedImages = new Map<string, MergeResult>();

	constructor( gl: ParallaxRenderingContext )
	{
		this._maxTextureSize = gl.MAX_TEXTURE_SIZE;
		this._textureHelper = new TextureHelper( gl );

		/**
		 * @bug
		 * using this._maxTextureSize creates bug, probably atlas normalizing error
		 */
		this._binaryTreeTexturePacker = new BinaryTreeTexturePacker( 8192 );
	}

	/**
	 * Creates a WebGL texture
	 * 
	 * @param imageBitmap 
	 */
	createTexture( imageBitmap: ImageBitmap, options?: TextureOptions )
	{
		const texture = this._textureHelper.createTexture( imageBitmap, options );
		return texture;
	}

	/**
	 * Caches ImageBitmap with given key
	 * 
	 * @param key Image unique key
	 * @param imageBitmap 
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
	 * Merges given ImageBitmaps into 1 image using packing algorhyms
	 * 
	 * @param imageBitmaps Image Bitmaps
	 * @param canvasSettings Default `{ alpha: true }`
	 */
	async merge( imageBitmaps: ImageDownloadResult[], canvasSettings: CanvasRenderingContext2DSettings = { alpha: true } ): Promise<MergeResult>
	{
		const HASH = generateGroupHash( imageBitmaps.map( image => image.url ) );
		const mergedImage = this._mergedImages.get( HASH );

		if ( mergedImage ) return mergedImage;

		try {

			const packerData = imageBitmaps.map( file => ({ id: file.url, source: file.file }));
			
			// Start packing
			const packResult = this._binaryTreeTexturePacker.pack( packerData );
			const mergedImage = await this._binaryTreeTexturePacker._mergeImagesWithCanvas( packResult, true, canvasSettings );

			this._mergedImages.set( HASH, { image: mergedImage, data: packResult } );
			
			return { image: mergedImage, data: packResult };

		} catch( error ){

			throw error;

		}
	}

	/**
	 * For debugging merged images
	 * 
	 * @param image 
	 * @param settings 
	 */
	drawImageOnCanvas( image: ImageBitmap, settings?: CanvasRenderingContext2DSettings )
	{
		this._binaryTreeTexturePacker.displayImageBitmapOnScreen( image, { alpha: false } );
	}

}