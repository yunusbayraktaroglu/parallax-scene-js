import { Vector2 } from '../math/Vector2';
import { Matrix3 } from '../math/Matrix3';

const _vector2 = new Vector2();

export class BufferAttribute implements IBufferAttribute {

	name = '';
    array: TypedArray;
    itemSize: number;
    count: number;

	constructor( array: TypedArray, itemSize: number ){

		this.array = array;
		this.itemSize = itemSize;
		this.count = array !== undefined ? array.length / itemSize : 0;

	}

	applyPos( m: Matrix3 ){

		for ( let i = 0, l = this.count; i < l; i ++ ){

			_vector2.fromBufferAttribute( this, i );
			_vector2.applyMatrix3( m );

			this.setXY( i, _vector2.x, _vector2.y );

		}
	}

	set( value: TypedArray | Array<number>, offset = 0 ){

		this.array.set( value, offset );
		return this;

	}

	getX( index: number ){

		return this.array[ index * this.itemSize ];

	}

	setX( index: number, x: number ){

		this.array[ index * this.itemSize ] = x;
		return this;

	}

	getY( index: number ){

		return this.array[ index * this.itemSize + 1 ];

	}

	setY( index: number, y: number ){

		this.array[ index * this.itemSize + 1 ] = y;
		return this;

	}

	getZ( index: number ){

		return this.array[ index * this.itemSize + 2 ];

	}

	setZ( index: number, z: number ){

		this.array[ index * this.itemSize + 2 ] = z;
		return this;

	}

	getW( index: number ){

		return this.array[ index * this.itemSize + 3 ];

	}

	setW( index: number, w: number ){

		this.array[ index * this.itemSize + 3 ] = w;
		return this;

	}

	setXY( index: number, x: number, y: number ){

		index *= this.itemSize;

		this.array[ index + 0 ] = x;
		this.array[ index + 1 ] = y;

		return this;

	}

	setXYZ( index: number, x: number, y: number, z: number ){

		index *= this.itemSize;

		this.array[ index + 0 ] = x;
		this.array[ index + 1 ] = y;
		this.array[ index + 2 ] = z;

		return this;

	}

	setXYZW( index: number, x: number, y: number, z: number, w: number ){

		index *= this.itemSize;

		this.array[ index + 0 ] = x;
		this.array[ index + 1 ] = y;
		this.array[ index + 2 ] = z;
		this.array[ index + 3 ] = w;

		return this;

	}
}




class Int8BufferAttribute extends BufferAttribute {

	constructor( array: Array<number>, itemSize: number ){

		super( new Int8Array( array ), itemSize );

	}

}

class Uint8BufferAttribute extends BufferAttribute {

	constructor( array: Array<number>, itemSize: number ){

		super( new Uint8Array( array ), itemSize );

	}

}

class Uint8ClampedBufferAttribute extends BufferAttribute {

	constructor( array: Array<number>, itemSize: number ){

		super( new Uint8ClampedArray( array ), itemSize );

	}

}

class Int16BufferAttribute extends BufferAttribute {

	constructor( array: Array<number>, itemSize: number ){

		super( new Int16Array( array ), itemSize );

	}

}

class Uint16BufferAttribute extends BufferAttribute {

	constructor( array: Array<number>, itemSize: number ){

		super( new Uint16Array( array ), itemSize );

	}

}

class Int32BufferAttribute extends BufferAttribute {

	constructor( array: Array<number>, itemSize: number ){

		super( new Int32Array( array ), itemSize );

	}

}

class Uint32BufferAttribute extends BufferAttribute {

	constructor( array: Array<number>, itemSize: number ){

		super( new Uint32Array( array ), itemSize );

	}

}




class Float32BufferAttribute extends BufferAttribute {

	constructor( array: Array<number>, itemSize: number ){

		super( new Float32Array( array ), itemSize );

	}

}



class Float64BufferAttribute extends BufferAttribute {

	constructor( array: Array<number>, itemSize: number ){

		super( new Float64Array( array ), itemSize );

	}

}




export {
	Float64BufferAttribute,
	Float32BufferAttribute,
	Uint32BufferAttribute,
	Int32BufferAttribute,
	Uint16BufferAttribute,
	Int16BufferAttribute,
	Uint8ClampedBufferAttribute,
	Uint8BufferAttribute,
	Int8BufferAttribute,
};