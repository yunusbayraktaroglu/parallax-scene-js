import { GLController } from '../core/controllers/GLController';
import { RenderController, GLExtensionV1, GLExtensionV2 } from '../core/controllers/RenderController';
import { ResourceController } from '../core/controllers/ResourceController';

import { BufferHelper } from '../core/controllers/webgl/BufferHelpers';
import { ProgramHelper } from '../core/controllers/webgl/ProgramHelpers';
import { AttributeHelper } from '../core/controllers/webgl/AttributeHelpers';
import { UniformsHelper } from '../core/controllers/webgl/UniformsHelpers';
import { TextureHelper } from '../core/controllers/webgl/TextureHelpers';

import { BinaryTreeTexturePacker } from '../core/packers/BinaryTreeTexturePacker';

import { BasicAssetLoader } from '../core/loaders/basic/BasicAssetLoader';
import { AdvancedAssetLoader } from '../core/loaders/advanced/AdvancedAssetLoader';

import { ParallaxManager } from '../core/ParallaxManager';

/**
 * Configuration options for initializing the Parallax Scene Manager.
 */
interface ParallaxManagerOptions
{
	canvas: HTMLCanvasElement;
	/**
	 * WebGL Version
	 * @default 2
	 */
	version?: "1" | "2";
	/**
	 * WebGL context attributes applied during initialization.
	 */
	attributes: WebGLContextAttributes;
	/**
	 * - advanced: Uses AdvancedAssetLoader, supports {@link ProgressEvent} and displays percentage-based progress.
	 * - basic: Uses BasicAssetLoader, does not support {@link ProgressEvent}, uses item count–based progress.
	 */
	loader: "advanced" | "basic";
};

export function createParallaxManager( options: ParallaxManagerOptions )
{
	const glController = new GLController( options );

	const context = glController.gl;
	const version = glController.version;
	const loaderType = options.loader;

	const loader = loaderType === "advanced" ? new AdvancedAssetLoader() : new BasicAssetLoader();
	const resourceController = new ResourceController( {
		textureHelper: new TextureHelper( context, version ),
		// @bug Using gl.maxTextureSize causes atlas normalization errors during texture packing.
		// Used 8192 as workaround
		packer: new BinaryTreeTexturePacker( 8192 )
	} );
	const extensions = version === "2" ? new GLExtensionV2( context as WebGL2RenderingContext ) : new GLExtensionV1( context );
	const renderController = new RenderController( {
		context,
		extensions,
		buffersHelper: new BufferHelper( context ),
		programHelper: new ProgramHelper( context ),
		attributesHelper: new AttributeHelper( context ),
		uniformsHelper: new UniformsHelper( context ),
	} );

	return new ParallaxManager( {
		glController,
		renderController,
		resourceController,
		loader
	} );
}