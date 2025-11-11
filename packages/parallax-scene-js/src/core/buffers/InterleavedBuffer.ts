import { Usage, StaticDrawUsage } from "./constants";

/**
 * "Interleaved" means that multiple attributes, possibly of different types,
 * (e.g., position, normal, uv, color) are packed into a single array buffer.
 *
 * An introduction into interleaved arrays can be found here: 
 * {@link https://blog.tojicode.com/2011/05/interleaved-array-basics.html | Interleaved array basics}
 */
export class InterleavedBuffer 
{
	/**
	 * A version number, incremented every time the `needsUpdate` is set to `true`.
	 */
	version: number = 0;

	/**
	 * A typed array with a shared buffer storing attribute data.
	 */
    array: TypedArray;

	/**
	 * The total number of elements in the array
	 */
    readonly count: number;

	/**
	 * The number of typed-array elements per vertex.
	 */
	stride: number;

	/**
	 * Defines the intended usage pattern of the data store for optimization purposes.
	 *
	 * Note: After the initial use of a buffer, its usage cannot be changed. Instead,
	 * instantiate a new one and set the desired usage before the next render.
	 */
	usage: Usage = StaticDrawUsage;

	/**
	 * This can be used to only update some components of stored vectors (for example, just the
	 * component related to color). Use the `addUpdateRange()` function to add ranges to this array.
	 */
	updateRanges: {
        /**
         * Position at which to start update.
         */
        start: number;
        /**
         * The number of components to update.
         */
        count: number;
    }[] = [];

	/**
	 * Constructs a new interleaved buffer.
	 *
	 * @param array - A typed array with a shared buffer storing attribute data.
	 * @param stride - The number of typed-array elements per vertex.
	 */
	constructor( array: TypedArray, stride: number )
	{
		this.array = array;
		this.stride = stride;
		this.count = array !== undefined ? array.length / stride : 0;
	}

	/**
	 * Clears the update ranges.
	 */
	clearUpdateRanges()
	{
		this.updateRanges.length = 0;
	}

	/**
	 * A callback function that is executed after the renderer has transferred the attribute array
	 * data to the GPU.
	 */
	onUploadCallback(){}

	/**
	 * Sets the given array data in the interleaved buffer.
	 *
	 * @param value - The array data to set.
	 * @param [offset=0] - The offset in this interleaved buffer's array.
	 * @return A reference to this instance.
	 */
	set( value: TypedArray, offset = 0 ): this
	{
		this.array.set( value, offset );
		return this;
	}
}