import { Uniforms } from '../controllers/webgl/UniformsHelpers';
import { ProgramInfo } from '../controllers/webgl/ProgramHelpers';
import { GLOBAL_UNIFORMS } from '../controllers/RenderController';

/**
 * Defines basic shading configuration for a material.
 * 
 * @todo
 * complete shading settings
 */
type ShadingSettings = {
	/**
	 * Enables or disables transparency.
	 */
	transparent: boolean;
	/**
	 * Controls whether depth information is written to the depth buffer.
	 */
	depthWrite: boolean;
};

/**
 * Describes parameters for creating a {@link Material}.
 */
type MaterialOptions = Partial<ShadingSettings> & {
	/**
	 * GLSL source code for the vertex shader.
	 */
	vertex: string;
	/**
	 * GLSL source code for the fragment shader.
	 */
	fragment: string;
	/**
	 * Shader uniforms and their values.
	 */
	uniforms: Uniforms;
};

/**
 * Represents a GPU material, encapsulating shader programs, uniforms, and shading options.
 */
export class Material
{
	private static _nextId = 0;

	/**
	 * Unique identifier for this material instance.
	 * Used to cache and skip redundant `gl.useProgram()` calls.
	 */
    readonly id = Material._nextId++;

	/**
	 * Vertex shader source code.
	 */
	vertex: string;

	/**
	 * Fragment shader source code.
	 */
	fragment: string;

	/**
	 * Material transparency and depth settings.
	 */
	shadingSettings: Partial<ShadingSettings>;

	/**
	 * WebGL program information generated after shader compilation and linking.
	 * It needs to be created by RenderController.
	 */
	programInfo?: ProgramInfo;

	/**
	 * Set of active uniforms for this material.
	 */
	uniforms: Uniforms;

	/**
	 * Creates a new {@link Material} instance with the given shader sources and options.
	 * 
	 * @param options - Shader sources, uniforms, and optional shading settings.
	 */
	constructor( options: MaterialOptions )
	{
		const { uniforms, vertex, fragment, ...rest } = options;
		
		this.uniforms = uniforms;
		this.vertex = vertex;
		this.fragment = fragment;

		this.shadingSettings = rest;
	}

	/**
	 * Merges new uniform values into the existing set.
	 * 
	 * @param uniforms - New uniforms to apply or update.
	 */
	updateUniforms( uniforms: Uniforms )
	{
		this.uniforms = { ...this.uniforms, ...uniforms };
	}
}


import vertexShader from '../shaders/vertex.glsl';
import fragmentShader from '../shaders/fragment.glsl';

/**
 * Default material used for basic rendering operations.
 */
export const DEFAULT_MATERIAL = new Material( { 
	vertex: vertexShader,
	fragment: fragmentShader,
	transparent: true,
	uniforms: {
		u_texture: {
			value: null
		},
		u_resolution: {
			value: { x: 0, y: 0 }
		},
		u_pointer: {
			value: { x: 0.5, y: 0.5 }
		}
	},
} );