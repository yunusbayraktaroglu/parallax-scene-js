import { InterleavedBuffer } from "./InterleavedBuffer";
import { BufferBase } from "./BufferBase";

/**
 * An alternative version of a buffer attribute with interleaved data. Interleaved
 * attributes share a common interleaved data storage ({@link InterleavedBuffer}) and refer with
 * different offsets into the buffer.
 */
export class InterleavedBufferAttribute extends BufferBase
{
	/**
	 * The buffer holding the interleaved data.
	 */
	data: InterleavedBuffer;

	/**
	 * The attribute offset into the buffer.
	 */
	offset: number;

	get array()
	{
		return this.data.array;
	}
	
	get count()
	{
		return this.data.count;
	}

	/**
	 * Constructs a new interleaved buffer attribute.
	 *
	 * @param interleavedBuffer - The buffer holding the interleaved data.
	 * @param itemSize - The item size.
	 * @param offset - The attribute offset into the buffer.
	 * @param [normalized=false] - Whether the data are normalized or not.
	 */
	constructor( interleavedBuffer: InterleavedBuffer, itemSize: number, offset: number, normalized = false )
	{
		super( itemSize );

		this.data = interleavedBuffer;
		this.offset = offset;
		this.normalized = normalized;
	}

	/**
	 * Interleaved data index getter
	 * @abstract
	 * 
	 * @param index 
	 * @returns corrected index
	 * @internal
	 */
	_getIndex( index: number ): number
	{
		return index * this.data.stride + this.offset;
	}
}