/**
 * All the attribute data can be pulled from the Shader
 */
export type ShaderAttributeData = {
	/**
	 * Name of the attribute in the shader file
	 */
	name: WebGLActiveInfo[ "name" ];
	/**
	 * Points the data size of the attribute
	 * @example
	 * 'attribute vec2 uv' → 2
	 * 'attribute float id' → 1
	 * 'attribute vec4 custom' → 4
	 * 'attribute vec3 position' → 3
	 */
	size: WebGLActiveInfo[ "size" ];
	/**
	 * GLEnum type of the uniform
	 * 
	 * @example
	 * gl.FLOAT
	 * gl.FLOAT_VEC2
	 * gl.FLOAT_VEC3
	 * gl.FLOAT_VEC4
	 */
	type: WebGLActiveInfo[ "type" ];
	/**
	 * Attribute location returned from getAttribLocation(),
	 * will be used binding them in render
	 * from 0 to n
	 */
	location: number;
	/**
	 * Is the attribute instanced
	 */
	instanced: boolean;
};

export type ShaderUniformData = {
	/**
	 * Name of the uniform in the shader file
	 */
	name: string;
	/**
	 * Points the data size of the attribute
	 * @example
	 * 'uniform vec2 u_resolution' → 2
	 * 'uniform mat3 u_projection' → 9
	 * 'uniform float u_time' → 1
	 * 'uniform sampler2D u_texture' → ?
	 */
	size: GLint;
	/**
	 * GLEnum type of the uniform
	 * 
	 * @example
	 * gl.SAMPLER_2D
	 * gl.SAMPLER_CUBE
	 * gl.FLOAT_VEC2
	 * gl.FLOAT_MAT3
	 */
	type: WebGLActiveInfo[ "type" ];
	/**
	 * Uniform location returned from getUniformLocation(),
	 * will be used binding them in render
	 * from 0 to n
	 */
	location: WebGLUniformLocation;
	/**
	 * Model of the Uniform
	 */
	model: 
		| { type: "TEXTURE"; unit: number }
		| { type: "ARRAY" }
		| { type: "STANDARD" }
};

export type ProgramInfo = {
	/**
	 * Generated WebGLProgram
	 */
	program: WebGLProgram;
	/**
	 * All the data about attributes that used in the shader
	 */
	attributesData: ShaderAttributeData[];
	/**
	 * All the data about uniforms that used in the shader
	 */
	uniformsData: ShaderUniformData[];
};

/**
 * Responsible for generating WebGLPrograms and 
 * pull all the possible `attribute` and `uniform` datas
 */
export class ProgramHelper
{
	gl: ParallaxRenderingContext;

	/**
	 * Creates a new ProgramHelper for managing WebGL programs.
	 *
	 * @param gl The WebGL rendering context used for WebGL program operations.
	 */
	constructor( gl: ParallaxRenderingContext )
	{
		this.gl = gl;
	}

	/**
	 * Creates ProgramInfo with given shaders
	 * 
	 * @param shaderSources [vertexShader, fragmentShader]
	 */
	createProgramInfo( shaderSources: [ string, string ] ): ProgramInfo
	{
		const program = this._createProgramFromSources( shaderSources, { "position": 0, "uv": 1, "atlas": 2 } );
		const attributesData = this._getAttributeData( program );
		const uniformsData = this._getUniformsData( program );

		return { program, attributesData, uniformsData };
	}

	/**
	 * Creates WebGLProgram from shader sources
	 * 
	 * @param shaderSources [vertexShader, fragmentShader]
	 * @param opt_attribs Constant attribute location usage
	 * @internal
	 */
	private _createProgramFromSources( shaderSources: [ string, string ], opt_attribs?: { [ key: string ]: number } ): WebGLProgram
	{
		const gl = this.gl;

		const shaders = shaderSources.map(( source, ndx ) => {

			const shader = gl.createShader( ndx === 0 ? gl.VERTEX_SHADER : gl.FRAGMENT_SHADER );

			if ( ! shader ){
				throw new Error( `Shader could not be created.` );
			}

			gl.shaderSource( shader, source );
			gl.compileShader( shader );

			if ( ! gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ){

				const shaderSource = gl.getShaderSource( shader );
				const info = gl.getShaderInfoLog( shader );
				gl.deleteShader( shader );

				throw new Error( `Could not compile shader: ${ info }\n\n${ shaderSource }` );
			}

			return shader;

		});

		const program = gl.createProgram() as WebGLProgram;
		shaders.forEach(( shader ) => gl.attachShader( program, shader ));

		/**
		 * Constant attribute location usage benefits
		 * 
		 * - Consistency Across Shader Programs: By explicitly assigning attribute indices, 
		 * you prevent OpenGL from assigning inconsistent or unexpected attribute indices when re-linking the program.
		 * - Ease of Debugging: It's easier to debug and maintain code when attribute bindings are explicitly stated.
		 * - Flexibility: Allows custom mappings, especially useful for reusable or complex systems where shaders and vertex data formats may vary.
		 */
		if ( opt_attribs ){
			Object.keys( opt_attribs ).forEach(( attrib, ndx ) => {
				gl.bindAttribLocation( program, ndx, attrib );
			});
		}

		gl.linkProgram( program );

		if ( ! gl.getProgramParameter( program, gl.LINK_STATUS ) ){

			const info = gl.getProgramInfoLog( program );
			gl.deleteProgram( program );

			throw new Error( `Could not link program: ${ info }` );

		}

		return program;
	}

