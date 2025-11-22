import { BufferAttribute } from "../../buffers/BufferAttribute";
import { InterleavedBuffer } from "../../buffers/InterleavedBuffer";

/**
 * Geometry rendering attribute types
 * 
 * Non-Interleaved Attributes:
 * - Each attribute has its own separate WebGLBuffer.
 * - Each attribute requires calling bindBuffer(), then enableVertexAttribArray(), and vertexAttribPointer().
 * 
 * Interleaved Attributes:
 * - Only a single WebGLBuffer is needed.
 * - One InterleavedBufferAttribute is bound, then for each attribute call enableVertexAttribArray() and vertexAttribPointer().
 * - Interleaved attributes share the same InterleavedBufferAttribute.data (InterleavedBuffer), which holds the actual data.
 */
type Attribute = BufferAttribute | InterleavedBuffer;

export type BufferStorage = {
	buffer: WebGLBuffer;
	/**
	 * Data type of the attribute
	 * 
	 * @example
	 * gl.FLOAT
	 * gl.HALF_FLOAT
	 * gl.UNSIGNED_INT
	 * ...
	 */
	type: number;
	/**
	 * Points attribute.version, 
	 * will be compared in update() method
	 */
	version: number;
	/**
	 * Points to attribute.array.BYTES_PER_ELEMENT
	 */
	bytesPerElement: number;
	/**
	 * Points to attribute.array.byteLenght
	 */
	size: number;
};

/**
 * Responsible for generating, updating, deleting WebGLBuffers
 */
export class BufferHelper
{
	gl: ParallaxRenderingContext;

	buffers = new WeakMap<Attribute, BufferStorage>();

	/**
	 * Creates a new BufferHelper for managing WebGL buffers.
	 *
	 * @param gl The WebGL rendering context used for WebGL buffer operations.
	 */
	constructor( gl: ParallaxRenderingContext )
	{
		this.gl = gl;
	}

	/**
	 * Returns the {@link BufferStorage} blong to attribute if exist
	 * 
	 * @param attribute 
	 * @returns BufferStorage | undefined
	 */
	get( attribute: Attribute ): BufferStorage | undefined
	{
		return this.buffers.get( attribute );
	}

	/**
	 * Removes the {@link BufferStorage} belong to attribute if exist
	 * 
	 * @param attribute 
	 */
	remove( attribute: Attribute ): void
	{
		const data = this.buffers.get( attribute );

		if ( data ){
			this.gl.deleteBuffer( data.buffer );
			this.buffers.delete( attribute );
		}
	}

	/**
	 * Should be called if given attribute has been changed.
	 * Updates the {@link BufferStorage} blong to attribute or creates it.
	 * 
	 * @param attribute
	 * @param bufferType
	 */
	update( attribute: Attribute, bufferType: GLenum ): void
	{
		const data = this.buffers.get( attribute );

		if ( data === undefined ){

			this.buffers.set( attribute, this._createBuffer( attribute, bufferType ) );
			return;

		} else if ( data.version < attribute.version ){

			if ( data.size !== attribute.array.byteLength ){

				throw new Error( `WebGLAttributes: The size of the buffer attribute's array buffer does not match the original size. Resizing buffer attributes is not supported.` );

			}

			this._updateBuffer( data.buffer, attribute, bufferType );

			data.version = attribute.version;
			return;
		}
	}

