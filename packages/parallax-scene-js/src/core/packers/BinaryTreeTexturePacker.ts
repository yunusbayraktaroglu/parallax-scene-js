import { BaseTexturePacker, ImageSource, PackResult, AtlasResult } from "./BaseTexturePacker";

type ImageNode = Rectangle & {
	used?: boolean;
	right?: ImageNode | null;
	down?: ImageNode | null;
};

/**
 * Binary Tree 2D Texture packer algorithm
 * 
 * @see https://jvernay.fr/en/blog/skyline-2d-packer/implementation
 * @see https://www.david-colson.com/2020/03/10/exploring-rect-packing.html
 */
export class BinaryTreeTexturePacker extends BaseTexturePacker
{
	private root: ImageNode | null = null;

	pack( images: ImageSource[] ): PackResult
	{
		if ( ! Array.isArray( images ) || images.length === 0 ){
			throw new Error( 'TexturePacker.pack: images array must not be empty' );
		}

		// Copy and sort by descending area. 
		// Larger images first reduces wasted space and growth operations.
		const items = [ ...images ].sort( ( a, b ) => {
			return b.source.width * b.source.height - a.source.width * a.source.height;
		} );

		// initialize root with the first (largest) image size
		const first = items[ 0 ].source;

		this.root = { 
			x: 0, 
			y: 0, 
			w: first.width, 
			h: first.height, 
			used: false, 
			right: null, 
			down: null 
		};

		// store fit info alongside items
		const fits: ( ImageNode | null )[] = new Array( items.length ).fill( null );

		for ( let i = 0; i < items.length; i++ ){

			const bmp = items[ i ].source;
			const w = bmp.width;
			const h = bmp.height;

			// find a node that fits
			const node = this._findNode( this.root, w, h );

			if ( node ){
				fits[ i ] = this._splitNode( node, w, h );
			} else {
				fits[ i ] = this._growNode( w, h );
			}

			if ( ! fits[ i ] ){
				throw new Error( `Texture packing failed for image at index ${ i } (${ items[ i ].id }).` );
			}
		}

		// build atlas entries in original order of 'items' (which are sorted)
		const atlasData: AtlasResult[] = items.map( ( it, idx ) => {

			const f = fits[ idx ]!; // validated above

			return {
				id: it.id,
				source: it.source,
				x: f.x,
				y: f.y,
				w: it.source.width,
				h: it.source.height,
			};

		} );

		const canvasSize = { 
			w: this.root.w, 
			h: this.root.h 
		};

		// Will be used in WebGL, normalization required
		const atlasDataWithNormalized = atlasData.map( layer => {
			return {
				...layer,
				normalized: {
					x: layer.x / canvasSize.w,
					y: layer.y / canvasSize.h,
					w: layer.w / canvasSize.w,
					h: layer.h / canvasSize.h,
				}
			}
		} );

		return { 
			atlas: atlasDataWithNormalized, 
			size: canvasSize 
		};
	}

	/**
	* Iterative search for a free node that can fit the requested size.
	* Avoids recursive calls to reduce call overhead.
	*/
	private _findNode( root: ImageNode | null, w: number, h: number ): ImageNode | null
	{
		if ( !root ) return null;

		const stack: ( ImageNode | null )[] = [ root ];

		while ( stack.length ){
			
			const node = stack.pop();
			
			if ( ! node ) continue;

			if ( node.used ){
				// push right then down so down is checked first (mirrors original recursive order right then down)
				if ( node.right ) stack.push( node.right );
				if ( node.down ) stack.push( node.down );
				continue;
			}

			if ( w <= node.w && h <= node.h ){
				return node;
			}
		}

		return null;
	}

	/**
	* Reserve space inside a node and create right/down children according to original algorithm.
	* Returns the node that describes the placed rectangle (with used=true).
	*/
	private _splitNode( node: ImageNode, w: number, h: number ): ImageNode
	{
		node.used = true;

		// create down node below the placed image
		node.down = {
			x: node.x,
			y: node.y + h,
			w: node.w,
			h: node.h - h,
			used: false,
			right: null,
			down: null,
		};

		// create right node to the right of the placed image
		// preserve original algorithm behaviour where right.h equals placed height
		node.right = {
			x: node.x + w,
			y: node.y,
			w: node.w - w,
			h: h,
			used: false,
			right: null,
			down: null,
		};

		return node;
	}

	/**
	* Try to grow the root either right or down to make room for w x h.
	*/
	private _growNode( w: number, h: number ): ImageNode | null
	{
		if ( !this.root ) return null;

		const canGrowDown = w <= this.root.w;
		const canGrowRight = h <= this.root.h;

		// try to keep atlas roughly square
		const shouldGrowRight = canGrowRight && this.root.h >= this.root.w + w;
		const shouldGrowDown = canGrowDown && this.root.w >= this.root.h + h;

		if ( shouldGrowRight ) return this._growRight( w, h );
		if ( shouldGrowDown ) return this._growDown( w, h );
		if ( canGrowRight ) return this._growRight( w, h );
		if ( canGrowDown ) return this._growDown( w, h );

		return null;
	}

	/**
	 * 
	 * @param w 
	 * @param h 
	 * @returns 
	 */
	private _growRight( w: number, h: number ): ImageNode | null
	{
		if ( ! this.root ) return null;

		const oldRoot = this.root;

		this.root = {
			used: true,
			x: 0,
			y: 0,
			w: oldRoot.w + w,
			h: oldRoot.h,
			down: oldRoot,
			right: {
				x: oldRoot.w,
				y: 0,
				w: w,
				h: oldRoot.h,
				used: false,
				right: null,
				down: null,
			},
		};

		// find node in the new root that fits
		const node = this._findNode( this.root, w, h );
		return node ? this._splitNode( node, w, h ) : null;
	}

	/**
	 * 
	 * @param w 
	 * @param h 
	 * @returns 
	 */
	private _growDown( w: number, h: number ): ImageNode | null
	{
		if ( ! this.root ) return null;

		const oldRoot = this.root;
		
		this.root = {
			used: true,
			x: 0,
			y: 0,
			w: oldRoot.w,
			h: oldRoot.h + h,
			down: {
				x: 0,
				y: oldRoot.h,
				w: oldRoot.w,
				h: h,
				used: false,
				right: null,
				down: null,
			},
			right: oldRoot,
		};

		const node = this._findNode( this.root, w, h );
		return node ? this._splitNode( node, w, h ) : null;
	}
}