import { isPOTTexture } from "../../helpers/isPot";

// Define GLenum as a number for type clarity
type GLenum = number;

/**
 * A TexImageSource as defined by the WebGL spec.
 */
type TexImageSource = HTMLImageElement | HTMLVideoElement | HTMLCanvasElement | ImageBitmap | ImageData;

/**
 * A function that returns a texture source.
 */
type TextureFunc = ( gl: ParallaxRenderingContext, options: TextureOptions ) => string | string[] | TexImageSource | TexImageSource[] | ArrayBufferView | ArrayBufferView[];

const GL_TEXTURE_2D = 0x0DE1;
const GL_TEXTURE_CUBE_MAP = 0x8513;
const GL_LINEAR = 0x2601;
const GL_NEAREST_MIPMAP_LINEAR = 0x2702;
const GL_RGBA = 0x1908;
const GL_RGB = 0x1907;
const GL_UNSIGNED_BYTE = 0x1401;
const GL_REPEAT = 0x2901;

/**
 * @see https://twgljs.org/docs/module-twgl.html#.TextureOptions
 */
const defaultOptions = {
	target: GL_TEXTURE_2D,
	level: 0,
	min: GL_NEAREST_MIPMAP_LINEAR, // If not pow2 -> GL_LINEAR
	mag: GL_LINEAR,
	internalFormat: GL_RGBA,
	format: GL_RGBA,
	type: GL_UNSIGNED_BYTE,
	wrap: GL_REPEAT,
	wrapS: GL_REPEAT,
	wrapT: GL_REPEAT,
	wrapR: GL_REPEAT,
	auto: true
} satisfies TextureOptions;

/**
 * Defines the comprehensive options for creating and setting up a WebGLTexture,
 * based on TWGL.js documentation.
 */
export interface TextureOptions 
{
	/**
	 * The texture target. (e.g., gl.TEXTURE_2D, gl.TEXTURE_CUBE_MAP).
	 * @default gl.TEXTURE_2D
	 */
	target?: 0x0DE1 | 0x8513;

	/**
	 * The mip level to affect.
	 * @default 0
	 */
	level?: number;

	/**
	 * The texture minification filter. (gl.TEXTURE_MIN_FILTER)
	 * @default gl.NEAREST_MIPMAP_LINEAR (or gl.LINEAR if not power-of-2 in WebGL1)
	 */
	min?: GLenum;

	/**
	 * The texture magnification filter. (gl.TEXTURE_MAG_FILTER)
	 * @default gl.LINEAR
	 */
	mag?: GLenum;

	/**
	 * Shorthand for setting both min and mag filter.
	 */
	minMag?: GLenum;

	/**
	 * The internal format of the texture.
	 * @default gl.RGBA
	 */
	internalFormat?: GLenum;

	/**
	 * The source format of the texture data.
	 * @default gl.RGBA
	 */
	format?: GLenum;

	/**
	 * The data type of the texture data.
	 * @default gl.UNSIGNED_BYTE
	 */
	type?: GLenum;

	/**
	 * Shorthand for texture wrapping (S, T, and R).
	 * @default gl.REPEAT (or gl.CLAMP_TO_EDGE for non-power-of-2 in WebGL1)
	 */
	wrap?: GLenum;

	/**
	 * The texture wrapping for the S (U) coordinate. (gl.TEXTURE_WRAP_S)
	 */
	wrapS?: GLenum;

	/**
	 * The texture wrapping for the T (V) coordinate. (gl.TEXTURE_WRAP_T)
	 */
	wrapT?: GLenum;

	/**
	 * The texture wrapping for the R (W) coordinate (WebGL2 only). (gl.TEXTURE_WRAP_R)
	 */
	wrapR?: GLenum;

	/**
	 * The minimum LOD level (WebGL2 only). (gl.TEXTURE_MIN_LOD)
	 */
	minLod?: number;

	/**
	 * The maximum LOD level (WebGL2 only). (gl.TEXTURE_MAX_LOD)
	 */
	maxLod?: number;

	/**
	 * The base mipmap level. (gl.TEXTURE_BASE_LEVEL)
	 */
	baseLevel?: number;

	/**
	 * The maximum mipmap level. (gl.TEXTURE_MAX_LEVEL)
	 */
	maxLevel?: number;

	/**
	 * For shadow/depth textures, the comparison function (WebGL2 only). (gl.TEXTURE_COMPARE_FUNC)
	 */
	compareFunc?: GLenum;

