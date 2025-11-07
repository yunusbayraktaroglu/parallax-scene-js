import { BufferAttribute, Uint16BufferAttribute } from '../buffers/BufferAttribute';
import { InterleavedBufferAttribute } from '../buffers/InterleavedBufferAttribute';
import { InterleavedBuffer } from '../buffers/InterleavedBuffer';

import { Matrix3 } from '../math/Matrix3';

const _m1 = new Matrix3();

/**
 * Attribute types should be pre-grouped because each type has 
 * a different style of binding to WebGL.
 */
type NewAttributes = {
	/**
	 * Each InterleavedBufferAttribute per attribute, 
	 * points to same {@link InterleavedBuffer} in {@link InterleavedBufferAttribute.data} property
	 */
	interleaved: Record<string, InterleavedBufferAttribute>;
	standard: Record<string, BufferAttribute>;
	instanced: Record<string, any>;
};

/**
 * A representation of mesh, line, or point geometry. Includes vertex
 * positions, face indices, normals, colors, UVs, and custom attributes
 * within buffers, reducing the cost of passing all this data to the GPU.
 */
export class BufferGeometry
{
	private static _nextId = 0;

    /**
     * Unique number for this {@link BufferGeometry | BufferGeometry} instance.
     */
    readonly id = BufferGeometry._nextId++;

	/**
     * Read-only flag to check if a given object is of type {@link BufferGeometry}.
     */
    readonly isBufferGeometry = true;

    /**
     * Optional name for this {@link BufferGeometry | BufferGeometry} instance.
     * @defaultValue `''`
     */
    name: string = '';

	/**
     * Determines the part of the geometry to render. This should not be set directly, 
	 * instead use {@link setDrawRange | .setDrawRange(...)}.
     */
    drawRange = { start: 0, count: Infinity };

    /**
     * Allows for vertices to be re-used across multiple triangles; this is called using "indexed triangles".
     * Each triangle is associated with the indices of three vertices. This attribute therefore stores the index of each vertex for each triangular face.
     * If this attribute is not set, the {@link WebGLRenderer | renderer}  assumes that each three contiguous positions represent a single triangle.
     * @defaultValue `null`
     */
    index: BufferAttribute | null = null;

	/**
	 * This dictionary has as id the name of the attribute to be set and as value
	 * the buffer attribute to set it to. Rather than accessing this property directly,
	 * use `setAttribute()` and `getAttribute()` to access attributes of this geometry.
	 */
	attributes: Record<string, BufferAttribute | InterleavedBufferAttribute> = {};
    
	groups: {
		/**
		 * Group unique ID to get group
		 */
        id: string;
		/**
		 * Specifies the first element in this draw call – the first vertex for non-indexed geometry, 
		 * otherwise the first triangle index.
		 */
        start: number;
		/**
		 * Specifies how many vertices (or indices) are included.
		 */
        count: number;
    }[] = [];

    /**
     * This creates a new {@link BufferGeometry | BufferGeometry} object.
     */
	constructor(){}

	/**
	 * 2D translation
	 */
	translate( x = 0, y = 0 ): void
	{
		_m1.makeTranslation( x, y );
		( this.attributes.position as BufferAttribute ).applyPos( _m1 );
	}

	/**
	 * Returns the index of this geometry.
	 *
	 * @return The index. Returns `null` if no index is defined.
	 */
	getIndex(): BufferAttribute | null
	{
		return this.index;
	}

	/**
	 * Sets the given index to this geometry.
	 *
	 * @param index - The index to set.
	 * @return A reference to this instance.
	 */
	setIndex( index: BufferAttribute | number[] | null ): this
	{
		if ( Array.isArray( index ) ){
			// UInt16(0, 65535) will be enough for 2D plane rendering
			this.index = new Uint16BufferAttribute( index, 1 );
		} else {
			this.index = index;
		}
		return this;
	}

	/**
	 * Returns the buffer attribute for the given name.
	 *
	 * @param name - The attribute name.
	 * @return The buffer attribute.
	 * Returns `undefined` if not attribute has been found.
	 */
	getAttribute( name: string ): BufferAttribute | InterleavedBufferAttribute | undefined
	{
		return this.attributes[ name ];
	}

	/**
	 * Sets the given attribute for the given name.
	 *
	 * @param name - The attribute name.
	 * @param attribute - The attribute to set.
	 * @return A reference to this instance.
	 */
	setAttribute( name: string, attribute: BufferAttribute | InterleavedBufferAttribute ): this
	{
		this.attributes[ name ] = attribute;
		attribute.name = name;
		return this;
	}

	/**
	 * Deletes the attribute for the given name.
	 *
	 * @param name - The attribute name to delete.
	 * @return A reference to this instance.
	 */
	deleteAttribute( name: string ): this
	{
		delete this.attributes[ name ];
		return this;
	}

	/**
	 * Adds a group to this geometry.
	 *
	 * @param start - The first element in this draw call. That is the first
	 * vertex for non-indexed geometry, otherwise the first triangle index.
	 * @param count - Specifies how many vertices (or indices) are part of this group.
	 * @param id - Unique group id.
	 */
	addGroup( start: number, count: number, id: string ): void
	{
		this.groups.push( {
			id: id,
			start: start,
			count: count,
		} );
	}

}