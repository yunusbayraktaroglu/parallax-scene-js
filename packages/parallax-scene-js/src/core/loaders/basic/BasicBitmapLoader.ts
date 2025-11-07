import { Cache } from '../core/Cache';
import { Loader, FileOption, BasicOnProgress } from '../core/Loader';
import { OnError, OnLoad, OnProgress } from '../core/LoaderUtils';

import { LoadingManager } from './LoadingManager';

const _errorMap = new WeakMap();


/**
 * A basic loader that do not supports {@link ProgressEvent}, 
 * instead uses item count based progress.
 * 
 * ```ts
 * const loader = new BasicBitmapLoader();
 * loader.setOptions( { imageOrientation: 'flipY' } ); // set options if needed
 * const imageBitmap = await loader.loadAsync( 'image.png' );
 * ```
 */
export class BasicBitmapLoader extends Loader<ImageBitmap>
{
	manager = new LoadingManager();

	/**
	 * This flag can be used for type testing.
	 *
	 * @readonly
	 * @default true
	 */
	readonly isImageBitmapLoader = true;

	/**
	 * Represents the loader options.
	 *
	 * @default {premultiplyAlpha:'none'}
	 */
	options: ImageBitmapOptions = { 
		premultiplyAlpha: 'none' 
	};

	/**
	 * Used for aborting requests.
	 *
	 * @private
	 */
	private _abortController = new AbortController();

	/**
	 * Sets the given loader options. The structure of the object must match the `options` parameter of
	 * [createImageBitmap](https://developer.mozilla.org/en-US/docs/Web/API/Window/createImageBitmap).
	 *
	 * @param options - The loader options to set.
	 * @return A reference to this image bitmap loader.
	 */
	setOptions( options: ImageBitmapOptions )
	{
		this.options = options;
		return this;
	}

	/**
	 * Starts loading from the given URL and pass the loaded image bitmap to the `onLoad()` callback.
	 *
	 * @param url - The path/URL of the file to be loaded. This can also be a data URI.
	 * @param onLoad - Executed when the loading process has been finished.
	 * @param onProgress - Unsupported in this loader.
	 * @param onError - Executed when errors occur.
	 * @return The image bitmap.
	 */
	load( url: string, onLoad: ( image: ImageBitmap ) => void, onProgress: BasicOnProgress, onError: OnError )
	{
		this.manager.onProgress = onProgress;

		if ( this.path !== undefined ) url = this.path + url;

		const cached = Cache.get( `image-bitmap:${ url }` );

		if ( cached !== undefined ) {

			this.manager.itemStart( url );

			// If cached is a promise, wait for it to resolve
			if ( cached.then ){

				cached.then(( imageBitmap: ImageBitmap ) => {

					// check if there is an error for the cached promise

					if ( _errorMap.has( cached ) === true ){

						onError?.( _errorMap.get( cached ) );

						this.manager.itemError( url );
						this.manager.itemEnd( url );

					} else {

						onLoad?.( imageBitmap );

						this.manager.itemEnd( url );

						return imageBitmap;

					}

				} );

				return;

			}

			// If cached is not a promise (i.e., it's already an imageBitmap)
			setTimeout( () => {
				onLoad?.( cached );
				this.manager.itemEnd( url );
			}, 0 );

			return cached;

		}

		// create request
		const REQUEST = new Request( url, {
			headers: new Headers( this.requestHeader ),
			credentials: ( this.crossOrigin === 'anonymous' ) ? 'same-origin' : 'include',
			signal: ( typeof AbortSignal.any === 'function' ) ? AbortSignal.any( [ this._abortController.signal ] ) : this._abortController.signal
		} );

		const promise = fetch( REQUEST ).then( function ( res ){

			return res.blob();

		} ).then( ( blob ) => {

			return createImageBitmap( blob, Object.assign( this.options, { colorSpaceConversion: 'none' } ) );

		} ).then( ( imageBitmap ) => {

			Cache.add( `image-bitmap:${ url }`, imageBitmap );

			onLoad?.( imageBitmap );

			this.manager.itemEnd( url );

			return imageBitmap;

		} ).catch( ( error ) => {

			onError?.( error );

			_errorMap.set( promise, error );

			Cache.remove( `image-bitmap:${ url }` );

			this.manager.itemError( url );
			this.manager.itemEnd( url );

		} );

		Cache.add( `image-bitmap:${ url }`, promise );
		this.manager.itemStart( url );

	}

	/**
	 * Aborts ongoing fetch requests.
	 *
	 * @return A reference to this instance.
	 */
	abort()
	{
		this._abortController.abort();
		this._abortController = new AbortController();

		return this;
	}

}