import { BufferHelper } from './webgl/BufferHelpers';
import { ProgramHelper, type ProgramInfo } from './webgl/ProgramHelpers';
import { AttributeHelper } from './webgl/AttributeHelpers';
import { UniformsHelper, type Uniforms } from './webgl/UniformsHelpers';

import { BufferAttribute } from '../buffers/BufferAttribute';
import { ParallaxScene } from '../components/ParallaxScene';
import { Rect } from '../components/Rect';

/**
 * Global WebGL uniform references shared across all scenes.
 */
export const GLOBAL_UNIFORMS = {
	// Canvas resolution in pixels
	u_resolution: {
		value: { x: 0, y: 0 }
	},
	// Global application time in seconds
	u_time: {
		value: 0
	}
};

/**
 * Dependencies required for RenderController operation.
 */
export type RenderControllerDeps = {
	extensions: IGLTextensions;
	context: ParallaxRenderingContext;
	buffersHelper: BufferHelper;
	programHelper: ProgramHelper;
	attributesHelper: AttributeHelper;
	uniformsHelper: UniformsHelper;
};

/**
 * Controls all WebGL rendering operations for ParallaxScenes.
 * Handles shader programs, buffers, attributes, and draw calls.
 */
export class RenderController
{
	/**
	 * Frame counter, increments after each render call.
	 */
	frame: number = 0;

	/**
	 * Current device pixel ratio.
	 * @internal
	 */
	private _pixelRatio = 1.0;

	/**
	 * WebGL extension handler for VAO management.
	 * @internal
	 */
	private _extensions: IGLTextensions;

	/**
	 * Active WebGL rendering context.
	 * @internal
	 */
	private _renderingContext: ParallaxRenderingContext;

	/**
	 * Helper for managing shader uniforms.
	 * @internal
	 */
	private _uniformsHelper: UniformsHelper;

	/**
	 * Helper for managing buffer creation and updates.
	 * @internal
	 */
	private _buffersHelper: BufferHelper;

	/**
	 * Helper for managing attribute bindings.
	 * @internal
	 */
	private _attributesHelper: AttributeHelper;

	/**
	 * Helper for managing shader programs.
	 * @internal
	 */
	private _programHelper: ProgramHelper;

	/**
	 * Cached program by material ID to skip redundant bindings.
	 * @internal
	 */
	private _programCache?: number;

	/**
	 * Cached scene reference to reduce VAO rebindings.
	 * @internal
	 */
	private _sceneCache?: ParallaxScene;

	/**
	 * Initializes all WebGL helpers and extensions.
	 */
	constructor( dependencies: RenderControllerDeps )
	{
		this._renderingContext = dependencies.context;
		this._buffersHelper = dependencies.buffersHelper;
		this._attributesHelper = dependencies.attributesHelper;
		this._programHelper = dependencies.programHelper;
		this._uniformsHelper = dependencies.uniformsHelper;

		this._extensions = dependencies.extensions;

		const gl = this._renderingContext;

		// Cull face
		gl.enable( gl.CULL_FACE );
		gl.cullFace( gl.FRONT );

		// Alpha blending
		gl.enable( gl.BLEND );
		gl.blendFunc( gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA );

		// Turn off rendering to alpha
		// gl.colorMask( true, true, true, false );
		gl.clearColor( 0, 0, 0, 1 );

		// Turn on scissor test
		gl.disable( gl.SCISSOR_TEST );

		//gl.enable( gl.DEPTH_TEST );
	}

	/**
	 * Sets the pixel ratio used for HiDPI rendering.
	 * 
	 * @param ratio Device pixel ratio (default = 1).
	 */
	setPixelRatio( ratio: number =  1 ): void
	{
		this._pixelRatio = ratio;
	}

	/**
	 * Updates WebGL viewport and canvas resolution.
	 * Should be called when the canvas CSS size changes.
	 * 
	 * @param width CSS width in pixels.
	 * @param height CSS height in pixels.
	 */
	updateResolution( width: number, height: number ): void
	{
		const gl = this._renderingContext;
		const canvas = gl.canvas as HTMLCanvasElement;

		// Update physical canvas size according to pixel ratio
		canvas.width = Math.floor( width * this._pixelRatio );
		canvas.height = Math.floor( height * this._pixelRatio );

		canvas.style.width = width + 'px';
		canvas.style.height = height + 'px';

		// Update global resolution uniform
		GLOBAL_UNIFORMS.u_resolution.value.x = width;
		GLOBAL_UNIFORMS.u_resolution.value.y = height;
	}

