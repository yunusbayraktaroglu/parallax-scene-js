import { ShaderUniformData } from "../programs/ProgramInfo";

export type Uniforms = {
    [ uniformName: string ]: {
        value: any;
    };
};

export class UniformsHelper
{
	gl: ParallaxRenderingContext;

	constructor( gl: ParallaxRenderingContext )
	{
		this.gl = gl;
	}

	/**
	 * @TODO
	 * Might be moved to, shader program info part,
	 * should be return pre calculated function for each 'named uniform'.
	 * like precalculated uniformsSetters();
	 * 
	 * @param uniformDatas Shader Uniform Datas
	 * @param uniforms Uniforms given from Material
	 */
	bindUniforms( uniformDatas: ShaderUniformData[], uniforms: Uniforms )
	{
		const gl = this.gl;

		/**
		 * @todo
		 * Control if every uniform in the ShaderUniformData has been setted, or display warning message
		 */

		Object.keys( uniforms ).forEach(( name ) => {

			const uniformData = uniformDatas.find( uniformData => uniformData.name === name );

			if ( ! uniformData ){
				console.warn( `Uniform: '${ name }' does not exist in program.` );
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

	private _setTexture( data: ShaderUniformData, texture: WebGLTexture )
	{
		const gl = this.gl;
		const model = data.model as Extract<ShaderUniformData[ "model" ], { type: "TEXTURE" }>;

		gl.uniform1i( data.location, model.unit );
		gl.activeTexture( gl.TEXTURE0 + model.unit );
		gl.bindTexture( data.type === gl.SAMPLER_2D ? gl.TEXTURE_2D : gl.TEXTURE_CUBE_MAP, texture );
	}

	private _setFloat( data: ShaderUniformData, value: number )
	{
		const gl = this.gl;
		gl.uniform1f( data.location, value );
	}

	private _setVec2( data: ShaderUniformData, value: number[] )
	{
		const gl = this.gl;
		gl.uniform2fv( data.location, value );
	}

	private _setVec3( data: ShaderUniformData, value: number[] )
	{
		const gl = this.gl;
		gl.uniform3fv( data.location, value );
	}

	private _setVec4( data: ShaderUniformData, value: number[] )
	{
		const gl = this.gl;
		gl.uniform4fv( data.location, value );
	}

	private _setMat3( data: ShaderUniformData, value: number[] )
	{
		const gl = this.gl;
		gl.uniformMatrix3fv( data.location, false, value );
	}
};