import { FileLoader } from './FileLoader';
import { Loader, FileOption } from '../core/Loader';
import { OnError, OnLoad, OnProgress } from '../core/LoaderUtils';

import { AdvancedOnProgress } from '../core/Loader';

/**
 * An `ImageBitmap` provides an asynchronous and resource efficient pathway to prepare
 * textures for rendering.
 * 
 * @see https://developer.mozilla.org/en-US/docs/Web/API/ImageBitmap
 *
 * Note that {@link Texture#flipY} and {@link Texture#premultiplyAlpha} are ignored with image bitmaps.
 * They needs these configuration on bitmap creation unlike regular images need them on uploading to GPU.
 *
 * You need to set the equivalent options via {@link ImageBitmapLoader#setOptions} instead.
 *
 * ```ts
 * const loader = new ImageBitmapLoader();
 * loader.setOptions( { imageOrientation: 'flipY' } ); // set options if needed
 * const imageBitmap = await loader.loadAsync( 'image.png' );
 *
 * const texture = new THREE.Texture( imageBitmap );
 * texture.needsUpdate = true;
 * ```
 */
export class AdvancedBitmapLoader extends Loader<ImageBitmap>
{
	/**
	 * Advanced image loader uses file loader
	 * @internal
	 */
	private readonly _fileLoader = new FileLoader();

	/**
	 * Represents the loader options.
	 */
	options: ImageBitmapOptions = { 
		premultiplyAlpha: 'none',
		colorSpaceConversion: 'none'
	};

	abort(){ return this; }

	constructor()
	{
		if ( typeof createImageBitmap === 'undefined' ){
			console.warn( 'ImageBitmapLoader: createImageBitmap() not supported.' );
			//throw new Error();
		}
		super();
	}

	/**
	 * Starts loading from the given URL and passes the loaded audio buffer
	 * to the `onLoad()` callback.
	 *
	 * @param url - The path/URL of the file to be loaded. This can also be a data URI.
	 * @param onLoad - Executed when the loading process has been finished.
	 * @param onProgress - Executed while the loading is in progress.
	 * @param onError - Executed when errors occur.
	 */
	load( file: FileOption, onLoad?: ( image: ImageBitmap ) => void, onProgress?: AdvancedOnProgress, onError?: OnError ): void 
	{
		/**
		 * Processes a successful asset load, validating that the response is a Blob
		 * and setting the image source, or handling errors if validation fails.
		 *
		 * @param blob - The loaded asset, expected to be a Blob.
		 */
		const onLoadImage = async ( blob: unknown ) => {
			try {
				// Check if the loaded item is an instance of Blob
				if ( blob instanceof Blob ){

					// Success: Create an ImageBitmap
					const imageBitmap = await createImageBitmap( blob, this.options );

					onLoad?.( imageBitmap );

				} else {

					// Failure: Throw an error if the type is unexpected
					throw new Error( `Expected Blob, but received ${ typeof blob }` );

				}
			} catch ( error ){

				// Catch any errors during processing (e.g., the Blob check or Error creation)
				( onError || console.error )( error );

			}
		};

		this._fileLoader.setResponseType( 'blob' );
		//this._fileLoader.setPath( this.path );
		//this._fileLoader.setRequestHeader( this.requestHeader );
		//this._fileLoader.setWithCredentials( this.withCredentials );
		this._fileLoader.load(
			file,
			onLoadImage,
			onProgress,
			onError
		);
	}
}