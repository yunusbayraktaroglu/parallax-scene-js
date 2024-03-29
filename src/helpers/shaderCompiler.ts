
export function initShaderProgram( gl: GlTypes, vsSource: string, fsSource: string ): WebGLProgram | null {

	const vertexShader = loadShader( gl, gl.VERTEX_SHADER, vsSource );
	const fragmentShader = loadShader( gl, gl.FRAGMENT_SHADER, fsSource );

	if ( ! vertexShader || ! fragmentShader ) return null;

	// Create the shader program
	const shaderProgram = gl.createProgram() as WebGLProgram;

	gl.attachShader( shaderProgram, vertexShader );
	gl.attachShader( shaderProgram, fragmentShader );
	gl.linkProgram( shaderProgram );

	if ( ! gl.getProgramParameter( shaderProgram, gl.LINK_STATUS ) ){

		console.error( `Unable to initialize the shader program: ${ gl.getProgramInfoLog( shaderProgram ) }` );
		return null;
	}

	return shaderProgram;
}


function loadShader( gl: GlTypes, type: number, source: string ): WebGLShader | null {

	const shader = gl.createShader( type ) as WebGLShader;

	// Send the source to the shader object
	gl.shaderSource( shader, source );

	// Compile the shader program
	gl.compileShader( shader );

	if ( ! gl.getShaderParameter( shader, gl.COMPILE_STATUS ) ){

		console.error( `An error occurred compiling the shaders: ${ gl.getShaderInfoLog( shader ) }` );
		gl.deleteShader( shader );
		return null;
	}

	return shader;
}
