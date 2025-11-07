import { ParallaxScene } from '../components/ParallaxScene';
import { BufferHelper } from './buffers/BufferHelpers';
import { AttributeBinder, ProgramHelper, ProgramInfo } from './programs/ProgramInfo';
import { Uniforms, UniformsHelper } from './uniforms/UniformsHelper';

import { BufferAttribute } from '../buffers/BufferAttribute';

export const GLOBAL_UNIFORMS = {
	// We will have 1 canvas, resolution of our canvas
	u_resolution: {
		value: { x: 0, y: 0 }
	}
};

/**
 * Handles rendering process
 */
export class RenderController
{
	frame: number = 0;

	private _pixelRatio = 1.0;

	private _extensions: IGLTextensions;

	private _renderingContext: ParallaxRenderingContext;

	private _uniformsHelper: UniformsHelper;
	private _buffersHelper: BufferHelper;
	private _attributesHelper: AttributeBinder;
	private _programHelper: ProgramHelper;

	private _materialCache?: number;
	private _sceneCache?: ParallaxScene;

	constructor( gl: ParallaxRenderingContext, glVersion: "1" | "2" = "2" )
	{
		this._renderingContext = gl;

		this._buffersHelper = new BufferHelper( gl );
		this._programHelper = new ProgramHelper( gl );
		this._attributesHelper = new AttributeBinder( gl );
		this._uniformsHelper = new UniformsHelper( gl );

		this._extensions = glVersion === "2" ? new GLExtensionV2( gl as WebGL2RenderingContext ) : new GLExtensionV1( gl );

		gl.clearColor( 0, 1, 0, 1 );

		// Alpha rendering
		gl.enable( gl.BLEND );
		gl.blendFunc( gl.ONE, gl.ONE_MINUS_SRC_ALPHA );

		// Enable cull face
		//gl.enable( gl.CULL_FACE );
		//gl.cullFace( gl.FRONT );
	}

	setPixelRatio( ratio: number =  1 )
	{
		this._pixelRatio = ratio;
	}

	/**
	 * Should be called when CSS resize occurs
	 * Updates GL viewport & canvas & uniform of resolution
	 */
	updateResolution( width: number, height: number )
	{
		const gl = this._renderingContext;
		const canvas = gl.canvas as HTMLCanvasElement;

		gl.canvas.width = Math.floor( width * this._pixelRatio );
		gl.canvas.height = Math.floor( height * this._pixelRatio );

		//canvas.style.width = width + 'px';
		//canvas.style.height = height + 'px';

		GLOBAL_UNIFORMS.u_resolution.value.x = width;
		GLOBAL_UNIFORMS.u_resolution.value.y = height;

		gl.viewport( 0, 0, gl.canvas.width, gl.canvas.height );
	}

	/**
	 * Possibilities
	 * 
	 * - Different ParallasScenes uses same material
	 * - Only 1 Scene rendering repedately
	 * 
	 * @param scene 
	 */
	render( scene: ParallaxScene )
	{
		const gl = this._renderingContext;

		gl.clear( gl.COLOR_BUFFER_BIT );

		if ( ! scene.material ){
			console.warn( `Scene: '${ scene.id }' has not a material.` );
			return;
		}

		// Build material if the first rendering
		if ( ! scene.material.programInfo ){
			const { vertex, fragment } = scene.material;
			scene.material.programInfo = this._programHelper.createProgramInfo( [ vertex, fragment ] );
		}

		// Builds VAO and ProgramInfo if missing
		if ( ! scene.vao ){
			this._onBeforeRender( scene );
		}

		// Bind program and uniforms if its not in cache
		if ( this._materialCache !== scene.material.id ){

			// We are sure that programInfo builded in _onBeforeRender()
			const { uniforms, programInfo: { program, uniformsData } } = scene.material as { uniforms: Uniforms, programInfo: ProgramInfo };

			gl.useProgram( program );

			// Bind uniforms right after gl.useProgram
			this._uniformsHelper.bindUniforms( uniformsData, uniforms );

			// Cache material id
			this._materialCache = scene.material.id;

		}



		const { uniforms, programInfo: { uniformsData } } = scene.material as { uniforms: Uniforms, programInfo: ProgramInfo };

		this._uniformsHelper.bindUniforms( uniformsData, uniforms );

		
		//console.log( scene.pointer )

		// this._uniformsHelper.bindUniforms( scene.material.programInfo!.uniformsData, {
		// 	u_pointer: {
		// 		value: scene.pointer
		// 	},
		// 	u_projection: {
		// 		value: scene.camera.getProjectionMatrix()
		// 	}
		// } );

		


		/**
		 * @TODO
		 * Cache scene to avoid unneccesery VAO binding
		 */
		this._extensions.bindVertexArray( scene.vao! );

		//const { x, y, w, h } = scene.rect;
		//gl.viewport( x, y, w, h );
    	//gl.scissor( x, y, w, h );

		gl.drawElements( gl.TRIANGLES, scene.geometry.index!.count, gl.UNSIGNED_SHORT, 0 );

		this._extensions.bindVertexArray( null );

		this.frame++;
	}

