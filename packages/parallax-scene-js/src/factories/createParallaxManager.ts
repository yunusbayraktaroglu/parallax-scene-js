import { GLController } from '../core/controllers/GLController';
import { RenderController, GLExtensionV1, GLExtensionV2 } from '../core/controllers/RenderController';
import { ResourceController } from '../core/controllers/ResourceController';

import { BufferHelper } from '../core/controllers/webgl/BufferHelpers';
import { ProgramHelper } from '../core/controllers/webgl/ProgramHelpers';
import { AttributeHelper } from '../core/controllers/webgl/AttributeHelpers';
import { UniformsHelper } from '../core/controllers/webgl/UniformsHelpers';
import { TextureHelper } from '../core/controllers/webgl/TextureHelpers';

import { BinaryTreeTexturePacker } from '../core/packers/BinaryTreeTexturePacker';
import { SkylineTexturePacker } from '../core/packers/SkylineTexturePacker';

import { BasicAssetLoader } from '../core/loaders/basic/BasicAssetLoader';
import { AdvancedAssetLoader } from '../core/loaders/advanced/AdvancedAssetLoader';

import { ParallaxManager } from '../core/ParallaxManager';

/**
 * Configuration options for initializing the Parallax Scene Manager.
 */
export type ParallaxManagerOptions = {
	canvas: HTMLCanvasElement;
	/**
	 * WebGL Version
	 * @default 2
	 */
	version?: '1' | '2';
	/**
	 * WebGL context attributes applied during initialization.
	 */
	attributes: WebGLContextAttributes;
	/**
	 * - advanced: Uses AdvancedAssetLoader, supports {@link ProgressEvent} and displays percentage-based progress.
	 * - basic: Uses BasicAssetLoader, does not support {@link ProgressEvent}, uses item count–based progress.
	 */
	loader: 'advanced' | 'basic';
	/**
	 * Instead of using MAX_TEXTURE_SIZE supported by user device,
	 * uses a custom value.
	 * 256 512 1024 2048 4086 ...
	 * Generated textures will be resized to that value
	 */
	maxTextureSize?: number;
	/**
	 * Texture packing algorithm
	 * 
	 * @default 'binaryTree'
	 * @see https://jvernay.fr/en/blog/skyline-2d-packer/implementation/
	 * 
	 * @todo
	 * Skyline should be improved, current implementation creates bigger merging results than binaryTree 
	 */
	texturePacker?: 'binaryTree' | 'skyline';
};

export function createParallaxManager( options: ParallaxManagerOptions )
{
	const glController = new GLController( options );

	const context = glController.gl;
	const version = glController.version;
	const maxTextureSize = options.maxTextureSize || context.getParameter( context.MAX_TEXTURE_SIZE );
	const packer = options.texturePacker || 'binaryTree';

	const loader = options.loader === 'advanced' ? new AdvancedAssetLoader() : new BasicAssetLoader();
	const texturePacker = packer === 'skyline' ? new SkylineTexturePacker( maxTextureSize, maxTextureSize, maxTextureSize ) : new BinaryTreeTexturePacker( maxTextureSize );
	const resourceController = new ResourceController( {
		texturePacker,
		textureHelper: new TextureHelper( context, version ),
	} );
	const extensions = version === '2' ? new GLExtensionV2( context as WebGL2RenderingContext ) : new GLExtensionV1( context );
	const renderController = new RenderController( {
		context,
		extensions,
		buffersHelper: new BufferHelper( context ),
		programHelper: new ProgramHelper( context ),
		attributesHelper: new AttributeHelper( context ),
		uniformsHelper: new UniformsHelper( context ),
	} );

	return new ParallaxManager( {
		loader,
		glController,
		renderController,
		resourceController
	} );
}