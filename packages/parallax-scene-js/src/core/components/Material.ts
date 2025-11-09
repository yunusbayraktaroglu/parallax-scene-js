import { Uniforms } from '../controllers/webgl/UniformsHelpers';
import { ProgramInfo } from '../controllers/webgl/ProgramHelpers';
import { GLOBAL_UNIFORMS } from '../controllers/RenderController';

type ShadingSettings = {
	transparent: boolean;
	depthWrite: boolean;
};

type MaterialOptions = Partial<ShadingSettings> & {
	vertex: string;
	fragment: string;
	uniforms: Uniforms;
};

export class Material
{
	private static _nextId = 0;

	/**
     * Unique number for this material instance.
	 * Will be used to caching last rendering material, skipping gl.useProgram()
     */
    readonly id = Material._nextId++;

	vertex: string;
	fragment: string;
	shadingSettings: Partial<ShadingSettings>;
	programInfo?: ProgramInfo;

	uniforms: Uniforms;
	
	constructor( options: MaterialOptions )
	{
		const { uniforms, vertex, fragment, ...rest } = options;
		
		this.uniforms = uniforms;
		this.vertex = vertex;
		this.fragment = fragment;

		this.shadingSettings = rest;
	}

	updateUniforms( uniforms: Uniforms )
	{
		this.uniforms = { ...this.uniforms, ...uniforms };
	}
}


import vertexShader from '../shaders/vertex.glsl';
import vertexClipSpace from '../shaders/vertex-clipspace.glsl';
import fragmentShader from '../shaders/fragment.glsl';

export const DEFAULT_MATERIAL = new Material( { 
	vertex: vertexClipSpace,
	fragment: fragmentShader,
	transparent: true,
	uniforms: {
		u_image0: {
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