import { defineConfig } from "tsup";
import { glslMinifierPlugin } from "./esbuild-plugin/GlslMinifier";

export default defineConfig({
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
		mangle: {
			properties: {
				regex: /^_/,
			  },
		},
	},
	esbuildPlugins: [ glslMinifierPlugin ]
});