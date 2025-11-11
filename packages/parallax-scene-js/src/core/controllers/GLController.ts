/**
 * Options for creating a WebGL rendering context.
 */
type GetContextOptions = {
	/** Target canvas element for WebGL rendering. */
	canvas: HTMLCanvasElement;
	/** WebGL version to request: "1" for WebGL1 or "2" for WebGL2. Defaults to "2". */
	version?: "1" | "2";
	/** Optional WebGL context attributes. */
	attributes?: WebGLContextAttributes;
};

/**
 * Default WebGL context attributes used when none are provided.
 */
const DEFAULT_ATTRIBUTES = {
	alpha: false,
	antialias: false,
	depth: false,
	stencil: false,
	premultipliedAlpha: false,
	preserveDrawingBuffer: false,
	powerPreference: "default",
	failIfMajorPerformanceCaveat: false
} satisfies WebGLContextAttributes;

/**
 * Manages WebGL context creation, configuration, and error handling.
 */
export class GLController
{
	/**
	 * The HTML canvas element associated with this controller.
	 */
	canvas: HTMLCanvasElement;

	/**
	 * The active WebGL rendering context.
	 */
	gl: ParallaxRenderingContext;

	/**
	 * The WebGL version currently in use. 
	 */
	version: "1" | "2";

	/**
	 * Creates a new GLController instance.
	 * 
	 * @param options - Configuration options for context creation.
	 * @param options.canvas - The canvas element to use.
	 * @param options.version - WebGL version ("1" or "2"). Defaults to "2".
	 * @param options.attributes - Optional WebGL context attributes.
	 */
	constructor( { canvas, version = "2", attributes = {} }: GetContextOptions )
	{
		this.version = version;
		this.canvas = canvas;
		this.gl = this._getGL( { ...DEFAULT_ATTRIBUTES, ...attributes } );
	}

	/**
	 * Attempts to obtain a WebGL rendering context from the internal canvas.
	 * Registers error and recovery event listeners for context loss.
	 * 
	 * @param contextAttributes - WebGL context attribute settings.
	 * @returns The acquired WebGL context.
	 * @throws Error if the context cannot be created.
	 * @internal
	 */
	private _getGL( contextAttributes: WebGLContextAttributes ): ParallaxRenderingContext
	{
		function onContextLost( event: WebGLContextEvent )
		{
			event.preventDefault();
			console.warn( `WebGL context lost.` );
		}

		function onContextRestore()
		{
			console.warn( `WebGL context restored.` );
		}

		function onContextCreationError( event: WebGLContextEvent )
		{
			console.warn( `WebGL context could not be created. Reason: ${ event.statusMessage }` );
		}

		try {
			this.canvas.addEventListener( 'webglcontextlost', onContextLost as EventListener, false );
			this.canvas.addEventListener( 'webglcontextrestored', onContextRestore as EventListener, false );
			this.canvas.addEventListener( 'webglcontextcreationerror', onContextCreationError as EventListener, false );

			const contextNames: Array<ContextTypes> = [ 'webgl2', 'webgl' ];
	
			if ( this.version === "1" ){
				contextNames.shift();
			}

			const gl = this._getContext( contextNames, contextAttributes );

			if ( gl === null ){

				if ( this._getContext( contextNames ) ){
					throw new Error( `Error creating WebGL context with your selected attributes.` );
				} else {
					throw new Error( `Error creating WebGL context.` );
				}

			}

			return gl;

		} catch ( error ){

			console.error( `WebGL error: ${ error instanceof Error ? error.message : "Unknown error." }` );
			throw error;

		}
	}

	/**
	 * Attempts to retrieve a WebGL rendering context using the provided names and attributes.
	 * 
	 * @param contextNames - Ordered list of context types to try ("webgl2", "webgl").
	 * @param contextAttributes - Optional WebGL context attributes.
	 * @returns The first available rendering context, or null if none are supported.
	 * @internal
	 */
	private _getContext( contextNames: ContextTypes[], contextAttributes?: WebGLContextAttributes ): ParallaxRenderingContext | null
	{
		for ( let i = 0; i < contextNames.length; i ++ ){

			const contextName = contextNames[ i ];
			const context = this.canvas.getContext( contextName, contextAttributes );

			if ( context !== null ) return context as ParallaxRenderingContext;

		}

		return null;
	}
}