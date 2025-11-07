import { Loader } from "../core/Loader";

/**
 * Handles and keeps track of loaded and pending data. A default global
 * instance of this class is created and used by loaders if not supplied
 * manually.
 *
 * In general that should be sufficient, however there are times when it can
 * be useful to have separate loaders - for example if you want to show
 * separate loading bars for objects and textures.
 *
 * ```js
 * const manager = new LoadingManager();
 * manager.onLoad = () => console.log( 'Loading complete!' );
 * ```
 * 
 * Useful when
 * - Loading critical assets without tracking bytes.
 * - You don’t need fine-grained byte-level control.
 * - You want a quick global solution to track loading status.
 */
export class LoadingManager 
{
    /**
     * Will be called when loading of an item starts.
     * @param url The url of the item that started loading.
     * @param loaded The number of items already loaded so far.
     * @param total The total amount of items to be loaded.
     */
    onStart?: ( url: string, loaded: number, total: number ) => void;

    /**
     * Will be called when all items finish loading.
     * The default is a function with empty body.
     */
    onLoad?: () => void;

    /**
     * Will be called for each loaded item.
     * The default is a function with empty body.
     * @param url The url of the item just loaded.
     * @param loaded The number of items already loaded so far.
     * @param total The total amount of items to be loaded.
     */
    onProgress?: ( url: string, loaded: number, total: number ) => void;

    /**
     * Will be called when item loading fails.
     * The default is a function with empty body.
     * @param url The url of the item that errored.
     */
    onError?: ( url: string ) => void;

    /**
     * If provided, the callback will be passed each resource URL before a request is sent.
     * The callback may return the original URL, or a new URL to override loading behavior.
     * This behavior can be used to load assets from .ZIP files, drag-and-drop APIs, and Data URIs.
	 * 
     * @param callback URL modifier callback. Called with url argument, and must return resolvedURL.
     */
    setURLModifier: ( callback?: (url: string) => string ) => this;

    /**
     * Given a URL, uses the URL modifier callback (if any) and returns a resolved URL.
     * If no URL modifier is set, returns the original URL.
	 * 
     * @param url - The url to load
     */
    resolveURL: ( url: string ) => string;

    itemStart: ( url: string ) => void;
    itemEnd: ( url: string ) => void;
    itemError: ( url: string ) => void;

    // handlers
    addHandler: ( regex: RegExp, loader: Loader ) => this;
    removeHandler:( regex: RegExp ) => this;
    getHandler: ( file: string ) => Loader | null;

