import type { Options } from "tsup";
import { glslMinifierPlugin } from "../plugins/GLSLMinifier";

/**
 * @bug
 * Terser is renaming the standard JavaScript methods.
 */
export const packageConfigTidy = {
	loader: {
		'.glsl': 'text'
	},
	entry: [ 'src/index.ts' ],
	dts: true,
	outDir: 'dist',
	clean: true,
	format: [ 'cjs', 'esm' ],
	treeshake: true,
	splitting: false,
	cjsInterop: true,
	/**
	 * Tsup minify options
	 * @see https://tsup.egoist.dev/#minify-output
	 */
	terserOptions: {
		module: true,
		compress: {
			drop_console: true,
		},
		mangle: {
			properties: {
				// Mangle everything except public methods/properties exposed to the user
				reserved: [
					"createParallaxManager", "ParallaxManager", "ParallaxScene",
					// ParallaxManager
					"scenes", "initScene", "updateResolution", "dispose", "render",
					// ParallaxScene
					"id", "active", "setRect", "resize", "pointer", "setPointer",
				]
			},
		},
	},
	esbuildPlugins: [ glslMinifierPlugin ]
} as const satisfies Options;