	/**
	 * For shadow/depth textures, the comparison mode (WebGL2 only). (gl.TEXTURE_COMPARE_MODE)
	 */
	compareMode?: GLenum;

	/**
	 * The unpack alignment (gl.UNPACK_ALIGNMENT).
	 * @default 1
	 */
	unpackAlignment?: number;

	/**
	 * Color to use for the texture before the async 'src' has loaded.
	 * @default [255, 0, 255, 255] (magenta) or a 1x1 blue pixel in twgl.
	 */
	color?: number[] | ArrayBufferView;

	/**
	 * Whether to premultiply alpha (gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL).
	 */
	premultiplyAlpha?: boolean;

	/**
	 * Whether to flip the texture vertically (gl.UNPACK_FLIP_Y_WEBGL).
	 */
	flipY?: boolean;

	/**
	 * The colorspace conversion (gl.UNPACK_COLORSPACE_CONVERSION_WEBGL).
	 */
	colorspaceConversion?: GLenum;

	/**
	 * Whether to auto-generate mipmaps and set filtering.
	 * @default true
	 */
	auto?: boolean;

	/**
	 * The order of faces for a cubemap.
	 */
	cubeFaceOrder?: GLenum[];

	/**
	 * The source data for the texture.
	 */
	src?: string | string[] | TexImageSource | TexImageSource[] | ArrayBufferView | ArrayBufferView[] | TextureFunc | null;

	/**
	 * crossOrigin setting for images loaded from a URL.
	 */
	crossOrigin?: string;

	/**
	 * The amount of anisotropic filtering to apply.
	 * Requires the 'EXT_texture_filter_anisotropic' extension.
	 */
	aniso?: number;
}

export class TextureHelper
{
	private _gl: ParallaxRenderingContext;
	
	constructor( gl: ParallaxRenderingContext )
	{
		this._gl = gl;
	}

	createTexture( image: ImageBitmap, options: TextureOptions = {} )
	{
		const gl = this._gl;

		const overridenOptions = { ...defaultOptions, ...options };
		const { target, level, internalFormat, format, type } = overridenOptions;

		const isPowerOfTwo = isPOTTexture( image.width, image.height );

		if ( ! isPowerOfTwo ){
			overridenOptions.min = gl.LINEAR; 
			overridenOptions.mag = gl.LINEAR; 
			overridenOptions.wrap = gl.CLAMP_TO_EDGE;
		}

		const texture = gl.createTexture();
		gl.bindTexture( target, texture );

		// 1. Set WebGL pixel store parameters
		this._setPixelStore( overridenOptions );

		gl.texImage2D( target, level, internalFormat, format, type, image );

		// Sets WebGL texture parameters
		this._setTextureParameters( target, overridenOptions );

		return texture;
	}

	/**
	 * Sets WebGL pixel store parameters from an options object.
	 *
	 * @param gl The WebGL rendering context.
	 * @param options An object with texture parameters.
	 */
	private _setPixelStore( options: TextureOptions )
	{
		const gl = this._gl;

		// --- Pixel Store parameters ---
		// Alignment for pixel rows (default is 1 in TWGL):contentReference[oaicite:44]{index=44}.
		if ( options.unpackAlignment !== undefined ){
			this._pixelStorei( gl.UNPACK_ALIGNMENT, options.unpackAlignment );
		}

		if ( options.premultiplyAlpha !== undefined ){
			this._pixelStorei( gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, options.premultiplyAlpha );
		}

		if ( options.flipY !== undefined ){
			this._pixelStorei( gl.UNPACK_FLIP_Y_WEBGL, options.flipY );
		}

		if ( options.colorspaceConversion !== undefined ){
			this._pixelStorei( gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, options.colorspaceConversion );
		}
	}

