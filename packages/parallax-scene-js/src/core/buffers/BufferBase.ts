export abstract class BufferBase 
{
	abstract array: TypedArray;

	/**
	 * Invidual method to getting index.
	 * (Interleaved, Standard, Instanced)
	 * 
	 * @param index 
	 */
	abstract _getIndex( index: number ): number;

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