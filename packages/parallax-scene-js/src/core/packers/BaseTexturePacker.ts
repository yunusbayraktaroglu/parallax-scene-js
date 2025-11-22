/**
 * Single image entry to be packed into an atlas.
 */
export type ImageSource = {
	/**
	 * Unique identifier for this image.
	 */
	id: string;
	/**
	 * Image bitmap data to pack.
	 */
	source: ImageBitmap;
};

/**
 * Atlas entry describing where an image is placed.
 */
export type AtlasResult = ImageSource & Rectangle;

/**
 * Atlas entry augmented with normalized coordinates (0..1)
 * suitable for use as WebGL texture coordinates.
 */
export type AtlasResultWithNormalized = AtlasResult & { 
	/**
	 * Normalized rectangle { x, y, w, h } where values are in [0, 1].
	 */
	normalized: Rectangle; 
};

/**
 * Result produced by a packer.
 */
export type PackResult = {
	/**
	 * Final atlas dimensions in pixels.
	 */
	size: Size;
	/**
	 * Per-image placement data including normalized coordinates.
	 */
	atlas: AtlasResultWithNormalized[];
};

export type MergeResult = {
	/**
	 * Combined image containing all packed sources.
	 */
	image: ImageBitmap;
	/**
	 * Packing metadata describing placements and size.
	 */
	data: PackResult;
};

/**
 * Abstract base class for 2D texture packers.
 * Subclasses must implement the `pack` method.
 *
 * References and implementations inspired by rectangle packing resources.
 *
 * @see https://jvernay.fr/en/blog/skyline-2d-packer/implementation
 * @see https://www.david-colson.com/2020/03/10/exploring-rect-packing.html
 */
export abstract class BaseTexturePacker
{
	/**
	 * Packs a collection of images into an atlas.
	 *
	 * @param images - Array of images to pack.
	 * @returns Packing result containing atlas entries and final size.
	 * @throws Error when the input is invalid or packing fails.
	 */
	abstract pack( images: ImageSource[] ): PackResult;

	/**
	 * Maximum texture size supported by the target device.
	 * Used to downscale pack results so the final atlas fits GPU limits.
	 * @internal
	 */
	protected _maxTextureSize: number;

	/**
	 * @param maxTextureSize - Device maximum supported texture dimension (width/height).
	 */
	constructor( maxTextureSize: number )
	{
		this._maxTextureSize = maxTextureSize;
	}

	/**
	 * Merge individual ImageBitmap sources into a single ImageBitmap using a 2D canvas.
	 * The result is optionally downscaled to fit the device's max texture size.
	 *
	 * @param packResult - Packing output with atlas positions and total size.
	 * @param useOffscreen - Use OffscreenCanvas when available (default: true).
	 * @param canvasSettings - Optional 2D context settings.
	 * @returns A combined ImageBitmap ready for uploading to GPU.
	 * @internal
	 */
	async _mergeImagesWithCanvas( packResult: PackResult, useOffscreen = true, canvasSettings?: CanvasRenderingContext2DSettings ): Promise<{
		mergedImage: ImageBitmap;
		finalPackResult: PackResult
	}>
	{
		const maxSize = Math.max( packResult.size.w, packResult.size.h );

		// Resize pack result depends on device MAX_TEXTURE_SIZE
		let finalPackResult: PackResult;

		if ( this._maxTextureSize < maxSize ){

			const ratio = this._maxTextureSize / maxSize;

			finalPackResult = {
				size: {
					w: packResult.size.w * ratio,
					h: packResult.size.h * ratio
				},
				atlas: packResult.atlas.map( atlas => ( {
					...atlas, // Keep normalized data and source as it is
					x: atlas.x * ratio,
					y: atlas.y * ratio,
					w: atlas.w * ratio,
					h: atlas.h * ratio
				} ) )
			};

		} else {
			finalPackResult = packResult;
		}

		const { canvas, context } = this._getCanvas( finalPackResult.size.w, finalPackResult.size.h, useOffscreen, canvasSettings );

		for ( const atlas of finalPackResult.atlas ){
			context.drawImage( atlas.source, atlas.x, atlas.y, atlas.w, atlas.h );
		}

		const options: ImageBitmapOptions = { premultiplyAlpha: 'none', colorSpaceConversion: 'none' };
		const mergedImage = await createImageBitmap( canvas, options );

		return { mergedImage, finalPackResult };
	}

	/**
	 * Create and return a canvas and its 2D rendering context.
	 *
	 * @param width - Canvas width in pixels.
	 * @param height - Canvas height in pixels.
	 * @param useOffscreen - If true prefer OffscreenCanvas when available.
	 * @param settings - Optional 2D context creation settings.
	 * @returns Object containing `canvas` and `context`.
	 * @throws Error if the 2D context cannot be obtained.
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
	 * Utility to display an ImageBitmap on the document body for debugging.
	 *
	 * @param image - ImageBitmap to display.
	 * @param settings - Optional 2D context settings for the debug canvas.
	 * @throws Error if the 2D context cannot be obtained.
	 * @internal
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
		context.drawImage( image, 0, 0 );

		// Optional: Release the memory held by the ImageBitmap immediately
		// image.close(); 

		document.body.appendChild( canvas );
	}
}