	/**
	 * Sets WebGL texture parameters (filtering and wrapping) from an options object.
	 *
	 * @param gl The WebGL rendering context.
	 * @param target The texture target (e.g., gl.TEXTURE_2D).
	 * @param options An object with texture parameters.
	 */
	private _setTextureParameters( target: GLenum, options: TextureOptions )
	{
		const gl = this._gl;

		// --- Texture Filtering ---
		// Determine min/mag filters. If minMag given, use for both; else use min/mag individually.
		// Use shorthand 'minMag' if 'min' or 'mag' are not specified
		const minFilter = options.min ?? options.minMag ?? gl.NEAREST_MIPMAP_NEAREST; 	// default min filter:contentReference[oaicite:45]{index=45};
		const magFilter = options.mag ?? options.minMag ?? gl.LINEAR;					// default mag filter:contentReference[oaicite:46]{index=46};

		this._texParameteri( target, gl.TEXTURE_MIN_FILTER, minFilter );
		this._texParameteri( target, gl.TEXTURE_MAG_FILTER, magFilter );

		// --- Texture Wrapping ---
		// If a uniform wrap is given, apply to S, T (and R if available).
		if ( options.wrap !== undefined ){
			this._texParameteri( target, gl.TEXTURE_WRAP_S, options.wrap );
			this._texParameteri( target, gl.TEXTURE_WRAP_T, options.wrap );
			// TEXTURE_WRAP_R is WebGL2 only:contentReference[oaicite:47]{index=47}.
			if ( 'TEXTURE_WRAP_R' in gl ){
				this._texParameteri( target, ( gl as WebGL2RenderingContext ).TEXTURE_WRAP_R, options.wrap );
			}
		}

		// Per-axis wrap overrides:
		if ( options.wrapS !== undefined ){
			this._texParameteri( target, gl.TEXTURE_WRAP_S, options.wrapS );
		}
		if ( options.wrapT !== undefined ){
			this._texParameteri( target, gl.TEXTURE_WRAP_T, options.wrapT );
		}
		// WebGL2: wrapR for 3D textures or 2D array textures:contentReference[oaicite:48]{index=48}.
		if ( options.wrapR !== undefined && 'TEXTURE_WRAP_R' in gl ){
			this._texParameteri( target, ( gl as WebGL2RenderingContext ).TEXTURE_WRAP_R, options.wrapR );
		}

		// --- WebGL2 / Extension Parameters ---
		const gl2 = gl as WebGL2RenderingContext;

		// level of detail
		if ( options.minLod && gl2.TEXTURE_MIN_LOD ){
			this._texParameterf( target, gl2.TEXTURE_MIN_LOD, options.minLod );
		}
		if ( options.maxLod && gl2.TEXTURE_MAX_LOD ){
			this._texParameterf( target, gl2.TEXTURE_MAX_LOD, options.maxLod );
		}

		// WebGL2: base and max level of mipmaps
		if ( options.baseLevel && gl2.TEXTURE_BASE_LEVEL ){
			this._texParameteri( target, gl2.TEXTURE_BASE_LEVEL, options.baseLevel );
		}
		if ( options.maxLevel && gl2.TEXTURE_MAX_LEVEL ){
			this._texParameteri( target, gl2.TEXTURE_MAX_LEVEL, options.maxLevel );
		}

		// Compare mode (for shadow samplers)
		if ( options.compareFunc && gl2.TEXTURE_COMPARE_FUNC ){
			this._texParameteri( target, gl2.TEXTURE_COMPARE_FUNC, options.compareFunc );
		}
		if ( options.compareMode && gl2.TEXTURE_COMPARE_MODE ){
			this._texParameteri( target, gl2.TEXTURE_COMPARE_MODE, options.compareMode );
		}

		// --- Mipmap Generation ---
		// If auto-mipmap is enabled (default true):contentReference[oaicite:49]{index=49}, generate mipmaps now.
		if ( options.auto !== false ){
			gl.generateMipmap( target );  // generates a full mipmap chain:contentReference[oaicite:50]{index=50}
		}

		// Anisotropy Extension
		if ( options.aniso ){

			const ext = 
				gl.getExtension( 'EXT_texture_filter_anisotropic' ) ||
				gl.getExtension( 'MOZ_EXT_texture_filter_anisotropic' ) ||
				gl.getExtension( 'WEBKIT_EXT_texture_filter_anisotropic' );
			
			if ( ext ){
				const maxAniso = gl.getParameter( ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT );
				this._texParameterf( target, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min( maxAniso, options.aniso ) );
			}

		}
	}

	private _pixelStorei( pname: number, param: number | boolean )
	{
		this._gl.pixelStorei( pname, param );
	}

	private _texParameteri( target: number, pname: number, param: number )
	{
		this._gl.texParameteri( target, pname, param );
	}
	
	private _texParameterf( target: number, pname: number, param: number )
	{
		this._gl.texParameterf( target, pname, param );
	}
}