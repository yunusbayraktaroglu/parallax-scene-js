import { Loader, BasicOnProgress, OnError } from '../core/Loader';
import { Cache } from '../core/Cache';

const _errorMap = new WeakMap();

type CachedResource = Promise<ImageBitmap | void> | ImageBitmap | undefined;

/**
 * A basic loader that do not supports {@link ProgressEvent}, 
 * instead uses item count based progress.
 * 
 * ```ts
 * const loader = new BasicBitmapLoader();
 * const imageBitmap = await loader.loadAsync( 'image.png' );
 * ```
 */
export class BasicBitmapLoader extends Loader<ImageBitmap>
{
	/**
	 * Represents the loader options.
	 *
	 * @default {premultiplyAlpha:'none',colorSpaceConversion:'none'}
	 */
	options: ImageBitmapOptions = { 
		premultiplyAlpha: 'none',
		colorSpaceConversion: 'none'
	};

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
		if ( this.path !== undefined ) url = this.path + url;

		const cached = Cache.get( `image-bitmap:${ url }` );

		// Handle cache hit
        if ( cached !== undefined ){
            return this._loadCached( cached, url, onLoad, onProgress, onError );
        }

		// Handle network request
		const REQUEST = new Request( url, {
			headers: new Headers( this.requestHeader ),
			credentials: ( this.crossOrigin === 'anonymous' ) ? 'same-origin' : 'include',
			signal: this._abortController.signal
		} );

		const promise = fetch( REQUEST ).then( function ( res ){

			// Reject if the response status is successful (200-299)
			// To avoid following redundant createImageBitmap() execute
			if ( ! res.ok ){
				throw new Error( `${ res.status }': ${ url }` );
			}

			return res.blob();

		} ).then( ( blob ) => {

			return createImageBitmap( blob, this.options );

		} ).then( ( imageBitmap ) => {

			Cache.add( `image-bitmap:${ url }`, imageBitmap );

			onLoad( imageBitmap );
			onProgress( url );

			return imageBitmap;

		} ).catch( ( error ) => {

			_errorMap.set( promise, error );

			Cache.remove( `image-bitmap:${ url }` );

			onError( error );
			onProgress( url );

		} );

		Cache.add( `image-bitmap:${ url }`, promise );

	}

	/**
	 * Handles resources that have already been requested or loaded.
	 * If the cached item is a Promise, it waits for resolution.
	 * If the cached item is an object, it triggers callbacks asynchronously via microtask.
	 * 
	 * @param cached - The cached resource (either a pending Promise or an ImageBitmap).
	 * @param url - The URL associated with the resource.
	 * @param onLoad - Optional callback to execute on successful loading.
	 * @param onError - Optional callback to execute if an error occurs.
	 * @returns The cached resource.
	 * @internal
	 */
	private _loadCached( cached: CachedResource, url: string, onLoad: ( image: ImageBitmap ) => void, onProgress: BasicOnProgress, onError: OnError ): CachedResource
	{    
		// Scenario A: Cache is a pending Promise
		if ( cached instanceof Promise ){

			cached.then( ( imageBitmap ) => {

				// check if there is an error for the cached promise
				if ( _errorMap.has( cached ) ){

					onError( _errorMap.get( cached ) );
					onProgress( url );

				} else {

					onLoad( imageBitmap as ImageBitmap );
					onProgress( url );

					return imageBitmap;
					
				}

			} );

			return cached;
		}

		// Scenario B: Cache is a fully loaded ImageBitmap
		// We use queueMicrotask (or setTimeout 0) to ensure async behavior consistency
		queueMicrotask( () => {
			onLoad( cached as ImageBitmap );
			onProgress( url );
		} );

		return cached;
	}
}