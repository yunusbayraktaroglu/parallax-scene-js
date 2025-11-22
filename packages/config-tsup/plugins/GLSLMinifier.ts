import type { Plugin, BuildOptions, Loader } from 'esbuild';
import fs from 'node:fs';

/**
 * Basic GLSL Minifier mangler
 * Collects things starting with "_" and converts to a0, z0, c24...
 * 
 * @see https://esbuild.github.io/plugins
 */
export const glslMinifierPlugin: Plugin = {
	name: 'glsl-minifier',
	setup( build )
	{
		const glslPicker = /\.(glsl)$/;

		// Load paths tagged with the "env-ns" namespace and behave as if
		// they point to a JSON file containing the environment variables.
		build.onLoad( { filter: glslPicker }, async ( args ) => {
			
     		let code = await fs.promises.readFile( args.path, 'utf8' );

     		let i = 0;
      		const letters = "abcdefghijklmnoprstuvwyz";
    		const data: any = {};

			code = code.replace( /\b_\w+/g, ( match ) => {
				if ( ! data[ match ] ){
					const char = i % letters.length;
					const order = Math.floor( i / letters.length );
					const id = `${ letters.charAt( char ) }${ order }`;
					data[ match ] = id;
					i++;
				}
				return data[ match ];
			} );

			code = minifyShader( code );

      		return {
        		contents: code,
        		loader: 'text',
      		};

		} );
	},
};

/**
 * Minifies shader source code by
 * removing unnecessary whitespace and empty lines
 * 
 * @param shader Shader code with included chunks
 * @param newLine Flag to require a new line for the code
 * 
 * @returns Minified shader's source code
 * 
 * @see https://github.com/UstymUkhman/vite-plugin-glsl/blob/main/src/loadShader.js#L200
 */
function minifyShader( shader: string, newLine = false ): string
{
	return shader.replace( /\\(?:\r\n|\n\r|\n|\r)|\/\*.*?\*\/|\/\/(?:\\(?:\r\n|\n\r|\n|\r)|[^\n\r])*/g, '' )
		.split( /\n+/ ).reduce( ( result, line ) => {
			
			line = line.trim().replace( /\s{2,}|\t/, ' ' );

			if ( /@(vertex|fragment|compute)/.test( line ) || line.endsWith( 'return' ) ) line += ' ';

			if ( line[ 0 ] === '#' ){

				newLine && result.push( '\n' );
				result.push( line, '\n' );

				newLine = false;

			} else {

				!line.startsWith( '{' ) && result.length && result[ result.length - 1 ].endsWith( 'else' ) && result.push( ' ' );

				result.push( 
					line.replace( /\s*({|}|=|\*|,|\+|\/|>|<|&|\||\[|\]|\(|\)|\-|!|;)\s*/g, '$1' ) 
				);

				newLine = true;

			}

			return result;

		}, [] as string[] ).join( '' ).replace( /\n+/g, '\n' );
};