	/**
	 * Creates WebGLBuffer with given attribute
	 * 
	 * @param attribute 
	 * @param bufferType 
	 * @returns 
	 */
	private _createBuffer( attribute: Attribute, bufferType: GLenum )
	{
		const gl = this.gl;

		const array = attribute.array;
		const usage = attribute.usage;

		const buffer = gl.createBuffer();

		gl.bindBuffer( bufferType, buffer );
		gl.bufferData( bufferType, array, usage );

		//attribute.onUploadCallback();

		let type;

		if ( array instanceof Float32Array ){

			type = gl.FLOAT;

		} 
		
		// else if ( typeof Float16Array !== 'undefined' && array instanceof Float16Array ){

		// 	if ( gl instanceof WebGLRenderingContext ){
		// 		throw new Error( "Float16Array only supported with WebGL 2" );
		// 	}

		// 	type = gl.HALF_FLOAT;

		// } 
		
		else if ( array instanceof Uint16Array ){

			if ( 'isFloat16BufferAttribute' in attribute ){

				if ( gl instanceof WebGLRenderingContext ){
					throw new Error( "Uint16Array only supported with WebGL 2" );
				}

				type = gl.HALF_FLOAT;

			} else {

				type = gl.UNSIGNED_SHORT;

			}

		} else if ( array instanceof Int16Array ){

			type = gl.SHORT;

		} else if ( array instanceof Uint32Array ){

			type = gl.UNSIGNED_INT;

		} else if ( array instanceof Int32Array ){

			type = gl.INT;

		} else if ( array instanceof Int8Array ){

			type = gl.BYTE;

		} else if ( array instanceof Uint8Array ){

			type = gl.UNSIGNED_BYTE;

		} else if ( array instanceof Uint8ClampedArray ){

			type = gl.UNSIGNED_BYTE;

		} else {

			throw new Error( 'WebGLAttributes: Unsupported buffer data format: ' + array );

		}

		return {
			buffer: buffer,
			type: type,
			version: attribute.version,
			bytesPerElement: array.BYTES_PER_ELEMENT,
			size: array.byteLength
		};
	}

	/**
	 * Updates given buffer
	 * 
	 * @param buffer 
	 * @param attribute 
	 * @param bufferType 
	 */
	private _updateBuffer( buffer: WebGLBuffer, attribute: Attribute, bufferType: GLenum )
	{
		const gl = this.gl;
		
		const array = attribute.array;
		const updateRanges = attribute.updateRanges;

		gl.bindBuffer( bufferType, buffer );

		if ( updateRanges.length === 0 ){

			// Not using update ranges
			gl.bufferSubData( bufferType, 0, array );

		} else {

			// Before applying update ranges, we merge any adjacent / overlapping
			// ranges to reduce load on `gl.bufferSubData`. Empirically, this has led
			// to performance improvements for applications which make heavy use of
			// update ranges. Likely due to GPU command overhead.
			//
			// Note that to reduce garbage collection between frames, we merge the
			// update ranges in-place. This is safe because this method will clear the
			// update ranges once updated.

			updateRanges.sort( ( a, b ) => a.start - b.start );

			// To merge the update ranges in-place, we work from left to right in the
			// existing updateRanges array, merging ranges. This may result in a final
			// array which is smaller than the original. This index tracks the last
			// index representing a merged range, any data after this index can be
			// trimmed once the merge algorithm is completed.

			let mergeIndex = 0;

			for ( let i = 1; i < updateRanges.length; i ++ ){

				const previousRange = updateRanges[ mergeIndex ];
				const range = updateRanges[ i ];

				// We add one here to merge adjacent ranges. This is safe because ranges
				// operate over positive integers.
				if ( range.start <= previousRange.start + previousRange.count + 1 ){

					previousRange.count = Math.max(
						previousRange.count,
						range.start + range.count - previousRange.start
					);

				} else {

					++ mergeIndex;
					updateRanges[ mergeIndex ] = range;

				}

			}

			// Trim the array to only contain the merged ranges.
			updateRanges.length = mergeIndex + 1;

			for ( let i = 0, l = updateRanges.length; i < l; i ++ ){

				const range = updateRanges[ i ];

				this.gl.bufferSubData( bufferType, range.start * array.BYTES_PER_ELEMENT,
					array, range.start, range.count );

			}

			attribute.clearUpdateRanges();

		}

		attribute.onUploadCallback();
	}

}