	/**
	 * Renders a given ParallaxScene.
	 * Handles shader setup, uniform binding, and VAO drawing.
	 * 
	 * @param scene Scene instance to render.
	 */
	render( scene: ParallaxScene ): void
	{
		const gl = this._renderingContext;

		if ( this._programCache !== scene.material.id ){

			/**
			 * Compile the shader program if its not done before. 
			 * VAO binding requires {@link ProgramInfo.attributesData},
			 * so it should be created before _onBeforeRender() call.
			 */
			if ( ! scene.material.programInfo ){
				const { vertex, fragment } = scene.material;
				scene.material.programInfo = this._programHelper.createProgramInfo( [ vertex, fragment ] );
			}

			gl.useProgram( scene.material.programInfo.program );

			// Cache program to avoid redundant gl.useProgram calls
			this._programCache = scene.material.id;

		}

		// Ensure VAO/Buffers are ready
		this._onBeforeRender( scene );

		/**
		 * Scene rect can be change every frame
		 * 
		 * @todo
		 * Add a dirty flag
		 */
		if ( scene.rect.dirty ){
			scene.rect.multiplyScalar( this._pixelRatio ).floor();
			scene.rect.dirty = false;
		}

		const { x, y, w, h } = scene.rect;

		// We are created programInfo above
		const uniformsData = scene.material.programInfo!.uniformsData;

		const updatedUniforms: Uniforms = {
			u_resolution: {
				value: { x: w / this._pixelRatio, y: h / this._pixelRatio },
			},
			u_pointer: {
				value: scene.pointer
			},
		};

		if ( this._sceneCache !== scene ){

			// Rebind texture
			updatedUniforms.u_texture = {
				value: scene.texture
			};

			this._uniformsHelper.bindUniforms( uniformsData, updatedUniforms );
			this._sceneCache = scene;

		} else {

			this._uniformsHelper.bindUniforms( uniformsData, updatedUniforms );

		}

		this._extensions.bindVertexArray( scene.vao! );

		gl.viewport( x, y, w, h );
		gl.scissor( x, y, w, h );
		gl.drawElements( gl.TRIANGLES, scene.geometry.index!.count, gl.UNSIGNED_SHORT, 0 );

		// Unbind VAO after drawing
		this._extensions.bindVertexArray( null );

		this.frame++;
	}

	/**
	 * Disposes GPU resources used by a given scene.
	 * Deletes buffers, textures, and related WebGL objects.
	 * 
	 * @param scene Scene to dispose.
	 */
	dispose( scene: ParallaxScene ): void
	{
		// Remove all attribute buffers
		Object.values( scene.geometry.attributes ).forEach( ( attribute, ndx ) => {
			const nonInterleavedAttribute = attribute as BufferAttribute;
			this._buffersHelper.remove( nonInterleavedAttribute );
		} );

		// Remove shared interleaved buffer
		this._buffersHelper.remove( scene.attributes[ 0 ].data );

		// Remove index buffer
		this._buffersHelper.remove( scene.geometry.index! );

		// Delete associated merged texture from GPU memory
		this._renderingContext.deleteTexture( scene.texture );
		
		//this._renderingContext.deleteProgram
		//this._renderingContext.deleteShader
	}

	/**
	 * Prepares all GPU buffers before rendering.
	 * Updates each vertex/index buffers if it needs to be updated and binds VAO if not initialized.
	 * 
	 * @param scene 
	 * @internal
	 */
	private _onBeforeRender( scene: ParallaxScene ): void
	{
		/**
		 * Each InterleavedAttribute shares same InterleavedBufferAttribute.data property as InterleavedBuffer, 
		 * so get it from [ 0 ]
		 */
		this._buffersHelper.update( scene.attributes[ 0 ].data, this._renderingContext.ARRAY_BUFFER );

		this._buffersHelper.update( scene.geometry.index!, this._renderingContext.ELEMENT_ARRAY_BUFFER );

		// Or create a WebGLBuffer for each attribute, if not using interleaved
		// Object.values( scene.geometry.attributes ).forEach(( attribute, ndx ) => {
			//this._buffersHelper.update( attribute as BufferAttribute, this._glController.gl.ARRAY_BUFFER );
		// });

		// Skip VAO creation if already bound
		if ( scene.vao ) return;

		this._bindInterleavedVAO( scene );
	}

