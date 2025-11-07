import { BaseTexturePacker, ImageSource, PackResult, AtlasResult } from "./BaseTexturePacker";

/**
 * Represents a point (vertex) in the skyline.
 * Each node defines the start of a horizontal segment of the skyline.
 */
type SkylineNode = {
	x: number;
	y: number;
};

/**
 * Skyline 2D Texture packer algorithm
 * 
 * @see https://jvernay.fr/en/blog/skyline-2d-packer/implementation
 * @see https://www.david-colson.com/2020/03/10/exploring-rect-packing.html
 */
export class SkylineTexturePacker extends BaseTexturePacker
{
	private binWidth: number;
	private binHeight: number;
	private skyline: SkylineNode[] = [ { x: 0, y: 0 } ];

	constructor( maxTextureSize: number, binWidth: number, binHeight: number )
	{
		super( maxTextureSize );
		this.binWidth = binWidth;
		this.binHeight = binHeight;
	}

	pack( images: ImageSource[] ): PackResult
	{
		const maxBinWidth = this._maxTextureSize
		const maxBinHeight = this._maxTextureSize;

		const packedResults: AtlasResult[] = [];
		
		// Copy and sort by descending area. 
		// Larger images first reduces wasted space and growth operations.
		const sortedImages = [ ...images ].sort( ( a, b ) => b.source.width - a.source.width );

		const itemsToProcess = [ ...sortedImages ];

		while ( itemsToProcess.length > 0 ){

			const item = itemsToProcess.shift(); // Get the next item

			if ( ! item ) break;

			const result = this.add( item );

			if ( result ){

				// --- 1. Success ---
				packedResults.push( result );

			} else {

				// --- 2. Failure: Need to grow ---

				// Put the item back at the front of the queue to retry
				itemsToProcess.unshift( item );

				const currentWidth = this.binWidth;
				const currentHeight = this.binHeight;

				// Check if the item is larger than the absolute max dimensions
				if ( item.source.width > maxBinWidth || item.source.height > maxBinHeight ){
					console.error( `Item ${ item.id } (${ item.source.width }x${ item.source.height }) is larger than max dimensions (${ maxBinWidth }x${ maxBinHeight }) and will be skipped.` );
					itemsToProcess.shift(); // Remove it for good
					continue;
				}

				let newWidth = currentWidth;
				let newHeight = currentHeight;

				// Growth Heuristic:
				// Try to double the shorter side.
				// Always ensure the new size is at least as big as the item that failed.

				if ( currentWidth <= currentHeight ){
					// Try doubling width
					newWidth = Math.max( currentWidth * 2, item.source.width );
				}
				else {
					// Try doubling height
					newHeight = Math.max( currentHeight * 2, item.source.height );
				}

				// Cap at max dimensions
				newWidth = Math.min( newWidth, maxBinWidth );
				newHeight = Math.min( newHeight, maxBinHeight );

				// If this growth is still not enough for the item,
				// we must grow the other dimension too.
				if ( newWidth < item.source.width ){
					newWidth = Math.min( Math.max( currentWidth * 2, item.source.width ), maxBinWidth );
				}
				if ( newHeight < item.source.height ){
					newHeight = Math.min( Math.max( currentHeight * 2, item.source.height ), maxBinHeight );
				}

				// Final check: Did we fail to grow?
				// (This happens if we're at max size and the item still doesn't fit)
				if ( newWidth === currentWidth && newHeight === currentHeight ){
					console.error( `Bin is at max size (${ maxBinWidth }x${ maxBinHeight }) but item ${ item.id } still won't fit. Skipping this and all remaining items.` );
					break; // Exit the while loop
				}

				// Perform the grow operation
				this.grow( newWidth, newHeight );

				// The loop will now retry adding `item` with the new bin size.
			}
		} // end while

		// Will be used in WebGL, normalization required
		const atlasDataWithNormalized = packedResults.map( layer => {
			return {
				...layer,
				normalized: {
					x: layer.x / this.binWidth,
					y: layer.y / this.binHeight,
					w: layer.w / this.binWidth,
					h: layer.h / this.binHeight,
				}
			}
		} );

		return {
			atlas: atlasDataWithNormalized,
			size: { w: this.binWidth, h: this.binHeight }
		};
	}

