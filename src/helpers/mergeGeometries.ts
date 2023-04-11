import { BufferAttribute } from "../buffers/BufferAttribute";
import { BufferGeometry } from "../geometries/BufferGeometry";

/**
 * Merge given geometries with attributes
 */
export function mergeGeometries( geometries: Array<BufferGeometry>, useGroups = false ): BufferGeometry {

	const mergedGeometry = new BufferGeometry();

	/** Collect attributes & groups */
	const attributes: { [name: string]: IBufferAttribute[] } = {};
	let offset = 0;

	for ( let i = 0; i < geometries.length; ++ i ){

		const geometry = geometries[ i ];

		for ( const name in geometry.attributes ){

			if ( attributes[ name ] === undefined ) attributes[ name ] = [];
			const attribute = geometry.attributes[ name ] as IBufferAttribute;
			attributes[ name ].push( attribute );
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

		const index = geometries[ i ].index;

		for ( let j = 0; j < index.count; ++ j ){
			mergedIndex.push( index.getX( j ) + indexOffset );
		}

		indexOffset += ( geometries[ i ].attributes.position as IBufferAttribute ).count;
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
 * Merge given buffer attributes
 */
function mergeAttributes( attributes: Array<IBufferAttribute> ): IBufferAttribute {

	let itemSize = 0;
	let arrayLength = 0;

	for ( let i = 0; i < attributes.length; ++ i ) {

		const attribute = attributes[ i ];

		if ( itemSize === 0 ) itemSize = attribute.itemSize;

		arrayLength += attribute.array.length;
	}

	const array = new Float32Array( arrayLength );
	let offset = 0;

	for ( let i = 0; i < attributes.length; ++ i ) {

		array.set( attributes[ i ].array, offset );
		offset += attributes[ i ].array.length;
	}

	return new BufferAttribute( array, itemSize );
}