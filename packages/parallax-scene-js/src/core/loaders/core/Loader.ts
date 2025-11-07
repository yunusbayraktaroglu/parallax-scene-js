/**
 * Why use sizeInBytes
 * 
 * - If images are cross-origin and the server doesn’t expose headers with CORS, 
 * the browser will give you an opaque response and you can’t read Content-Length in JS. 
 * In that case a manifest (or server-side header exposure) 
 * is the only practical way to know sizes in-browser without extra server coordination.
 * 
 * - Servers/CDNs and chunked/compressed transfers: 
 * Some responses use Transfer-Encoding: chunked or are compressed; Content-Length might be absent or report compressed bytes. 
 * Decide whether your manifest stores transferred bytes or uncompressed file size — for progress you normally want the number of bytes that will be transferred.
 */

export type FileURL = string;

export type FileOption = FileURL | {
	url: string;
	sizeInBytes: number;
};

/**
 * Uses item count based onProgress
 */
export type BasicOnProgress = ( url: string, loaded: number, total: number ) => void;

/**
 * Uses chunk based onProgress
 */
export type AdvancedOnProgress = ( event: ProgressEvent ) => void;

/**
 * Abstract base class for loaders.
 * 
 * @see https://github.com/mrdoob/three.js/blob/master/src/loaders/Loader.js
 * @see https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/three/src/loaders/Loader.d.ts
 */
export abstract class Loader<TData = unknown>
{
	/**
	 * The crossOrigin string to implement CORS for loading the url from a
	 * different domain that allows CORS.
	 */
	crossOrigin: string = 'anonymous';

	/**
	 * Whether the XMLHttpRequest uses credentials.
	 */
	withCredentials: boolean = false;

	/**
	 * The base path from which the asset will be loaded.
	 */
	path: string = '';

	/**
	 * The base path from which additional resources like textures will be loaded.
	 */
	resourcePath: string = '';

	/**
	 * The request header used in HTTP request.
	 * @see https://developer.mozilla.org/en-US/docs/Glossary/Request_header
	 */
	requestHeader: { [ header: string ]: any } = {};

	/**
	 * This method needs to be implemented by all concrete loaders. 
	 * It holds the logic for parsing the asset into entities.
	 *
	 * @param data - The data to parse.
	 */
	// abstract parse( data: any ): any;

	/**
	 * This method needs to be implemented by all concrete loaders. 
	 * It holds the logic for loading assets from the backend.
	 *
	 * @param file - The path/URL of the file to be loaded.
	 * @param onLoad - Executed when the loading process has been finished.
	 * @param onProgress - Executed while the loading is in progress.
	 * @param onError - Executed when errors occur.
	 */
	abstract load(
		file: FileOption,
		onLoad: ( data: TData ) => void,
		onProgress?: BasicOnProgress | AdvancedOnProgress,
		onError?: ( err: unknown ) => void
	): void;

	/**
	 * This method can be implemented in loaders for aborting ongoing requests.
	 *
	 * @return A reference to this instance.
	 */
	abstract abort(): this;

	/**
	 * A async version of {@link Loader#load}
	 *
	 * @param file - The path/URL of the file to be loaded.
	 * @param onProgress - Executed while the loading is in progress.
	 * @return A Promise that resolves when the asset has been loaded.
	 */
	loadAsync( file: FileOption, onProgress?: BasicOnProgress | AdvancedOnProgress ): Promise<TData>
	{
		return new Promise( ( resolve, reject ) => {
			this.load( file, resolve, onProgress, reject );
		} );
	}

	/**
	 * Sets the `crossOrigin` String to implement CORS for loading the URL
	 * from a different domain that allows CORS.
	 *
	 * @param crossOrigin - The `crossOrigin` value.
	 * @return A reference to this instance.
	 */
	setCrossOrigin( crossOrigin: string ): this
	{
		this.crossOrigin = crossOrigin;
		return this;
	}

	/**
	 * Whether the XMLHttpRequest uses credentials such as cookies, authorization
	 * headers or TLS client certificates. 
	 * 
	 * @see https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/withCredentials
	 *
	 * Note: This setting has no effect if you are loading files locally or from the same domain.
	 *
	 * @param value - The `withCredentials` value.
	 * @return A reference to this instance.
	 */
	setWithCredentials( value: boolean ): this
	{
		this.withCredentials = value;
		return this;
	}

	/**
	 * Sets the base path for the asset.
	 *
	 * @param path - The base path.
	 * @return A reference to this instance.
	 */
	setPath( path: string ): this
	{
		this.path = path;
		return this;
	}

	/**
	 * Sets the base path for dependent resources like textures.
	 *
	 * @param resourcePath - The resource path.
	 * @return A reference to this instance.
	 */
	setResourcePath( resourcePath: string ): this
	{
		this.resourcePath = resourcePath;
		return this;
	}

	/**
	 * Sets the given request header.
	 *
	 * @param requestHeader - A request header for configuring the HTTP request.
	 * @return A reference to this instance.
	 * 
	 * @see https://developer.mozilla.org/en-US/docs/Glossary/Request_header
	 */
	setRequestHeader( requestHeader: { [ header: string ]: string } ): this
	{
		this.requestHeader = requestHeader;
		return this;
	}
}