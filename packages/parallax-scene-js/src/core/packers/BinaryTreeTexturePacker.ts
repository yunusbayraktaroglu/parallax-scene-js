import { BaseTexturePacker, ImageSource, PackResult, AtlasResult } from "./BaseTexturePacker";

/**
 * Represents a single rectangular node within the binary tree packing structure.
 * Each node may contain a placed image or act as a subdivision of the texture space.
 */
type ImageNode = Rectangle & {
	/**
	 * Whether this node is already occupied by an image.
	 */
	used?: boolean;
	/**
	 * Reference to the node on the right side of this one.
	 */
	right?: ImageNode | null;
	/**
	 * Reference to the node below this one.
	 */
	down?: ImageNode | null;
};

/**
 * Implements a Binary Tree–based 2D texture packing algorithm.
 * Efficient for packing a set of rectangles into a single texture without overlap.
 * 
 * @see https://jvernay.fr/en/blog/skyline-2d-packer/implementation
 * @see https://www.david-colson.com/2020/03/10/exploring-rect-packing.html
 */
export class BinaryTreeTexturePacker extends BaseTexturePacker
{
	/**
	 * Root node of the binary tree representing the packed texture space.
	 * @internal
	 */
	private _root: ImageNode | null = null;

	/**
	 * Packs a list of image sources into a single atlas using a binary tree method.
	 * 
	 * @param images - Array of images to be packed.
	 * @returns The packing result, including normalized atlas coordinates and total texture size.
	 * @throws Error if the input array is empty or packing fails for any image.
	 */
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

		this._root = { 
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
			const node = this._findNode( this._root, w, h );

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
			w: this._root.w, 
			h: this._root.h 
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
			};
		} );

		return { 
			atlas: atlasDataWithNormalized, 
			size: canvasSize 
		};
	}

	/**
	 * Searches for an available node large enough to hold the given dimensions.
	 * Iterative implementation avoids recursive stack overhead.
	 * 
	 * @param root - Root node to begin searching from.
	 * @param w - Required width.
	 * @param h - Required height.
	 * @returns The node that can fit the requested rectangle, or `null` if none found.
	 * @internal
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
	 * Marks the specified node as used and splits it into right and down child nodes.
	 * 
	 * @param node - Node to split.
	 * @param w - Width of the placed rectangle.
	 * @param h - Height of the placed rectangle.
	 * @returns The updated node with `used=true`.
	 * @internal
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
	 * Attempts to expand the root node to fit a new rectangle.
	 * Chooses to grow right or down depending on available space and proportions.
	 * 
	 * @param w - Width of the new rectangle.
	 * @param h - Height of the new rectangle.
	 * @returns A node where the rectangle fits, or `null` if growth is not possible.
	 * @internal
	 */
	private _growNode( w: number, h: number ): ImageNode | null
	{
		if ( ! this._root ) return null;

		const canGrowDown = w <= this._root.w;
		const canGrowRight = h <= this._root.h;

		// try to keep atlas roughly square
		const shouldGrowRight = canGrowRight && this._root.h >= this._root.w + w;
		const shouldGrowDown = canGrowDown && this._root.w >= this._root.h + h;

		if ( shouldGrowRight ) return this._growRight( w, h );
		if ( shouldGrowDown ) return this._growDown( w, h );
		if ( canGrowRight ) return this._growRight( w, h );
		if ( canGrowDown ) return this._growDown( w, h );

		return null;
	}

	/**
	 * Expands the atlas horizontally to accommodate a new rectangle.
	 * 
	 * @param w - Width of the new rectangle.
	 * @param h - Height of the new rectangle.
	 * @returns The node where the new rectangle was placed, or `null` if placement failed.
	 * @internal
	 */
	private _growRight( w: number, h: number ): ImageNode | null
	{
		if ( ! this._root ) return null;

		const oldRoot = this._root;

		this._root = {
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
		const node = this._findNode( this._root, w, h );
		return node ? this._splitNode( node, w, h ) : null;
	}

	/**
	 * Expands the atlas vertically to accommodate a new rectangle.
	 * 
	 * @param w - Width of the new rectangle.
	 * @param h - Height of the new rectangle.
	 * @returns The node where the new rectangle was placed, or `null` if placement failed.
	 * @internal
	 */
	private _growDown( w: number, h: number ): ImageNode | null
	{
		if ( ! this._root ) return null;

		const oldRoot = this._root;
		
		this._root = {
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

		const node = this._findNode( this._root, w, h );
		return node ? this._splitNode( node, w, h ) : null;
	}
}