export abstract class BufferBase 
{
	/**
     * The holding data stored in the buffer.
     */
	abstract array: TypedArray;

	/**
	 * Invidual method to getting index.
	 * (Interleaved, Standard, Instanced)
	 * 
	 * @param index 
	 */
	abstract _getIndex( index: number ): number;

	/**
	 * The name of the buffer attribute.
	 * @defaultValue ''
	 */
	name: string = '';

	/**
     * The length of vectors that are being stored in the {@link BufferAttribute.array | array}.
     * @remarks Expects a `Integer`
     */
    itemSize: number;

	/**
	 * Applies to integer data only. Indicates how the underlying data in the buffer maps to
	 * the values in the GLSL code. For instance, if `array` is an instance of `UInt16Array`,
	 * and `normalized` is `true`, the values `0 - +65535` in the array data will be mapped to
	 * `0.0f - +1.0f` in the GLSL attribute. If `normalized` is `false`, the values will be converted
	 * to floats unmodified, i.e. `65535` becomes `65535.0f`.
	 * 
	 * @default false
	 */
    normalized: boolean = false;

	constructor( itemSize: number )
	{
		this.itemSize = itemSize;
	}

	getX( index: number )
	{
		const _index = this._getIndex( index );
		return this.array[ _index ];
	}

	setX( index: number, x: number )
	{
		const _index = this._getIndex( index );
		this.array[ _index ] = x;

		return this;
	}

	getY( index: number )
	{
		const _index = this._getIndex( index ) + 1;
		return this.array[ _index ];
	}

	setY( index: number, y: number )
	{
		const _index = this._getIndex( index ) + 1;
		this.array[ _index ] = y;

		return this;
	}

	getZ( index: number )
	{
		const _index = this._getIndex( index ) + 2;
		return this.array[ _index ];
	}

	setZ( index: number, z: number )
	{
		const _index = this._getIndex( index ) + 2;
		this.array[ _index ] = z;

		return this;
	}

	getW( index: number )
	{
		const _index = this._getIndex( index ) + 3;
		return this.array[ _index ];
	}

	setW( index: number, w: number )
	{
		const _index = this._getIndex( index ) + 3;
		this.array[ _index ] = w;

		return this;
	}

	setXY( index: number, x: number, y: number )
	{
		const _index = this._getIndex( index );

		this.array[ _index + 0 ] = x;
		this.array[ _index + 1 ] = y;

		return this;
	}

	setXYZ( index: number, x: number, y: number, z: number )
	{
		const _index = this._getIndex( index );

		this.array[ _index + 0 ] = x;
		this.array[ _index + 1 ] = y;
		this.array[ _index + 2 ] = z;

		return this;
	}

	setXYZW( index: number, x: number, y: number, z: number, w: number )
	{
		const _index = this._getIndex( index );

		this.array[ _index + 0 ] = x;
		this.array[ _index + 1 ] = y;
		this.array[ _index + 2 ] = z;
		this.array[ _index + 3 ] = w;

		return this;
	}
}