	/**
	 * Constructs a new loading manager.
	 *
	 * @param onLoad - Executes when all items have been loaded.
	 * @param onProgress - Executes when single items have been loaded.
	 * @param onError - Executes when an error occurs.
	 */
	constructor(         
		onLoad?: () => void,
        onProgress?: (url: string, loaded: number, total: number) => void,
        onError?: (url: string) => void
	){

		const scope = this;

		let isLoading = false;
		let itemsLoaded = 0;
		let itemsTotal = 0;
		let urlModifier: (( string: string ) => string) | undefined = undefined;

		const handlers: Array<RegExp | Loader> = [];

		// Refer to #5689 for the reason why we don't set .onStart
		// in the constructor

		/**
		 * Executes when an item starts loading.
		 *
		 * @type {Function|undefined}
		 * @default undefined
		 */
		this.onStart = undefined;

		/**
		 * Executes when all items have been loaded.
		 *
		 * @type {Function|undefined}
		 * @default undefined
		 */
		this.onLoad = onLoad;

		/**
		 * Executes when single items have been loaded.
		 *
		 * @type {Function|undefined}
		 * @default undefined
		 */
		this.onProgress = onProgress;

		/**
		 * Executes when an error occurs.
		 *
		 * @type {Function|undefined}
		 * @default undefined
		 */
		this.onError = onError;

		/**
		 * This should be called by any loader using the manager when the loader
		 * starts loading an item.
		 */
		this.itemStart = function ( url: string )
		{
			itemsTotal ++;

			if ( isLoading === false ) {

				if ( scope.onStart !== undefined ) {

					scope.onStart( url, itemsLoaded, itemsTotal );

				}

			}

			isLoading = true;
		};

		/**
		 * This should be called by any loader using the manager when the loader
		 * ended loading an item.
		 */
		this.itemEnd = function ( url: string )
		{
			itemsLoaded ++;

			if ( scope.onProgress !== undefined ){
				scope.onProgress( url, itemsLoaded, itemsTotal );
			}

			if ( itemsLoaded === itemsTotal ){

				isLoading = false;

				if ( scope.onLoad !== undefined ){
					scope.onLoad();
				}

			}
		};

		/**
		 * This should be called by any loader using the manager when the loader
		 * encounters an error when loading an item.
		 *
		 * @param {string} url - The URL of the item that produces an error.
		 */
		this.itemError = function ( url: string )
		{
			if ( scope.onError !== undefined ){
				scope.onError( url );
			}
		};

		/**
		 * Given a URL, uses the URL modifier callback (if any) and returns a
		 * resolved URL. If no URL modifier is set, returns the original URL.
		 *
		 * @param {string} url - The URL to load.
		 */
		this.resolveURL = function ( url: string )
		{
			if ( urlModifier ) {
				return urlModifier( url );
			}
			return url;
		};

		/**
		 * If provided, the callback will be passed each resource URL before a
		 * request is sent. The callback may return the original URL, or a new URL to
		 * override loading behavior. This behavior can be used to load assets from
		 * .ZIP files, drag-and-drop APIs, and Data URIs.
		 *
		 * ```js
		 * const blobs = {'fish.gltf': blob1, 'diffuse.png': blob2, 'normal.png': blob3};
		 *
		 * const manager = new THREE.LoadingManager();
		 *
		 * // Initialize loading manager with URL callback.
		 * const objectURLs = [];
		 * manager.setURLModifier( ( url ) => {
		 *
		 * 	url = URL.createObjectURL( blobs[ url ] );
		 * 	objectURLs.push( url );
		 * 	return url;
		 *
		 * } );
		 *
		 * // Load as usual, then revoke the blob URLs.
		 * const loader = new GLTFLoader( manager );
		 * loader.load( 'fish.gltf', (gltf) => {
		 *
		 * 	scene.add( gltf.scene );
		 * 	objectURLs.forEach( ( url ) => URL.revokeObjectURL( url ) );
		 *
		 * } );
		 * ```
		 *
		 * @param transform - URL modifier callback. Called with an URL and must return a resolved URL.
		 */
		this.setURLModifier = function ( transform )
		{
			urlModifier = transform;
			return this;
		};

		/**
		 * Registers a loader with the given regular expression. Can be used to
		 * define what loader should be used in order to load specific files. A
		 * typical use case is to overwrite the default loader for textures.
		 *
		 * ```js
		 * // add handler for TGA textures
		 * manager.addHandler( /\.tga$/i, new TGALoader() );
		 * ```
		 */
		this.addHandler = function ( regex: RegExp, loader: Loader )
		{
			handlers.push( regex, loader );
			return this;
		};

		/**
		 * Removes the loader for the given regular expression.
		 */
		this.removeHandler = function ( regex: RegExp )
		{
			const index = handlers.indexOf( regex );

			if ( index !== - 1 ){
				handlers.splice( index, 2 );
			}

			return this;
		};

		/**
		 * Can be used to retrieve the registered loader for the given file path.
		 */
		this.getHandler = function ( file: string )
		{
			for ( let i = 0, l = handlers.length; i < l; i += 2 ){

				const regex = handlers[ i ] as RegExp;
				const loader = handlers[ i + 1 ] as Loader;

				if ( regex.global ) regex.lastIndex = 0; // see #17920

				if ( regex.test( file ) ){
					return loader;
				}

			}

			return null;
		};

	}

}