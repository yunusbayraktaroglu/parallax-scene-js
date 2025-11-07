import { Vector2 } from '../math/Vector2';
import { Matrix3 } from '../math/Matrix3';

import { type Usage, type AttributeGPUType, StaticDrawUsage, FloatType } from './constants';
import { BufferBase } from "./BufferBase";

const _vector2 = new Vector2();

let _id = 0;

/**
 * This class stores data for an attribute (such as vertex positions, face
 * indices, normals, colors, UVs, and any custom attributes ) associated with
 * a geometry, which allows for more efficient passing of data to the GPU.
 *
 * When working with vector-like data, the `fromBufferAttribute( attribute, index )`
 * helper methods on vector and color class might be helpful. E.g. {@link Vector3#fromBufferAttribute}.
 */
export class BufferAttribute extends BufferBase
{
	/**
     * Unique number for this attribute instance.
     */
	readonly id: number;

	 /**
     * Read-only flag to check if a given object is of type {@link BufferAttribute}.
	 * 
     * @remarks This is a _constant_ value
     * @defaultValue `true`
     */
	readonly isBufferAttribute = true;

	/**
     * Represents the number of items this buffer attribute stores. It is internally computed by dividing the
     * {@link BufferAttribute.array | array}'s length by the {@link BufferAttribute.itemSize | itemSize}.
     */
    readonly count: number;

	/**
	 * Applies to integer data only. Indicates how the underlying data in the buffer maps to
	 * the values in the GLSL code. For instance, if `array` is an instance of `UInt16Array`,
	 * and `normalized` is `true`, the values `0 - +65535` in the array data will be mapped to
	 * `0.0f - +1.0f` in the GLSL attribute. If `normalized` is `false`, the values will be converted
	 * to floats unmodified, i.e. `65535` becomes `65535.0f`.
	 */
    normalized: boolean;

	/**
	 * A version number, incremented every time the `needsUpdate` is set to `true`.
	 */
    version: number = 0;

	/**
     * Optional name for this attribute instance.
     * @defaultValue ''
     */
	name: string = '';

    /**
     * The holding data stored in the buffer.
     */
    array: TypedArray;

	/**
     * The length of vectors that are being stored in the {@link BufferAttribute.array | array}.
     * @remarks Expects a `Integer`
     */
    itemSize: number;

	/**
	 * Defines the intended usage pattern of the data store for optimization purposes.
	 *
	 * Note: After the initial use of a buffer, its usage cannot be changed. Instead,
	 * instantiate a new one and set the desired usage before the next render.
	 *
	 * @default StaticDrawUsage
	 */
    usage: Usage = StaticDrawUsage;

	/**
	 * Configures the bound GPU type for use in shaders.
	 *
	 * Note: this only has an effect for integer arrays and is not configurable for float arrays.
	 * For lower precision float types, use `Float16BufferAttribute`.
	 *
	 * @default FloatType
	 */
    gpuType: AttributeGPUType = FloatType;

	/**
	 * This can be used to only update some components of stored vectors (for example, just the
	 * component related to color). Use the `addUpdateRange()` function to add ranges to this array.
	 * 
	 * @default Array[]
	 */
    updateRanges: Array<{
        /**
         * Position at which to start update.
         */
        start: number;
        /**
         * The number of components to update.
         */
        count: number;
    }> = [];

	/**
	 * Constructs a new buffer attribute.
	 *
	 * @param array - The array holding the attribute data.
	 * @param itemSize - The item size.
	 * @param [normalized=false] - Whether the data are normalized or not.
	 */
	constructor( array: TypedArray, itemSize: number, normalized = false )
	{
		super();

		if ( Array.isArray( array ) ){
			throw new TypeError( 'BufferAttribute: array should be a Typed Array.' );
		}

		this.array = array;
		this.itemSize = itemSize;
		this.normalized = normalized;
		this.version = 0;

		this.count = array !== undefined ? array.length / itemSize : 0;

		_id++;

		this.id = _id;  
	}

	/**
	 * Standard buffer attribute index getter
	 * @abstract
	 * 
	 * @param index 
	 * @returns corrected index
	 * @internal
	 */
	_getIndex( index: number ): number
	{
		return index * this.itemSize;
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
	 * Sets the given array data in the buffer attribute.
	 *
	 * @param value - The array data to set.
	 * @param [offset=0] - The offset in this buffer attribute's array.
	 * @return A reference to this instance.
	 */
	set( value: TypedArray, offset = 0 )
	{
		this.array.set( value, offset );
		return this;
	}

	applyPos( m: Matrix3 )
	{
		for ( let i = 0, l = this.count; i < l; i ++ ){

			_vector2.fromBufferAttribute( this, i );
			_vector2.applyMatrix3( m );

			this.setXY( i, _vector2.x, _vector2.y );

		}
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