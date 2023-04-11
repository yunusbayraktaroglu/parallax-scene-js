import '../examples/.style.css';

import { RenderController } from './controllers/RenderController';
import { PointerController, UPointer } from './controllers/PointerController';
import { GLController } from './controllers/GLController';
import { ParallaxScene } from './components/ParallaxScene';
import { loadImages } from './helpers/imageLoader';
import { TexturePacker } from './helpers/TexturePacker';

export default class WebGLParallaxManager {

	glController: GLController;
	renderController: RenderController;
	pointerController: PointerController;
	texturePacker: TexturePacker;

	scenes: Array<ParallaxScene> = [];
	activeScene!: number;
	protected _running = false;
	protected _lastRenderRequest = 0;

	constructor( canvas = undefined ){

		this.glController = new GLController( canvas );
		this.renderController = new RenderController( this.glController.gl );
		this.pointerController = new PointerController();
		this.texturePacker = new TexturePacker();
		this.texturePacker.maxTextureSize = this.glController.maxTextureSize!;
	}

	/** Setup */
	async setup( callback?: () => void ): Promise<void> {

		try {

			await this.collectScenes();
			this.pointerController.init( this.glController.canvas );

			if ( callback ) callback();

		} catch ( error ){

			console.error( error );

		}

	}
	
	/** Collect HTML nodes */
	async collectScenes(): Promise<void> {

		try {
			
			const texturePacker = this.texturePacker;
			const scenes = document.querySelectorAll( "[data-parallax-scene]" ) as NodeListOf<HTMLElement>;

			for ( const scene of scenes ){

				if ( ! scene[ "dataset" ][ "parallaxScene" ] ) continue;
				
				const sceneData: Array<SceneOption> = JSON.parse( scene[ "dataset" ][ "parallaxScene" ] );
				const images: Array<HTMLImageElement> = await loadImages( sceneData );
	
				/** Merge texture atlas */
				const { atlasData, canvasSize, texture } = texturePacker.pack( images );
				
				/** Init merged texture to GL */
				this.renderController.initTexture( texture );

				/** Create scene */
				const parallaxScene = new ParallaxScene( canvasSize, atlasData );

				scene[ "dataset" ][ "pid" ] = `${ this.scenes.length }`;
				this.scenes.push( parallaxScene );

			}

		} catch ( error ){

			console.error( error );

		}

	}

	/** Activate scene with given id */
	activateScene( id: number ): void | boolean {

		if ( ! this.scenes[ id ] ){

			console.warn( `Scene ${ id } is not exist.` );
			return false;

		}

		this.activeScene = id;
		this.renderController.activateScene( this.scenes[ id ] );

	}

	/** Update parallax items of active scene and update render controller */
	updateResolution(): void {

		this.scenes[ this.activeScene ].resize();
		this.renderController.updateResolution();
		this.renderController.updateScene( this.scenes[ this.activeScene ] );

		if ( ! this._running ){

			this.renderController.tick();

		}

	}

	/** Stop rendering */
	freeze(): void {

		if ( this._running ){

			window.cancelAnimationFrame( this._lastRenderRequest );
			this.pointerController.removeEvents();
			this._running = false;

		} else {

			console.warn( `Already frozen.` );
			
		}

	}

	/** Start rendering */
	start(): void {

		if ( ! this._running ){

			this._running = true;
			this.updateResolution();
			this.render();
			this.pointerController.addEvents();

		} else {

			console.warn( `Already running.` );

		}
		
	}

	/** Update pointer and render active scene */
	render(): void {

		this.pointerController.tick();
		this.renderController.setPointer( UPointer.x, UPointer.y );
		this.renderController.tick();

		this._lastRenderRequest = window.requestAnimationFrame( this.render.bind( this ) );

	}

}