import { BufferAttribute } from "../buffers/BufferAttribute";
import { InterleavedBuffer } from "../buffers/InterleavedBuffer";
import { InterleavedBufferAttribute } from "../buffers/InterleavedBufferAttribute";
import { BufferGeometry } from "../geometries/BufferGeometry";

/**
 * Interleaves given group of standard attributes
 * 
 * @see https://github.com/mrdoob/three.js/blob/master/examples/jsm/utils/BufferGeometryUtils.js#L133
 * 
 * @param attributes 
 * @returns Array of interleaved attributes that points same data -> InterleavedBuffer
 */
export function interleaveAttributes( attributes: BufferAttribute[] ): InterleavedBufferAttribute[]
{
	// First: calculate the length and stride of the interleavedBuffer
	let typeCheck;
	let arrayLength = 0;
	let stride = 0;

	for ( let i = 0, l = attributes.length; i < l; ++ i ){

		const attribute = attributes[ i ];

		if ( typeCheck === undefined ) typeCheck = attribute.array.constructor;
		if ( typeCheck !== attribute.array.constructor ){
			throw new Error( `Different array types cannot be interleaved` );
		}

		arrayLength += attribute.array.length;
		stride += attribute.itemSize;

	}

	// Create the set of buffer attributes
	const interleavedBuffer = new InterleavedBuffer( new Float32Array( arrayLength ), stride );

	let offset = 0;

	const res = [];
	const getters = [ 'getX', 'getY', 'getZ', 'getW' ];
	const setters = [ 'setX', 'setY', 'setZ', 'setW' ];

	for ( let j = 0, l = attributes.length; j < l; j ++ ){

		const attribute = attributes[ j ];
		const itemSize = attribute.itemSize;
		const count = attribute.count;
		
		const iba = new InterleavedBufferAttribute( interleavedBuffer, itemSize, offset );
		
		iba.name = attribute.name;
		res.push( iba );

		offset += itemSize;

		// Move the data for each attribute into the new interleavedBuffer
		// at the appropriate offset
		for ( let c = 0; c < count; c ++ ) {

			for ( let k = 0; k < itemSize; k ++ ) {
				
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				iba[ setters[ k ] ]( c, attribute[ getters[ k ] ]( c ) );

			}

		}

	}

	// Should return
	// console.log( interleavedBuffer )
	return res;

}


/**
 * Replaces attributes with InterleavedAttribute that points same data
 * @param geometry 
 */
export function replaceWithInterleavedAttributes( geometry: BufferGeometry )
{
    const attributes = Object.keys( geometry.attributes );
    const interleavingAttributes: BufferAttribute[] = [];

    for ( let i = 0; i < attributes.length; i++ ){

		const attribute = geometry.attributes[ i ];

		if ( 'isInterleaved' in attribute ){
			continue;
		}
		
		// @ts-expect-error - We seperated interleaved attributes above
		interleavingAttributes.push( geometry.attributes[ attributes[ i ] ] );
    }

    const interleavedAttributes = interleaveAttributes( interleavingAttributes );

    for ( let i = 0; i < attributes.length; i++ ){

        geometry.setAttribute( attributes[ i ], interleavedAttributes[ i ] );

    }
}

