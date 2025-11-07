type GetContextOptions = {
	canvas: HTMLCanvasElement;
	version?: "1" | "2";
	attributes?: WebGLContextAttributes;
};

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
 * Get GL from given HTMLCanvasElement
 * or create a new canvas with WebGLContext
 */
export class GLController
{
	canvas: HTMLCanvasElement;
	gl: ParallaxRenderingContext;
	version: "1" | "2";

	constructor({ canvas, version = "2", attributes = {} }: GetContextOptions )
	{
		this.version = version;
		this.canvas = canvas ? canvas : this._createCanvasElement();
		this.gl = this._getGL( { ...DEFAULT_ATTRIBUTES, ...attributes } );
	}

	/**
	 * Creates a HTMLCanvasElement 
	 * @returns HTMLCanvasElement
	 */
	private _createCanvasElement(): HTMLCanvasElement
	{
		const canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' ) as HTMLCanvasElement;
		return canvas;
	}

	/**
	 * Try to get context from internal canvas
	 * @returns 
	 */
	private _getGL( contextAttributes: WebGLContextAttributes ): ParallaxRenderingContext
	{
		function onContextLost( event: WebGLContextEvent )
		{
			event.preventDefault();
			console.log( `WebGL context lost.` );
		}

		function onContextRestore()
		{
			console.log( `WebGL context restored.` );
		}

		function onContextCreationError( event: WebGLContextEvent )
		{
			console.error( `WebGL context could not be created. Reason: ${ event.statusMessage }` );
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
	 * Returns the rendering context
	 * 
	 * @param contextNames Given context names
	 * @param contextAttributes Given context settings
	 * @returns WebGL2RenderingContext | WebGLRenderingContext | null
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