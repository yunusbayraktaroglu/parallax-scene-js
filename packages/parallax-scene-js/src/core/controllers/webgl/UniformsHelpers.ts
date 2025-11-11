import { ShaderUniformData } from "./ProgramHelpers";

/**
 * Represents a collection of shader uniforms and their current values.
 * Each property corresponds to a uniform variable in a shader program.
 */
export type Uniforms = {
    [ uniformName: string ]: {
        value: any;
    };
};

/**
 * Provides methods for binding and updating shader uniforms in WebGL programs.
 * Supports scalar, vector, matrix, and texture uniform types.
 */
export class UniformsHelper
{
	/**
	 * WebGL rendering context used for setting uniform values.
	 */
	gl: ParallaxRenderingContext;

	/**
	 * Creates a new UniformsHelper for managing WebGL uniforms.
	 *
	 * @param gl The WebGL rendering context used for uniform operations.
	 */
	constructor( gl: ParallaxRenderingContext )
	{
		this.gl = gl;
	}

	/**
	 * Binds all provided uniforms to their corresponding locations in the shader program.
	 * Automatically selects the correct setter based on uniform type.
	 *
	 * @todo Consider moving this logic to a shader program info utility that
	 *       precomputes setters for each uniform for better performance.
	 * @todo Add validation to ensure every declared shader uniform is set.
	 *
	 * @param uniformDatas Metadata describing active uniforms in the shader program.
	 * @param uniforms Key-value pairs containing uniform names and their assigned values.
	 */
	bindUniforms( uniformDatas: ShaderUniformData[], uniforms: Uniforms )
	{
		const gl = this.gl;

		/**
		 * @todo
		 * Verify that each declared shader uniform has been assigned a value.
		 */

		Object.keys( uniforms ).forEach(( name ) => {

			const uniformData = uniformDatas.find( uniformData => uniformData.name === name );

			if ( ! uniformData ){
				console.warn( `Uniform '${ name }' is not defined in the current shader program.` );
				delete uniforms[ name ];
				return;
			}

			const value = uniforms[ name ].value;

			switch( uniformData.model.type )
			{
				case "TEXTURE": {
					this._setTexture( uniformData, value );
					break;
				};
				case "ARRAY": {
					throw new Error( `Unsupported uniform type: ${ uniformData.type }` );
				};
				case "STANDARD": {
					switch( uniformData.type )
					{
						case gl.FLOAT: {
							this._setFloat( uniformData, value );
							break;
						}
						case gl.FLOAT_VEC2: {
							this._setVec2( uniformData, [ value.x, value.y ] );
							break;
						}
						case gl.FLOAT_VEC3: {
							this._setVec3( uniformData, value );
							break;
						}
						case gl.FLOAT_VEC4: {
							this._setVec4( uniformData, value );
							break;
						}
						case gl.FLOAT_MAT3: {
							this._setMat3( uniformData, value );
							break;
						}
						default: {
							throw new Error( `Unsupported uniform type: ${ uniformData.type }` );
						}
					}
				};
			}
		});
	}

	/**
	 * Sets a texture uniform by binding it to a texture unit and updating the sampler location.
	 *
	 * @param data Metadata for the texture uniform.
	 * @param texture The WebGLTexture to bind.
	 * @internal
	 */
	private _setTexture( data: ShaderUniformData, texture: WebGLTexture )
	{
		const gl = this.gl;
		const model = data.model as Extract<ShaderUniformData[ "model" ], { type: "TEXTURE" }>;

		gl.uniform1i( data.location, model.unit );
		gl.activeTexture( gl.TEXTURE0 + model.unit );
		gl.bindTexture( data.type === gl.SAMPLER_2D ? gl.TEXTURE_2D : gl.TEXTURE_CUBE_MAP, texture );
	}

	/**
	 * Sets a single floating-point uniform value.
	 *
	 * @param data Metadata for the uniform.
	 * @param value Numeric value to assign.
	 * @internal
	 */
	private _setFloat( data: ShaderUniformData, value: number )
	{
		const gl = this.gl;
		gl.uniform1f( data.location, value );
	}

	/**
	 * Sets a vec2 uniform value.
	 *
	 * @param data Metadata for the uniform.
	 * @param value Array of two numeric components.
	 * @internal
	 */
	private _setVec2( data: ShaderUniformData, value: number[] )
	{
		const gl = this.gl;
		gl.uniform2fv( data.location, value );
	}

	/**
	 * Sets a vec3 uniform value.
	 *
	 * @param data Metadata for the uniform.
	 * @param value Array of three numeric components.
	 * @internal
	 */
	private _setVec3( data: ShaderUniformData, value: number[] )
	{
		const gl = this.gl;
		gl.uniform3fv( data.location, value );
	}

	/**
	 * Sets a vec4 uniform value.
	 *
	 * @param data Metadata for the uniform.
	 * @param value Array of four numeric components.
	 * @internal
	 */
	private _setVec4( data: ShaderUniformData, value: number[] )
	{
		const gl = this.gl;
		gl.uniform4fv( data.location, value );
	}

	/**
	 * Sets a 3x3 matrix uniform value.
	 *
	 * @param data Metadata for the uniform.
	 * @param value Flat array of nine numeric components representing the matrix.
	 * @internal
	 */
	private _setMat3( data: ShaderUniformData, value: number[] )
	{
		const gl = this.gl;
		gl.uniformMatrix3fv( data.location, false, value );
	}
};