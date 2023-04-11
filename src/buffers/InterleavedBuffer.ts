export class InterleavedBuffer implements IInterleavedBuffer {

	name = '';
    array: TypedArray;
    count: number;
	stride: number;

	constructor( array: TypedArray, stride: number ){

		this.array = array;
		this.stride = stride;
		this.count = array !== undefined ? array.length / stride : 0;
		
	}

	set( value: TypedArray, offset: number ): this {

		this.array.set( value, offset );
		return this;

	}

}
