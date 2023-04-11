import { Matrix3 } from "./Matrix3";
import { BufferAttribute } from "../buffers/BufferAttribute";

export class Vector2 {

	x: number;
	y: number;

	constructor( x = 0, y = 0 ) {

		this.x = x;
		this.y = y;

	}

	set( x: number, y: number ): this {

		this.x = x;
		this.y = y;

		return this;

	}

	setX( x: number ): this {

		this.x = x;

		return this;

	}

	setY( y: number ): this {

		this.y = y;

		return this;

	}

	copy( v: Vector2 ): this {

		this.x = v.x;
		this.y = v.y;

		return this;

	}

	add( v: Vector2 ): this {

		this.x += v.x;
		this.y += v.y;

		return this;

	}

	addScalar( s: number ): this {

		this.x += s;
		this.y += s;

		return this;

	}

	addVectors( a: Vector2, b: Vector2 ): this {

		this.x = a.x + b.x;
		this.y = a.y + b.y;

		return this;

	}

	subVectors( a: Vector2, b: Vector2 ): this {

		this.x = a.x - b.x;
		this.y = a.y - b.y;

		return this;

	}

	multiply( v: Vector2 ): this {

		this.x *= v.x;
		this.y *= v.y;

		return this;

	}

	multiplyScalar( scalar: number ): this {

		this.x *= scalar;
		this.y *= scalar;

		return this;

	}

	applyMatrix3( m: Matrix3 ): this {

		const x = this.x, y = this.y;
		const e = m.elements;

		this.x = e[ 0 ] * x + e[ 3 ] * y + e[ 6 ];
		this.y = e[ 1 ] * x + e[ 4 ] * y + e[ 7 ];

		return this;

	}

	clampScalar( minVal: number, maxVal: number ): this {

		this.x = Math.max( minVal, Math.min( maxVal, this.x ) );
		this.y = Math.max( minVal, Math.min( maxVal, this.y ) );

		return this;

	}

	lengthSq(): number {

		return this.x * this.x + this.y * this.y;

	}

	length(): number {

		return Math.sqrt( this.x * this.x + this.y * this.y );

	}

	fromBufferAttribute( attribute: BufferAttribute, index: number ): this {

		this.x = attribute.getX( index );
		this.y = attribute.getY( index );

		return this;

	}

	*[ Symbol.iterator ](){

		yield this.x;
		yield this.y;

	}

}