	/**
	 * Grows the bin to accommodate new dimensions.
	 * @param newWidth The new width. Must be >= current width.
	 * @param newHeight The new height. Must be >= current height.
	 */
	public grow( newWidth: number, newHeight: number ): void
	{
		if ( newWidth < this.binWidth || newHeight < this.binHeight ){
			console.warn( "Cannot grow bin to a smaller size." );
			return;
		}

		// --- Grow Width Logic ---
		if ( newWidth > this.binWidth ){
			const lastNode = this.skyline[ this.skyline.length - 1 ];

			// If the last segment of the skyline is not at y=0,
			// we must add a new node at the old width boundary
			// to drop the skyline back to 0 for the new empty space.
			if ( lastNode.y > 0 ){
				this.skyline.push( { x: this.binWidth, y: 0 } );
			}
			this.binWidth = newWidth;
		}

		// --- Grow Height Logic ---
		// Growing height is simple, just update the property.
		// The vertical fit check in `add()` will use the new height.
		if ( newHeight > this.binHeight ){
			this.binHeight = newHeight;
		}
	}

	/**
	 * Tries to add a new rectangle (from an InputItem) to the atlas.
	 *
	 * @param item The item to pack.
	 * @returns A PackedItem with coordinates if successful, or null if it fails.
	 */
	public add( item: ImageSource ): AtlasResult | null
	{
		const width = item.source.width;
		const height = item.source.height;

		// --- 1. Sanity checks ---
		if ( width === 0 || height === 0 ){
			console.warn( `Skipping zero-area item: ${ item.id }` );
			return null;
		}
		// Check if it can *ever* fit, even in an empty bin
		if ( width > this.binWidth || height > this.binHeight ){
			return null; // Fails, will trigger a grow in the main function
		}

		// --- 2. Find the best insertion spot (lowest 'y') ---
		let bestNodeIndex = -1;
		let bestNodeIndex2 = -1; // Exclusive end index of overlapped nodes
		let bestX = 0;
		let bestY = Infinity;

		for ( let i = 0; i < this.skyline.length; i++ ){
			const node = this.skyline[ i ];
			const x = node.x;
			let y = node.y;

			if ( x + width > this.binWidth ){
				continue;
			}

			let currentY = y;
			let endNodeIndex = i + 1;

			for ( endNodeIndex = i + 1; endNodeIndex < this.skyline.length; endNodeIndex++ ){
				const nextNode = this.skyline[ endNodeIndex ];
				if ( nextNode.x >= x + width ){
					break;
				}
				if ( nextNode.y > currentY ){
					currentY = nextNode.y;
				}
			}

			y = currentY;

			if ( y >= bestY ){
				continue;
			}

			if ( y + height > this.binHeight ){
				continue;
			}

			bestY = y;
			bestX = x;
			bestNodeIndex = i;
			bestNodeIndex2 = endNodeIndex;
		}

		// --- 3. Check if a spot was found ---
		if ( bestNodeIndex === -1 ){
			return null; // No suitable spot found, will trigger a grow
		}

		// --- 4. Update the skyline data structure ---
		const newTL: SkylineNode = {
			x: bestX,
			y: bestY + height,
		};
		const nodesToAdd: SkylineNode[] = [ newTL ];

		const lastOverlappedNode = this.skyline[ bestNodeIndex2 - 1 ];
		const lastOverlappedNodeY = lastOverlappedNode.y;
		const newBRX = bestX + width;

		const addBottomRight =
			( bestNodeIndex2 < this.skyline.length )
				? ( newBRX < this.skyline[ bestNodeIndex2 ].x )
				: ( newBRX < this.binWidth );

		if ( addBottomRight ){
			nodesToAdd.push( { x: newBRX, y: lastOverlappedNodeY } );
		}

		const removedCount = bestNodeIndex2 - bestNodeIndex;
		this.skyline.splice( bestNodeIndex, removedCount, ...nodesToAdd );

		// --- 5. Merge redundant nodes ---
		this.mergeSkyline();

		// --- 6. Return the packed item ---
		const packedItem: AtlasResult = {
			...item,
			x: bestX,
			y: bestY,
			w: item.source.width,
			h: item.source.height,
		};

		return packedItem;
	}

	/**
	 * Merges adjacent skyline nodes that are at the same 'y' level.
	 */
	private mergeSkyline(): void
	{
		for ( let i = 0; i < this.skyline.length - 1; i++ ){
			const node1 = this.skyline[ i ];
			const node2 = this.skyline[ i + 1 ];

			if ( node1.y === node2.y ){
				this.skyline.splice( i + 1, 1 );
				i--;
			}
		}
	}	
}