	/**
	 * Binds a VAO for interleaved vertex attributes.
	 * 
	 * @param scene Scene with interleaved geometry data.
	 * @internal
	 */
	private _bindInterleavedVAO( scene: ParallaxScene ): void
	{
		const { _extensions, _buffersHelper, _attributesHelper } = this;

		// Retrieve shader attribute layout
		const shaderAttributesData = scene.material!.programInfo!.attributesData;

		// Open VAO
		scene.vao = _extensions.createVertexArray();
		
		// Bind VAO
		_extensions.bindVertexArray( scene.vao );
		
		// Assign VAO
		_attributesHelper.bindInterleavedAttributes( scene.attributes, shaderAttributesData, _buffersHelper.get( scene.attributes[ 0 ].data )! );
		_attributesHelper.bindIndices( _buffersHelper.get( scene.geometry.index! )! );
		
		// Close VAO
		_extensions.bindVertexArray( null );
	}

	/**
	 * Binds a VAO for non-interleaved vertex attributes.
	 * 
	 * @param scene Scene with separate attribute buffers.
	 * @internal
	 */
	private _bindStandardVAO( scene: ParallaxScene ): void
	{
		const { _extensions, _buffersHelper, _attributesHelper } = this;

		// Retrieve shader attribute layout
		const shaderAttributesData = scene.material!.programInfo!.attributesData;

		// Open VAO
		scene.vao = _extensions.createVertexArray();
		
		// Bind VAO
		_extensions.bindVertexArray( scene.vao );

		// Bind each non-interleaved attribute individually
		Object.values( scene.geometry.attributes ).forEach( ( attribute, ndx ) => {
			const nonInterleavedAttribute = attribute as BufferAttribute;
			const attributeData = shaderAttributesData.find( attributeData => attributeData.name === nonInterleavedAttribute.name )!;
			const bufferData = _buffersHelper.get( nonInterleavedAttribute )!;
			_attributesHelper.bindStandardAttribute( nonInterleavedAttribute, attributeData, bufferData );
		} );
		_attributesHelper.bindIndices( _buffersHelper.get( scene.geometry.index! )! );

		// Close VAO
		_extensions.bindVertexArray( null );
	}
	
}


/**
 * Interface for WebGL VAO extensions (v1/v2 compatibility layer).
 */
interface IGLTextensions
{
	createVertexArray(): WebGLVertexArrayObject | WebGLVertexArrayObjectOES;
	bindVertexArray( arrayObject: WebGLVertexArrayObject | WebGLVertexArrayObjectOES | null ): void;
}

/**
 * WebGL1 implementation of VAO management using OES_vertex_array_object.
 */
export class GLExtensionV1 implements IGLTextensions
{
	/**
	 * Reference to OES_vertex_array_object extension.
	 * @internal
	 */
	private _vaoExtension: OES_vertex_array_object;

	constructor( gl: ParallaxRenderingContext )
	{
		this._vaoExtension = gl.getExtension( "OES_vertex_array_object" )!;
	}

	/**
	 * Creates a new Vertex Array Object (WebGL1)
	 */
	createVertexArray(): WebGLVertexArrayObjectOES
	{
		return this._vaoExtension.createVertexArrayOES();
	}

	/**
	 * Binds the given Vertex Array Object
	 * @param arrayObject 
	 */
	bindVertexArray( arrayObject: WebGLVertexArrayObjectOES | null ): void
	{
		this._vaoExtension.bindVertexArrayOES( arrayObject );
	}
}

/**
 * WebGL2 implementation of VAO management using native API.
 */
export class GLExtensionV2 implements IGLTextensions
{
	/**
	 * Reference to WebGL2 rendering context.
	 * @internal
	 */
	private _gl: WebGL2RenderingContext;

	constructor( gl: WebGL2RenderingContext )
	{
		this._gl = gl;
	}

	/**
	 * Creates a new Vertex Array Object (WebGL2).
	 */
	createVertexArray(): WebGLVertexArrayObject
	{
		return this._gl.createVertexArray();
	}

	/**
	 * Binds the given Vertex Array Object.
	 * @param arrayObject 
	 */
	bindVertexArray( arrayObject: WebGLVertexArrayObject | null ): void
	{
		this._gl.bindVertexArray( arrayObject );
	}
}
