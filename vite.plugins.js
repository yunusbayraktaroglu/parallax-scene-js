import path from "path";
import fs from "fs";

/**
 * Copy examples folder to dist 
 * and change html content
 */
export function copyExamples( from, to, overwrite = false ){

	let bundleName = '';

	return {

		name: 'copy-files',
		
		config( config ){
			bundleName = config.build.lib.fileName;
		},

		closeBundle(){
			
			const log = msg => console.log( '\x1b[36m%s\x1b[0m', msg );

			log( `copy files: ${ from } → ${ to }` );

			fs.readdirSync( from ).forEach( file => {

				/**
				 * Do not copy css files
				 * vite already builds and adds to dist
				 */
				if ( /.\.css$/.test( file ) ) return; 

				const fromFile = `${ from }/${ file }`;
				const toFile = `${ to }/${ file }`;

				if ( fs.existsSync( toFile ) && ! overwrite ) return;
					
				log( `• ${ fromFile } → ${ toFile }` );

				fs.copyFileSync(
					path.resolve( fromFile ),
					path.resolve( toFile )
				);

				const htmlContent = fs.readFileSync( toFile, "UTF-8" );

				let newhtmlContent = '';

				newhtmlContent = htmlContent.replace( '{{style}}', `style.css` );
				newhtmlContent = newhtmlContent.replace( 
					/<script id="main" type="module">[\s\S]*?<\/script>/, 
					`<script src="./${ bundleName }.umd.cjs"></script>` 
				);

				fs.writeFileSync( toFile, newhtmlContent, 'UTF-8' );

			});

		}

	}
}


/**
 * Basic glsl mangler collect things start with "_" and 
 * converts to a0, z0, c24 ...
 */
export function glslMangler(){

	const glslPicker = /\.(glsl)$/;

	return {

		enforce: 'pre',
		name: 'glsl-mangler',

		transform( code, id ){

			if ( glslPicker.test( id ) === false ) return;

            let i = 0;
            const letters = "abcdefghijklmnoprstuvwyz";
            const data = {};

            code = code.replace( /\b_\w+/g, function( match, p1 ){

				if ( ! data[ match ] ){

					const char = i % letters.length;
					const order = Math.floor( i / letters.length );
					const id = `${ letters.charAt( char ) }${ order }`;
					data[ match ] = id;
					i++;
				}

            	return data[ match ];
            });

			return {
				code: code,
				map: null
			};

		}

	};

}


export function header(){

	return {

		renderChunk( code ){

			return `/**
 * @license
 * SPDX-License-Identifier: MIT
 * https://github.com/yunusbayraktaroglu/parallax-scene-js
 */
${ code }`;

		}

	};

}