	/**
	 * @TODO
	 * We should send every attribute in the geometry to update() again and again,
	 * that will compare `attribute.version` and updates WebGLBuffer if version increased,
	 * does return if nothing changed
	 * 
	 * @param scene 
	 */
	private _onBeforeRender( scene: ParallaxScene )
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

		this._bindInterleavedVAO( scene );
	}

	/**
	 * Binds ParallaxScene with *`interleaved`* attributes
	 * @param scene 
	 */
	private _bindInterleavedVAO( scene: ParallaxScene )
	{
		// We should know every location of the attributes before binding
		const shaderAttributesData = scene.material!.programInfo!.attributesData;

		// Open VAO
		scene.vao = this._extensions.createVertexArray();
		
		// Bind VAO
		this._extensions.bindVertexArray( scene.vao );
		
		// Assign VAO
		this._attributesHelper.bindInterleavedAttributes( scene.attributes, shaderAttributesData, this._buffersHelper.get( scene.attributes[ 0 ].data )! );
		this._attributesHelper.bindIndices( this._buffersHelper.get( scene.geometry.index! )! );
		
		// Close VAO
		this._extensions.bindVertexArray( null );
	}

	/**
	 * Binds ParallaxScene with *`non-interleaved`* attributes
	 * @param scene 
	 */
	private _bindStandard( scene: ParallaxScene )
	{
		const { _extensions, _buffersHelper, _attributesHelper } = this;

		// We should know every location of the attributes before binding
		const shaderAttributesData = scene.material!.programInfo!.attributesData;

		// Open VAO
		scene.vao = _extensions.createVertexArray();
		
		// Bind VAO
		_extensions.bindVertexArray( scene.vao );

		// Assign VAO - Repeat binding for each non-interleaved attribute
		Object.values( scene.geometry.attributes ).forEach(( attribute, ndx ) => {
			const nonInterleavedAttribute = attribute as BufferAttribute;
			const attributeData = shaderAttributesData.find( attributeData => attributeData.name === nonInterleavedAttribute.name )!;
			const bufferData = _buffersHelper.get( nonInterleavedAttribute )!;
			_attributesHelper.bindStandartAttribute( nonInterleavedAttribute, attributeData, bufferData );
		});
		_attributesHelper.bindIndices( _buffersHelper.get( scene.geometry.index! )! );

		// Close VAO
		_extensions.bindVertexArray( null );
	}

}



interface IGLTextensions
{
	createVertexArray(): WebGLVertexArrayObject | WebGLVertexArrayObjectOES;
	bindVertexArray( arrayObject: WebGLVertexArrayObject | WebGLVertexArrayObjectOES | null ): void;
}

class GLExtensionV1 implements IGLTextensions
{
	private _vaoExtension: OES_vertex_array_object;

	constructor( gl: ParallaxRenderingContext )
	{
		this._vaoExtension = gl.getExtension( "OES_vertex_array_object" )!;
	}

	createVertexArray(): WebGLVertexArrayObjectOES
	{
		return this._vaoExtension.createVertexArrayOES();
	}

	bindVertexArray( arrayObject: WebGLVertexArrayObjectOES | null )
	{
		this._vaoExtension.bindVertexArrayOES( arrayObject );
	}
}

class GLExtensionV2 implements IGLTextensions
{
	private _version = "2";
	private _gl: WebGL2RenderingContext;

	constructor( gl: WebGL2RenderingContext )
	{
		this._gl = gl;
	}

	createVertexArray(): WebGLVertexArrayObject
	{
		return this._gl.createVertexArray();
	}

	bindVertexArray( arrayObject: WebGLVertexArrayObject | null )
	{
		this._gl.bindVertexArray( arrayObject );
	}
}
