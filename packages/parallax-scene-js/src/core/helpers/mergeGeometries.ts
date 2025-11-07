import { BufferAttribute } from "../buffers/BufferAttribute";
import { InterleavedBufferAttribute } from "../buffers/InterleavedBufferAttribute";
import { BufferGeometry } from "../geometries/BufferGeometry";

/**
 * Merge given geometries with attributes
 * 
 * @see https://github.com/mrdoob/three.js/blob/master/examples/jsm/utils/BufferGeometryUtils.js#L133
 * 
 * @param geometries Buffer Geometries to merge
 * @param useGroups Defaults to `false`. If true passed, geometry.name will be used as id in the merged geometry
 */
export function mergeGeometries( geometries: BufferGeometry[], useGroups = false ): BufferGeometry
{
	const mergedGeometry = new BufferGeometry();

	// Collect attributes & groups
	const attributes: { [ name: string ]: BufferAttribute[] } = {};
	
	let offset = 0;

	for ( let i = 0; i < geometries.length; ++ i ){

		const geometry = geometries[ i ];

		for ( const name in geometry.attributes ){

			if ( ! attributes[ name ] ){
				attributes[ name ] = [];
			}

			const attribute = geometry.attributes[ name ];
			
			// Only collect non-interleaved attributes
			if ( attribute instanceof BufferAttribute ){

				attributes[ name ].push( attribute );

			}
		}

		if ( useGroups && geometry.index ){

			const count = geometry.index.count;
			mergedGeometry.addGroup( offset, count, geometry.name );
			offset += count;
		}
	}

	/** Merge indices */
	let indexOffset = 0;
	const mergedIndex = [];

	for ( let i = 0; i < geometries.length; ++ i ){

		// We have index attributes in ParallaxGeometry
		const index = geometries[ i ].index !;

		for ( let j = 0; j < index.count; ++ j ){
			mergedIndex.push( index.getX( j ) + indexOffset );
		}

		indexOffset += geometries[ i ].attributes.position.count;
	}

	mergedGeometry.setIndex( mergedIndex );

	/** Merge attributes */
	for ( const name in attributes ){

		const mergedAttribute = mergeAttributes( attributes[ name ] );
		mergedGeometry.setAttribute( name, mergedAttribute );
	}

	return mergedGeometry;
}


/**
 * Merges given buffer attributes one by one
 */
function mergeAttributes( attributes: BufferAttribute[] ): BufferAttribute 
{
	let itemSize = 0;
	let arrayLength = 0;

	for ( let i = 0; i < attributes.length; ++ i ){

		const attribute = attributes[ i ];

		if ( itemSize === 0 ) itemSize = attribute.itemSize;

		arrayLength += attribute.array.length;
	}

	const array = new Float32Array( arrayLength );

	let offset = 0;

	for ( let i = 0; i < attributes.length; ++ i ){

		array.set( attributes[ i ].array, offset );
		offset += attributes[ i ].array.length;
	}

	return new BufferAttribute( array, itemSize );
}