	/**
	 * Analyzes shader program and returns binding states for only "used attributes".
	 * This means that only attributes actually referenced in the shader’s code are retained and reported.
	 * 
	 * The GLSL compiler automatically strips out attributes that are not used in any computations. 
	 * This is done for performance reasons.
	 * 
	 * @param program WebGLProgram
	 * @internal
	 */
	private _getAttributeData( program: WebGLProgram ): ShaderAttributeData[]
	{
		const gl = this.gl;

		const attributeDatas: ShaderAttributeData[] = [];
		const numAttribs = gl.getProgramParameter( program, gl.ACTIVE_ATTRIBUTES );

		for ( let i = 0; i < numAttribs; ++i ){

			// Control if attribute used in shader program
			const attribInfo = gl.getActiveAttrib( program, i );
			
			if ( ! attribInfo ){
				throw new Error( `WebGLActiveInfo missing: Index '${ i }'` );
			}

			const attributeName = attribInfo.name;
			const locationIndex = gl.getAttribLocation( program, attributeName );

			// Each attribute type requires a different binding model.
			// At this stage, we dont know if the attribute in the shader is Interleaved or not
			// AttributeData should include all information that we can pull from shader
			// const isInterleaved = ?;
			// const isStandard = ?;
			// const isInstanced = ?;
			const isInstanced = attributeName.startsWith( "instance" );

			attributeDatas.push( {
				name: attribInfo.name,
				size: attribInfo.size,
				type: attribInfo.type,
				location: locationIndex,
				instanced: isInstanced,
			} );
		}

		return attributeDatas;
	}

	/**
	 * Pulls uniform data from the WebGLProgram
	 * 
	 * The GLSL compiler automatically strips out uniforms that are not used in any computations. 
	 * This is done for performance reasons.
	 * 
	 * @param program WebGLProgram 
	 * @internal
	 */
	private _getUniformsData( program: WebGLProgram ): ShaderUniformData[]
	{
		const gl = this.gl;

		// Each found texture unit needs to increase this number
		let textureUnit = 0;
		
		const uniformDatas: ShaderUniformData[] = [];
		const numUniforms = gl.getProgramParameter( program, gl.ACTIVE_UNIFORMS );

		for ( let i = 0; i < numUniforms; i++ ){

			const uniformInfo = gl.getActiveUniform( program, i );

			if ( ! uniformInfo ){
				throw new Error( `WebGL UniformInfo missing: Index '${ i }'` );
			}

			let uniformName = uniformInfo.name;

			/**
			 * Array uniforms,
			 * get the main part of the string that points raw name
			 */
			if ( uniformName.endsWith( '[0]' ) ){
				uniformName = uniformName.slice( 0, -3 );
			}

			const location = gl.getUniformLocation( program, uniformInfo.name );

			if ( ! location ){
				console.warn( `Could not get location for uniform: ${ uniformName }` );
				continue;
			}

			// Detect texture uniforms
			const isTexture = uniformInfo.type === gl.SAMPLER_2D || uniformInfo.type === gl.SAMPLER_CUBE;

			// Detect array uniforms
			const isArray = uniformInfo.name.endsWith( "[0]" );

			let model: ShaderUniformData[ "model" ];

			switch( true )
			{
				case isTexture: {
					const unit = textureUnit++;
					model = { type: "TEXTURE", unit };
					break;
				};
				case isArray: {
					model = { type: "ARRAY" };
					break;
				};
				default: {
					model = { type: "STANDARD" };
				};
			}

			uniformDatas.push({
				name: uniformName,
				size: uniformInfo.size,
				type: uniformInfo.type,
				location,
				model
			});
		}

		return uniformDatas;
	}
}