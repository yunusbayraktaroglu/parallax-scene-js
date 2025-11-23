import { ParallaxManager, type ParallaxManagerDeps, type ParallaxSceneOptions } from '../src/core/ParallaxManager';

// See src/factories/createParallaxManager.ts to manager construction
// We mock all imported modules.

import { GLController } from '../src/core/controllers/GLController';
import { RenderController, GLOBAL_UNIFORMS } from '../src/core/controllers/RenderController';
import { ResourceController } from '../src/core/controllers/ResourceController';
import { AdvancedAssetLoader } from '../src/core/loaders/advanced/AdvancedAssetLoader';
import { ParallaxScene } from '../src/core/components/ParallaxScene';
import { DEFAULT_MATERIAL } from '../src/core/components/Material';
import { MergeResult } from '../src/core/packers/BaseTexturePacker';

jest.mock( '../src/core/controllers/GLController', () => ( {
	GLController: jest.fn().mockImplementation( () => {
		return {
			gl: {
				clear: jest.fn(),
				COLOR_BUFFER_BIT: 0x00004000,
				DEPTH_BUFFER_BIT: 0x00000100,
			}
		};
	} )
} ) );

jest.mock( '../src/core/controllers/RenderController', () => ( {
	RenderController: jest.fn().mockImplementation( () => {
		return {
			setPixelRatio: jest.fn(),
			updateResolution: jest.fn(),
			dispose: jest.fn(),
			render: jest.fn(),
		};
	} ),
	GLOBAL_UNIFORMS: { // Mock the global uniform object
		u_resolution: { value: { x: 0, y: 0 } },
	},
} ) );

jest.mock( '../src/core/controllers/ResourceController', () => ( {
	ResourceController: jest.fn().mockImplementation( () => {
		return {
			merge: jest.fn(),
			createTexture: jest.fn(),
			add: jest.fn(),
			deleteImage: jest.fn(),
		};
	} )
} ) );

jest.mock( '../src/core/loaders/advanced/AdvancedAssetLoader', () => ( {
	AdvancedAssetLoader: jest.fn().mockImplementation( () => {
		return {
			loadImagesAsync: jest.fn(),
		};
	} )
} ) );

jest.mock( '../src/core/components/ParallaxScene', () => ( {
	ParallaxScene: jest.fn(), // Mock the class constructor
} ) );

jest.mock( '../src/core/components/Material', () => ( {
	DEFAULT_MATERIAL: { id: 'default-material' }, // Mock the default material
} ) );

// Create typed mock instances
const MockGLController = GLController as jest.MockedClass<typeof GLController>;
const MockRenderController = RenderController as jest.MockedClass<typeof RenderController>;
const MockResourceController = ResourceController as jest.MockedClass<typeof ResourceController>;
const MockAdvancedAssetLoader = AdvancedAssetLoader as jest.MockedClass<typeof AdvancedAssetLoader>;
const MockParallaxScene = ParallaxScene as jest.MockedClass<typeof ParallaxScene>;

