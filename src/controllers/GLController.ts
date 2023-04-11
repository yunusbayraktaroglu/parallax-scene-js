/**
 * Get GL from given HTMLCanvasElement
 * or create a new canvas with WebGLContext
 */
export class GLController {
	
	canvas: HTMLCanvasElement;
	gl: GlTypes;
	maxTextureSize?: number;
	isWebGL1Renderer = false;

	constructor( canvas?: HTMLCanvasElement ){

		this.canvas = canvas ? canvas : this.createCanvasElement();
		this.gl = this.getGL();
		this.maxTextureSize = this.gl.getParameter( this.gl.MAX_TEXTURE_SIZE );

	}

	/** Create offscreen canvas */
	private createCanvasElement(): HTMLCanvasElement {

		const canvas = document.createElementNS( 'http://www.w3.org/1999/xhtml', 'canvas' ) as HTMLCanvasElement;
		canvas.style.display = 'block';
		return canvas;

	}

	/** Try to get GL from canvas */
	private getGL(): GlTypes {

		function onContextLost( event: WebGLContextEvent ){
			event.preventDefault();
			console.log( `WebGL context lost.` );
		}

		function onContextRestore(){
			console.log( `WebGL context restored.` );
		}

		function onContextCreationError( event: WebGLContextEvent ){
			console.error( `WebGL context could not be created. Reason: ${ event.statusMessage }` );
		}

		try {

			const contextAttributes: WebGLContextAttributes = {
				alpha: false,
				antialias: false,
				depth: false,
				stencil: false,
				premultipliedAlpha: false,
				preserveDrawingBuffer: false,
				powerPreference: "default",
				failIfMajorPerformanceCaveat: false
			};

			this.canvas.addEventListener( 'webglcontextlost', onContextLost as EventListener, false );
			this.canvas.addEventListener( 'webglcontextrestored', onContextRestore as EventListener, false );
			this.canvas.addEventListener( 'webglcontextcreationerror', onContextCreationError as EventListener, false );

			const contextNames: Array<ContextTypes> = [ 'webgl2', 'webgl' ];
	
			if ( this.isWebGL1Renderer === true ) {
				contextNames.shift();
			}

			const gl = this.getContext( contextNames, contextAttributes );

			if ( gl === null ) {

				if ( this.getContext( contextNames ) ) {
					throw new Error( `Error creating WebGL context with your selected attributes.` );
				} else {
					throw new Error( `Error creating WebGL context.` );
				}
			}

			return gl;

		} catch ( error ) {

			const message = error instanceof Error ? error.message : "Unknown error.";
			console.error( `WebGL error: ${ message }` );
			throw error;
		}

	}

	/** Get GL from canvas */
	private getContext( 
		contextNames: Array<ContextTypes>, 
		contextAttributes?: WebGLContextAttributes ): GlTypes | null {

		for ( let i = 0; i < contextNames.length; i ++ ) {

			const contextName = contextNames[ i ];
			const context = this.canvas.getContext( contextName, contextAttributes );
			if ( context !== null ) return context as GlTypes;

		}

		return null;

	}
}