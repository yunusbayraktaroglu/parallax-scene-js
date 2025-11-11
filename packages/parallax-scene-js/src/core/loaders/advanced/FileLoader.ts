import { Loader, FileOption, AdvancedOnProgress } from '../core/Loader';
import { HttpError, OnError, OnLoad, OnProgress } from '../core/LoaderUtils';
import { Cache } from '../core/Cache';

interface LoadCallback{
	onLoad?: OnLoad;
	onProgress?: AdvancedOnProgress;
	onError?: OnError;
};

const loading: Record<string, LoadCallback[]> = {};

/**
 * A low level class for loading resources with the Fetch API, used internally by
 * most loaders. It can also be used directly to load any file type that does
 * not have a loader.
 *
 * ```ts
 * const loader = new FileLoader();
 * const data = await loader.loadAsync( 'example.txt' );
 * ```
 *
 * @see https://github.com/mrdoob/three.js/blob/master/src/loaders/FileLoader.js
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/three/src/loaders/FileLoader.d.ts
 */
export class FileLoader extends Loader<string | ArrayBuffer | Blob | ImageBitmap>
{
	/**
	 * The expected mime type. Valid values can be found
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/DOMParser/parseFromString#mimetype
	 */
	public mimeType: string = '';

	/**
	 * The expected response type.
	 */
	public responseType: 'arraybuffer' | 'blob' | 'json' | '' = '';

	/**
	 * Used for aborting requests.
	 */
	private _abortController = new AbortController();

	/**
	 * Starts loading from the given URL and pass the loaded response to the `onLoad()` callback.
	 *
	 * @param url - The path/URL of the file to be loaded. This can also be a data URI.
	 * @param onLoad - Executed when the loading process has been finished.
	 * @param onProgress - Executed while the loading is in progress.
	 * @param onError - Executed when errors occur.
	 */
	load( file: FileOption, onLoad?: OnLoad, onProgress?: AdvancedOnProgress, onError?: OnError )
	{
		let url: any = false;
		let sizeInBytes: any = false;

		// Download by manifest
		if ( typeof file !== 'string' ){
			url = file.url;
			sizeInBytes = file.sizeInBytes;
			//console.log( "Downloading by manifest" );
		}

		// File is a string as asset URL
		if ( ! sizeInBytes ){
			url = file;
			//console.log( "Downloading by Content-Length header" );
		}

		if ( this.path !== undefined ) url = this.path + url;

		const cached = Cache.get( `file:${ url }` );

		// Check if request is already loaded
		if ( cached !== undefined ){
			setTimeout( () => onLoad?.( cached ), 0 );
			return cached;
		}

		// Check if request is duplicate
		if ( loading[ url ] !== undefined ){
			loading[ url ].push( { onLoad, onProgress, onError } );
			return;
		}

		// Initialise array for first requests
		loading[ url ] = [];
		loading[ url ].push( { onLoad, onProgress, onError } );

		// create request
		const REQUEST = new Request( url, {
			headers: new Headers( this.requestHeader ),
			credentials: this.withCredentials ? 'include' : 'same-origin',
			signal: ( typeof AbortSignal.any === 'function' ) ? AbortSignal.any( [ this._abortController.signal ] ) : this._abortController.signal
		} );

		// record states ( avoid data race )
		const mimeType = this.mimeType;
		const responseType = this.responseType;

		// start the fetch
		fetch( REQUEST )
			.then( response => {

				if ( response.status === 200 || response.status === 0 ){

					// Some browsers return HTTP Status 0 when using non-http protocol
					// e.g. 'file://' or 'data://'. Handle as success.
					if ( response.status === 0 ){
						console.warn( 'parallax-scene-js: HTTP Status 0 received.' );
					}

					// Workaround: Checking if response.body === undefined for Alipay browser #23548
					if ( typeof ReadableStream === 'undefined' || response.body === undefined || response.body!.getReader === undefined ){
						return response;
					}

					const reader = response.body!.getReader();

					// Determine total
					let total = sizeInBytes ?? 0;

					if ( ! sizeInBytes ){
						// Nginx needs X-File-Size check
						// https://serverfault.com/questions/482875/why-does-nginx-remove-content-length-header-for-chunked-content
						const contentLength = response.headers.get( 'X-File-Size' ) || response.headers.get( 'Content-Length' );
						total = contentLength ? parseInt( contentLength ) : 0;
					}

					const lengthComputable = total > 0;

					let loaded = 0;

					// periodically read data into the new stream tracking while download progress
					const stream = new ReadableStream( {
						start( controller )
						{
							readData();

							function readData()
							{
								reader.read().then( ( { done, value } ) => {

									if ( done ){

										controller.close();

									} else {

										loaded += value.byteLength;

										const event = new ProgressEvent( 'progress', { lengthComputable, loaded, total } );
										const callbacks = loading[ url ];

										for ( let i = 0, il = callbacks.length; i < il; i++ ){
											callbacks[ i ].onProgress?.( event );
										}

										controller.enqueue( value );
										readData();

									}

								}, ( error ) => {

									controller.error( error );

								} );

							}
						}

					} );

					return new Response( stream );

				} else {

					throw new HttpError( `fetch for "${ response.url }" responded with ${ response.status }: ${ response.statusText }`, response );

				}

			} )
			.then( response => {

				switch ( responseType )
				{
					case 'arraybuffer': return response.arrayBuffer();
					case 'blob': return response.blob();
					case 'json': return response.json();
						
					default: throw new Error( `${ responseType }: no parser.` );
				}

			} )
			.then( data => {

				// Add to cache only on HTTP success, so that we do not cache
				// error response bodies as proper responses to requests.
				Cache.add( `file:${ url }`, data );

				const callbacks = loading[ url ];
				delete loading[ url ];

				for ( let i = 0, il = callbacks.length; i < il; i++ ){

					callbacks[ i ].onLoad?.( data );

				}

			} )
			.catch( error => {

				// Abort errors and other errors are handled the same
				const callbacks = loading[ url ];

				if ( callbacks === undefined ){

					throw error;

				}

				delete loading[ url ];

				for ( let i = 0, il = callbacks.length; i < il; i++ ){

					callbacks[ i ].onError?.( error );

				}


			} )
			.finally( () => {} );

	}

	/**
	 * Sets the expected response type.
	 *
	 * @param value - The response type.
	 * @return A reference to this file loader.
	 */
	setResponseType( value: 'arraybuffer' | 'blob' | 'json' | '' ): this
	{
		this.responseType = value;
		return this;
	}

	/**
	 * Sets the expected mime type of the loaded file.
	 *
	 * @param  value - The mime type.
	 * @return A reference to this file loader.
	 */
	setMimeType( value: string ): this
	{
		this.mimeType = value;
		return this;
	}

	/**
	 * Aborts ongoing fetch requests.
	 *
	 * @return A reference to this instance.
	 */
	abort(): this
	{
		this._abortController.abort();
		this._abortController = new AbortController();

		return this;
	}

}