describe( 'ParallaxManager', () => {

	let manager: ParallaxManager;
	let mockDeps: ParallaxManagerDeps;

	// Mock instances of dependencies
	let mockGlController: jest.Mocked<GLController>;
	let mockRenderController: jest.Mocked<RenderController>;
	let mockResourceController: jest.Mocked<ResourceController>;
	let mockLoader: jest.Mocked<AdvancedAssetLoader>;
	let mockGl: jest.Mocked<WebGL2RenderingContext>;

	beforeEach( () => {

		// Reset all mocks before each test
		jest.clearAllMocks();

		// We pass `undefined as any` to satisfy TypeScript's constructor signature check.
    	// The mock implementation (which we defined in jest.mock) ignores this argument anyway.
		mockGlController = new MockGLController( undefined as any ) as jest.Mocked<GLController>;
		mockRenderController = new MockRenderController( undefined as any ) as jest.Mocked<RenderController>;
		mockResourceController = new MockResourceController( undefined as any ) as jest.Mocked<ResourceController>;
		mockLoader = new MockAdvancedAssetLoader() as jest.Mocked<AdvancedAssetLoader>;

		// Extract the mock gl context for assertions
		mockGl = mockGlController.gl as jest.Mocked<WebGL2RenderingContext>;

		mockDeps = {
			glController: mockGlController,
			renderController: mockRenderController,
			resourceController: mockResourceController,
			loader: mockLoader,
		};

		// Instantiate the class under test
		manager = new ParallaxManager( mockDeps );

	} );

	it( 'should be created successfully', () => {

		expect( manager ).toBeDefined();
		expect( manager.scenes.size ).toBe( 0 );

	} );

	describe( 'initScene', () => {

		const mockSceneOptions: ParallaxSceneOptions = {
			id: 'scene-1',
			layers: [
				{ url: 'layer1.png', parallax: { x: 0.1, y: 0.1 }, fit: { w: 1 } },
				{ url: 'layer2.png', parallax: { x: 0.2, y: 0.2 }, fit: { h: 1 } },
			],
		};

		const mockImages = [
			{ url: 'layer1.png', file: { width: 100, height: 100, close: jest.fn() } as ImageBitmap },
			{ url: 'layer2.png', file: { width: 200, height: 200, close: jest.fn() } as ImageBitmap },
		];

		const mockMergeData: MergeResult & { hash: string } = {
			image: { width: 256, height: 256, close: jest.fn() } as ImageBitmap,
			data: {
				size: { w: 256, h: 256 },
				atlas: [
					{ id: 'layer1.png', source: {} as ImageBitmap, x: 0, y: 0, w: 100, h: 100, normalized: { x: 0, y: 0, w: 0, h: 0 } },
					{ id: 'layer2.png', source: {} as ImageBitmap, x: 0, y: 100, w: 200, h: 200, normalized: { x: 0, y: 0, w: 0, h: 0 } },
				],
			},
			hash: 'merge-hash-123',
		};

		const mockTexture = { id: 'mock-gl-texture' };

		beforeEach( () => {

			mockLoader.loadImagesAsync.mockResolvedValue( mockImages );
			mockResourceController.merge.mockResolvedValue( mockMergeData );
			mockResourceController.createTexture.mockReturnValue( mockTexture );

			// Mock the ParallaxScene constructor to return a specific instance
			MockParallaxScene.mockImplementation( ( settings ) => {
				return {
					id: settings.id,
					settings: settings,
					active: true,
					// ... other properties
				} as unknown as ParallaxScene;
			} );
			
		} );

		it( 'should initialize a new scene, load, and create resources', async () => {
			
			const onProgress = jest.fn();
			const scene = await manager.initScene( mockSceneOptions, onProgress );

			// 1. Check loading
			expect( mockLoader.loadImagesAsync ).toHaveBeenCalledWith( mockSceneOptions.layers, onProgress );

			// 2. Check merging
			expect( mockResourceController.merge ).toHaveBeenCalledWith( mockImages, { alpha: true } );

			// 3. Check texture creation
			expect( mockResourceController.createTexture ).toHaveBeenCalledWith(
				mockMergeData.hash,
				mockMergeData.image,
				{ premultiplyAlpha: true }
			);

			// 4. Check resource registration
			expect( mockResourceController.add ).toHaveBeenCalledWith( 'Merged:scene-1', mockMergeData.image );
			expect( mockResourceController.add ).toHaveBeenCalledWith( "layer1.png", mockImages[ 0 ].file );
			expect( mockResourceController.add ).toHaveBeenCalledWith( "layer2.png", mockImages[ 1 ].file );
			expect( mockResourceController.add ).toHaveBeenCalledTimes( 3 );

			// 5. Check ParallaxScene construction
			expect( MockParallaxScene ).toHaveBeenCalledWith( {
				id: 'scene-1',
				layers: [
					{
						id: `0`,
						image: "layer1.png",
						settings: mockSceneOptions.layers[ 0 ],
						atlas: mockMergeData.data.atlas[ 0 ],
						ratio: 100 / 100,
					},
					{
						id: `1`,
						image: "layer2.png",
						settings: mockSceneOptions.layers[ 1 ],
						atlas: mockMergeData.data.atlas[ 1 ],
						ratio: 200 / 200,
					},
				],
				texture: mockTexture,
				material: DEFAULT_MATERIAL,
			} );

			// 6. Check state
			expect( manager.scenes.get( 'scene-1' ) ).toBe( scene );
			expect( scene.id ).toBe( 'scene-1' );

		} );

		it( 'should return a cached scene if it already exists', async () => {

			// Initial call
			const scene1 = await manager.initScene( mockSceneOptions );
			scene1.active = false; // Deactivate it for the test

			// Clear mocks to check they aren't called again
			// We clear the mock functions *on the instances*
			mockLoader.loadImagesAsync.mockClear();
			mockResourceController.merge.mockClear();
			mockResourceController.createTexture.mockClear();

			// Spy on console.log
			//const consoleLogSpy = jest.spyOn( console, 'log' ).mockImplementation();

			// Second call
			const scene2 = await manager.initScene( mockSceneOptions );

			expect( scene2 ).toBe( scene1 ); // Should be the same instance
			expect( scene1.active ).toBe( true ); // Should be reactivated
			expect( manager.scenes.get( 'scene-1' ) ).toBe( scene1 );
			//expect( consoleLogSpy ).toHaveBeenCalledWith( "Scene: 'scene-1' is exist" );

			// Ensure no expensive operations were run
			expect( mockLoader.loadImagesAsync ).not.toHaveBeenCalled();
			expect( mockResourceController.merge ).not.toHaveBeenCalled();
			expect( mockResourceController.createTexture ).not.toHaveBeenCalled();

			//consoleLogSpy.mockRestore();

		} );

		it( 'should throw an error if texture packing fails', async () => {

			// Mock merge to return data without a matching layer
			mockResourceController.merge.mockResolvedValue( {
				...mockMergeData,
				data: {
					// @ts-expect-error - Intentionally a wrong configuration
					atlas: [ { id: 'wrong-configuration', x: 0, y: 0, w: 10, h: 10 } ],
				},
			} );

			await expect( manager.initScene( mockSceneOptions ) ).rejects.toThrow();

		} );

		it( 'should throw and propagate errors from loader', async () => {

			const loadError = new Error( 'Failed to load images' );
			mockLoader.loadImagesAsync.mockRejectedValue( loadError );

			await expect( manager.initScene( mockSceneOptions ) ).rejects.toThrow( 'Failed to load images' );

		} );
	} );

	describe( 'updateResolution', () => {

		it( 'should update RenderController', () => {

			manager.updateResolution( 1920, 1080, 2 );

			expect( mockRenderController.setPixelRatio ).toHaveBeenCalledWith( 2 );
			expect( mockRenderController.updateResolution ).toHaveBeenCalledWith( 1920, 1080 );

		} );

	} );

	describe( 'dispose', () => {

		const mockImages = [
			{ url: 'layer1.png', file: { width: 100, height: 100, close: jest.fn() } as unknown as ImageBitmap },
			{ url: 'layer2.png', file: { width: 200, height: 200, close: jest.fn() } as unknown as ImageBitmap },
		];

		const mockMergeData: MergeResult & { hash: string } = {
			image: { width: 256, height: 256, close: jest.fn() } as unknown as ImageBitmap,
			data: {
				size: { w: 256, h: 256 },
				atlas: [
					{ id: 'layer1.png', source: {} as ImageBitmap, x: 0, y: 0, w: 100, h: 100, normalized: { x: 0, y: 0, w: 0, h: 0 } },
					{ id: 'layer2.png', source: {} as ImageBitmap, x: 0, y: 100, w: 200, h: 200, normalized: { x: 0, y: 0, w: 0, h: 0 } },
				],
			},
			hash: 'merge-hash-123',
		};

		const mockTexture = { id: 'mock-gl-texture' };

		beforeEach( () => {

			mockLoader.loadImagesAsync.mockResolvedValue( mockImages );
			mockResourceController.merge.mockResolvedValue( mockMergeData );
			mockResourceController.createTexture.mockReturnValue( mockTexture );

			// Mock the ParallaxScene constructor to return a specific instance
			MockParallaxScene.mockImplementation( ( settings ) => {
				return {
					id: settings.id,
					settings: settings,
					active: true,
					// ... other properties
				} as unknown as ParallaxScene;
			} );

		} );

		it( 'should dispose a scene and clean up all its resources', async () => {

			// 1. Create a scene first
			const scene = await manager.initScene( {
				id: 'scene-to-dispose',
				layers: [ 
					{ url: 'layer1.png', parallax: { x: 0.1, y: 0.1 }, fit: { w: 1 } },
					{ url: 'layer2.png', parallax: { x: 0.1, y: 0.1 }, fit: { w: 1 } } 
				],
			} );

			expect( manager.scenes.has( 'scene-to-dispose' ) ).toBe( true );

			// Spy on console.warn
			//const consoleWarnSpy = jest.spyOn( console, 'warn' ).mockImplementation();

			// 2. Call dispose
			manager.dispose( scene );

			// 3. Check assertions
			// We check the mock function on the instance
			expect( mockResourceController.deleteImage ).toHaveBeenCalledWith( 'layer1.png' );
			expect( mockResourceController.deleteImage ).toHaveBeenCalledWith( 'layer2.png' );
			expect( mockResourceController.deleteImage ).toHaveBeenCalledWith( 'Merged:scene-to-dispose' );
			expect( mockResourceController.deleteImage ).toHaveBeenCalledTimes( 3 );

			expect( mockRenderController.dispose ).toHaveBeenCalledWith( scene );
			expect( manager.scenes.has( 'scene-to-dispose' ) ).toBe( false );
			//expect( consoleWarnSpy ).toHaveBeenCalledWith( "Scene 'scene-to-dispose' disposed." );

			//consoleWarnSpy.mockRestore();

		} );
	} );

	describe( 'render', () => {
		let scene1: ParallaxScene;
		let scene2: ParallaxScene;

		beforeEach( async () => {

			// Create and add two mock scenes
			scene1 = { id: 'scene1', active: true, settings: {} } as ParallaxScene;
			scene2 = { id: 'scene2', active: false, settings: {} } as ParallaxScene;

			manager.scenes.set( scene1.id, scene1 );
			manager.scenes.set( scene2.id, scene2 );

		} );

		it( 'should render all active scenes', () => {

			manager.render();

			expect( mockGl.clear ).toHaveBeenCalledWith( mockGl.COLOR_BUFFER_BIT );

			// Should render active scene1
			expect( mockRenderController.render ).toHaveBeenCalledWith( scene1 );

			// Should NOT render inactive scene2
			expect( mockRenderController.render ).not.toHaveBeenCalledWith( scene2 );

			expect( mockRenderController.render ).toHaveBeenCalledTimes( 1 );

		} );

		it( 'should render no scenes if all are inactive', () => {

			scene1.active = false;

			manager.render();

			expect( mockGl.clear ).toHaveBeenCalledTimes( 1 );
			expect( mockRenderController.render ).not.toHaveBeenCalled();

		} );
	} );
} );