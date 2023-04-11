
type ImagesData = Array<{
	source: HTMLImageElement;
	fit: ImageFit | null;
}>

type ImageFit = Resolution4 & {
	down?: Resolution4 | ImageFit;
	right?: Resolution4 | ImageFit;
	used?: boolean;
}

type AtlasData = Resolution4 & {
	source: HTMLImageElement;
}

type PackData = {
	atlasData: Array<ParallaxItemOptions>;
	canvasSize: Resolution2;
	texture: HTMLCanvasElement;
}


export class TexturePacker {

	root!: ImageFit;
	maxTextureSize!: number;

	/**
	 * Calculate size of packed atlas & draw into given images
	 */
	pack( images: Array<HTMLImageElement> ): PackData {

		const imagesData: ImagesData = images.map( image => ( { source: image, fit: null } ) );

		this.root = { 
			x: 0, 
			y: 0, 
			w: imagesData[0].source.width, 
			h: imagesData[0].source.height, 
			used: false 
		};

		/**
		 * Analyze how to pack
		 */
		let node;

		for ( let n = 0; n < imagesData.length; n++ ){

			const imageData = imagesData[ n ];
			const { width, height } = imageData.source;

			node = this.findNode( this.root, width, height );

			if ( node ){

				imageData.fit = this.splitNode( node, width, height );

			} else {

				imageData.fit = this.growNode( node, width, height );

			}
		}

		if ( imagesData.some( imageData => ! imageData.fit ) ){
			throw new Error( `Texture packing: Failed to fit images.` );
		}
		
		/**
		 * Draw into new canvas if successfully packed
		 */
		const atlasData = imagesData.map( imageData => {

			const { width, height } = imageData.source;
			
			return {
				source: imageData.source,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore - fit control already made
				x: imageData.fit.x,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore - fit control already made
				y: imageData.fit.y,
				w: width,
				h: height,
				ratio: width / height
			};

		} );
		
		const canvasSize = { w: this.root.w, h: this.root.h };
		const packedTexture = this.createPackedTexture( canvasSize, atlasData );

		/**
		 * Split source and revoke blob url
		 */
		const finalAtlas = atlasData.map( imageData => {

			const { source, ...atlas } = imageData;

			// Revoke blob url
			URL.revokeObjectURL( source.src );

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore - parallaxData defined in imageLoader
			const pieceData: SceneOption = JSON.parse( source.dataset.parallaxData ); 

			return { ...pieceData, atlas: atlas };

		} );

		return {
			atlasData: finalAtlas,
			canvasSize: canvasSize,
			texture: packedTexture,
		};
	}

	/**
	 * Draw bunch of images into new canvas
	 */
	createPackedTexture( canvasSize: Resolution2, atlasData: Array<AtlasData> ): HTMLCanvasElement {

		const canvas = document.createElement( "canvas" );
		const context = canvas.getContext( "2d", { alpha: true } );

		if ( ! context ){
			throw new Error( `Context can't get while texture packing.` );
		}
		
		canvas.width = canvasSize.w;
		canvas.height = canvasSize.h;

		for ( const atlas of atlasData ){
			context.drawImage( atlas.source, atlas.x, atlas.y, atlas.w, atlas.h );
		}

		/** 
		 * Check if packed texture bigger than GL max texture size
		 * No need to reassign atlas data since scaling with ratio 
		 */
		const maxSize = Math.max( canvasSize.w, canvasSize.h );

		if ( this.maxTextureSize < maxSize ){

			const canvas2 = document.createElement( "canvas" );
			const context2 = canvas2.getContext( "2d", { alpha: true } )!;
			const ratio = this.maxTextureSize / maxSize;

			canvas2.width = canvasSize.w * ratio;
			canvas2.height = canvasSize.h * ratio;
			context2.drawImage( canvas, 0, 0, canvas2.width, canvas2.height );

			return context2.canvas;

		}

		return context.canvas;
	}

	findNode( root: ImageFit | undefined, w: number, h: number ): ImageFit | null {
		
		if ( root && root.used ){

			return this.findNode( root.right, w, h ) || this.findNode( root.down, w, h );

		} else if ( root && w <= root.w && h <= root.h ){

			return root;

		} else {

			return null;
			
		}
	}

	splitNode( node: ImageFit, w: number, h: number ): ImageFit | null {

		node.used = true;

		node.down  = { 
			x: node.x, 
			y: node.y + h, 
			w: node.w, 
			h: node.h - h 
		};

		node.right = { 
			x: node.x + w, 
			y: node.y, 
			w: node.w - w, 
			h: h
		};

		return node;
	}

	growNode( node: ImageFit | null, w: number, h: number ): ImageFit | null {

		const canGrowDown  = ( w <= this.root.w );
		const canGrowRight = ( h <= this.root.h );
	
		// attempt to keep square-ish by growing right or down
		const shouldGrowRight = canGrowRight && ( this.root.h >= ( this.root.w + w ) );
		const shouldGrowDown  = canGrowDown  && ( this.root.w >= ( this.root.h + h ) );
	
		if ( shouldGrowRight )
			return this.growRight( node, w, h );
		else if ( shouldGrowDown )
			return this.growDown( node, w, h );
		else if ( canGrowRight )
			return this.growRight( node, w, h );
		else if ( canGrowDown )
			return this.growDown( node, w, h );
		else
			return null; // need to ensure sensible root starting size to avoid this happening
	}

	growRight( node: ImageFit | null, w: number, h: number ): ImageFit | null {

		this.root = {
			used: true,
			x: 0,
			y: 0,
			w: this.root.w + w,
			h: this.root.h,
			down: this.root,
			right: { x: this.root.w, y: 0, w: w, h: this.root.h }
		};

		node = this.findNode( this.root, w, h );

		if ( node ){

			return this.splitNode( node, w, h );

		} else {

			return null;
		}
	}

	growDown( node: ImageFit | null, w: number, h: number ): ImageFit | null {

		this.root = {
			used: true,
			x: 0,
			y: 0,
			w: this.root.w,
			h: this.root.h + h,
			down: { x: 0, y: this.root.h, w: this.root.w, h: h },
			right: this.root
		};

		node = this.findNode( this.root, w, h );

		if ( node ){

			return this.splitNode( node, w, h );

		} else {

			return null;
		}
	}

}