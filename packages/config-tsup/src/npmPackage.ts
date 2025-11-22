import type { Options } from "tsup";
import { glslMinifierPlugin } from "../plugins/GLSLMinifier";

export const packageConfig = {
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
		compress: {
			drop_console: [ "warn" ],
		},
		mangle: {
			properties: {
				regex: /^_/,
			},
		},
	},
	esbuildPlugins: [ glslMinifierPlugin ]
} as const satisfies Options;