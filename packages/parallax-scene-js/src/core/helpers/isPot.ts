/**
 * Returns if texture size is power of 2
 * 
 * @param textureWidth 
 * @param textureHeight 
 * @returns True if texture is power of 2
 */
export function isPOTTexture( textureWidth: number, textureHeight: number ): boolean
{
	return isPowerOf2( textureWidth ) && isPowerOf2( textureHeight );
}

function isPowerOf2( value: number ): boolean
{
	return ( value & ( value - 1 ) ) === 0;
}