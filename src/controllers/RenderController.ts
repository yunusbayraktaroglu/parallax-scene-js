// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import vertexShader from '../shaders/vertex.glsl';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import fragmentShader from '../shaders/fragment.glsl';

import { initShaderProgram } from "../helpers/shaderCompiler";
import { ParallaxScene } from '../components/ParallaxScene';

/**
 * Control GL functions 
 * and draw active parallax scenes
 */
export class RenderController {

	gl: GlTypes;
	program!: WebGLProgram;
	textures: Array<WebGLTexture> = [];
	setTime!: ( time: number ) => void;
	setResolution!: ( x: number, y: number ) => void;
	setPointer!: ( x: number, y: number ) => void;

	protected _renderCount = 0;

	constructor( gl: GlTypes ){

		this.gl = gl;
		
		/** Setup GLSL program */
		const program = initShaderProgram( gl, vertexShader, fragmentShader );
		if ( ! program ) return;

		gl.useProgram( program );
	
		/**  Bind indices & render buffers */
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer() );
		gl.bindBuffer( gl.ARRAY_BUFFER, gl.createBuffer() );

		/** Alpha rendering */
		gl.enable( gl.BLEND );
		gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );

		/** Enable cull face */
		gl.enable( gl.CULL_FACE );
		gl.cullFace( gl.FRONT );

		/** Uniform locations */
		const resolutionLocation = gl.getUniformLocation( program, "u_resolution" );
		const timeLocation = gl.getUniformLocation( program, "u_time" );
		const pointerLocation = gl.getUniformLocation( program, "u_pointer" );
		const u_image0Location = gl.getUniformLocation( program, "u_image0" );
		const u_image1Location = gl.getUniformLocation( program, "u_image1" );

		gl.uniform1i( u_image0Location, 0 ); // texture unit 0
		gl.uniform1i( u_image1Location, 1 ); // texture unit 1

		this.setTime = ( time ) => gl.uniform1f( timeLocation, time );
		this.setPointer = ( x, y ) => gl.uniform2f( pointerLocation, x, y );
		this.setResolution = ( w, h ) => gl.uniform2f( resolutionLocation, w, h );
		
		this.program = program;
	}

	/**
	 * Create & bind WebGLTexture with given image
	 */
	initTexture( image: HTMLCanvasElement ): void {

		const gl = this.gl;
		const texture = gl.createTexture() as WebGLTexture;

		gl.activeTexture( gl.TEXTURE0 );
		gl.bindTexture( gl.TEXTURE_2D, texture );
		
		// Set the parameters so can render any size image
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE );
		gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
		//gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST );

		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image );

		this.textures.push( texture );

	}

	/**
	 * Activate given parallax scene
	 */
	activateScene( scene: ParallaxScene ): void {

		const gl = this.gl;
		const program = this.program;

		gl.bufferData( gl.ELEMENT_ARRAY_BUFFER, scene.indices, gl.STATIC_DRAW );
		gl.bufferData( gl.ARRAY_BUFFER, scene.renderBuffer, gl.STATIC_DRAW );

		/**
		 * Enable attributes
		 */
		const stride = scene.stride;
		const FSIZE = scene.fsize;

		for ( let i = 0; i < scene.attributes.length - 0; i++ ){

			const attribute = scene.attributes[ i ];
			const location = gl.getAttribLocation( program, attribute.name );

			gl.vertexAttribPointer(
				location,   					// target
				attribute.itemSize,     		// interleaved data size
				gl.FLOAT,   					// type
				false,      					// normalize
				FSIZE * stride,  				// stride (chunk size)
				FSIZE * attribute.offset		// offset (position of interleaved data in chunk) 
			);
			gl.enableVertexAttribArray( location );
		}

		this._renderCount = scene.renderCount;

	}

	updateScene( scene: ParallaxScene ): void {

		const gl = this.gl;
		gl.bufferData( gl.ARRAY_BUFFER, scene.renderBuffer, gl.STATIC_DRAW );

	}

	/**
	 * Update GL viewport & canvas & uniform of resolution
	 */
	updateResolution(): void {

		const gl = this.gl;
		const canvas = gl.canvas as HTMLCanvasElement;

		gl.canvas.width = canvas.clientWidth;
		gl.canvas.height = canvas.clientHeight;
		gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );

		this.setResolution( gl.canvas.width, gl.canvas.height );
		
	}

	/** Draw active buffer */
	tick(): void {

		const gl = this.gl;
		const program = this.program;

		gl.clearColor( 0, 0, 0, 1 );
		gl.useProgram( program );
		gl.drawElements( gl.TRIANGLES, this._renderCount, gl.UNSIGNED_SHORT, 0 );

	}

}
