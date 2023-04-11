import { Uint16BufferAttribute, Uint32BufferAttribute } from '../buffers/BufferAttribute';
import { Matrix3 } from '../math/Matrix3';
import { arrayNeedsUint32 } from '../math/mathUtils';

let _id = 0;
const _m1 = new Matrix3();

export class BufferGeometry {

	name!: string;
	index!: IBufferAttribute;
	attributes!: {
        [name: string]: IBufferAttribute | IInterleavedBufferAttribute;
    };
    groups: Array<{
        start: number;
        count: number;
        id: string;
    }>;

	constructor(){

		Object.defineProperty( this, 'id', { value: _id ++ } );

		this.attributes = {};
		this.groups = [];

	}

	/**
	 * 2D translation
	 */
	translate( x = 0, y = 0 ): void {

		_m1.makeTranslation( x, y );
		( this.attributes.position as IBufferAttribute ).applyPos( _m1 );

	}

	getIndex(): IBufferAttribute {

		return this.index;

	}

	setIndex( index: Array<number> ): void {

		this.index = new ( arrayNeedsUint32( index ) ? Uint32BufferAttribute : Uint16BufferAttribute )( index, 1 );

	}

	getAttribute( name: string ): IBufferAttribute | IInterleavedBufferAttribute {

		return this.attributes[ name ];

	}

	setAttribute( name: string, attribute: IBufferAttribute ): void {

		this.attributes[ name ] = attribute;
		attribute.name = name;

	}

	addGroup( start: number, count: number, id: string ): void {

		this.groups.push( {
			start: start,
			count: count,
			id: id
		} );

	}

}