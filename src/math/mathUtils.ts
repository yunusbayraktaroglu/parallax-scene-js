export function arrayNeedsUint32( array: Array<number> ): boolean {

	// assumes larger values usually on last
	for ( let i = array.length - 1; i >= 0; -- i ) {

		if ( array[ i ] >= 65535 ) return true;

	}

	return false;

}