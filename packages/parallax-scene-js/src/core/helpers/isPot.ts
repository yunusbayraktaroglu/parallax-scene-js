/**
 * Returns if texture size is power of two
 * 
 * @param textureWidth 
 * @param textureHeight 
 * @returns 
 */
export function isPOTTexture( textureWidth: number, textureHeight: number ): boolean
{
	return isPowerOf2( textureWidth ) && isPowerOf2( textureHeight );
}

function isPowerOf2( value: number ): boolean
{
	return ( value & ( value - 1 ) ) === 0;
}