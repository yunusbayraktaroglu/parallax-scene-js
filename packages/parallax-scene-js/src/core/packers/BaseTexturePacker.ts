/**
 * Defines single image data type needs to be packed
 */
export type ImageSource = {
	id: string;
	source: ImageBitmap;
};

/**
 * Defines how the image with ID, packed in the atlas
 */
export type AtlasResult = ImageSource & Rectangle;

/**
 * Normalization required to use data in WebGL texture coordinates 0-1
 */
export type AtlasResultWithNormalized = AtlasResult & { normalized: Rectangle; };

/**
 * Output of the packing
 */
export type PackResult = {
	/**
	 * Final image dimensions
	 */
	size: Size;
	/**
	 * Packed image data/atlas
	 */
	atlas: AtlasResultWithNormalized[];
};

export type MergeResult = {
	/**
	 * Final merged image
	 */
	image: ImageBitmap;
	/**
	 * Data of packing
	 */
	data: PackResult;
};

/**
 * 2D Texture packer algorithms
 * 
 * @see https://jvernay.fr/en/blog/skyline-2d-packer/implementation
 * @see https://www.david-colson.com/2020/03/10/exploring-rect-packing.html
 */
export abstract class BaseTexturePacker
{
	/**
	 * Different packing algorhtyms
	 * @param images Given image sources
	 */
	abstract pack( images: ImageSource[] ): PackResult;

	/**
	 * Points max size of WebGL renderer supports by user device.
	 * Packers may calculate a packing bigger than that size. 
	 * But we are downscaling to that if.
	 *  
	 * @internal
	 */
	protected _maxTextureSize: number;

	/**
	 * @param maxTextureSize Device max supported texture size 
	 */
	constructor( maxTextureSize: number )
	{
		this._maxTextureSize = maxTextureSize;
	}

	/**
	 * Creates final image by using Canvas
	 * 
	 * @param canvasSize Total packed size
	 * @param atlasData Array of pack data
	 * @internal
	 */
	async _mergeImagesWithCanvas( packResult: PackResult, useOffscreen = true, canvasSettings?: CanvasRenderingContext2DSettings ): Promise<ImageBitmap>
	{
		const maxSize = Math.max( packResult.size.w, packResult.size.h );

		let finalWidth: number;
		let finalHeight: number;
		let ratio = 1.0;

		if ( this._maxTextureSize < maxSize ){
			ratio = this._maxTextureSize / maxSize;
			finalWidth = packResult.size.w * ratio;
			finalHeight = packResult.size.h * ratio;
		} else {
			finalWidth = packResult.size.w;
			finalHeight = packResult.size.h;
		}

		const { canvas, context } = this._getCanvas( finalWidth, finalHeight, useOffscreen, canvasSettings );

		for ( const atlas of packResult.atlas ){
			context.drawImage( atlas.source, atlas.x, atlas.y, atlas.w, atlas.h );
		}

		const options: ImageBitmapOptions = { premultiplyAlpha: 'none', colorSpaceConversion: 'none' };

		return await createImageBitmap( canvas, options );
	}

	/**
	 * Returns a canvas by given options to operate merging draw
	 * 
	 * @param useOffscreen 
	 * @param width 
	 * @param height 
	 * @param settings
	 * @internal
	 */
	private _getCanvas( width: number, height: number, useOffscreen: boolean, settings?: CanvasRenderingContext2DSettings )
	{
		const canvas = useOffscreen ? new OffscreenCanvas( width, height ) : document.createElement( "canvas" );
		const context = canvas.getContext( "2d", settings ) as ( CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D );

		if ( ! context ){
			throw new Error( useOffscreen ? "Failed to get OffscreenCanvas 2D context." : "Failed to get 2D context for texture packing." );
		}

		if ( ! useOffscreen ){
			canvas.width = width;
			canvas.height = height;
		}

		return { canvas, context };
	}

	/**
	 * For testing purposes
	 * 
	 * @param image 
	 * @param settings 
	 */
	displayImageBitmapOnScreen( image: ImageBitmap, settings?: CanvasRenderingContext2DSettings )
	{
		const canvas = document.createElement( "canvas" );
		const context = canvas.getContext( "2d", settings );

		if ( ! context ){
			throw new Error( `Context can't get while texture packing.` );
		}

		canvas.width = image.width;
		canvas.height = image.height;

		// 3. Draw the ImageBitmap to the screen
		context.drawImage( image, 0, 0);

		// Optional: Release the memory held by the ImageBitmap immediately
		// image.close(); 

		document.body.appendChild( canvas );

	}
}