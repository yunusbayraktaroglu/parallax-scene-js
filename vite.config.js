import { resolve } from 'path';
import { defineConfig } from 'vite';
import { header, glslMangler, copyExamples } from './vite.plugins';
import glsl from 'vite-plugin-glsl';

const devConfig = {
	root: 'examples',
	publicDir: '../public',
	build: {
		// Needed by preview server
		outDir: resolve( __dirname, 'dist' ),
	},
	plugins: [
		glslMangler(),
		glsl({ compress: true }),
	],
};

const buildConfig = {
	root: 'examples',
	publicDir: '../public',
	build: {
		outDir: resolve( __dirname, 'dist' ),
		emptyOutDir: true,
		minify: 'terser',
		terserOptions: {
			module: true,
			mangle: {
				properties: {
					keep_quoted: true,
					reserved: [
						'ParallaxManager',
						'setup', 'start', 'freeze', 'activateScene', 'updateResolution',
						'getX', 'getY', 'getZ', 'getW', 'setX', 'setY', 'setZ', 'setW'
					],
				},
			}
		},
		lib: {
			entry: resolve( __dirname, 'src/main.ts' ),
			name: 'ParallaxManager',
			fileName: 'parallax-scene',
		},
		rollupOptions: {
			output: {
				plugins: [ header() ]
			}
		},
	},

	plugins: [
		glslMangler(),
		glsl({ compress: true }),
		copyExamples( "./examples", "./dist" )
	],
}


export default defineConfig( ({ command, mode, ssrBuild }) => {

	if ( command === 'serve' ){

		if ( mode === "development" ) return devConfig;
		if ( mode === "production" ) return devConfig;
		
	} else {

		// command: 'build'
		return buildConfig;

	}
	
} );
