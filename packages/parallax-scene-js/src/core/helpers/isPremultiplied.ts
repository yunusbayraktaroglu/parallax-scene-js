/**
 * Verifies if an ImageBitmap is likely premultiplied.
 * 
 * @note - Use for debugging purposes
 * @returns boolean
 */
export function isPremultipliedImage( imageBitmap: ImageBitmap )
{
	// 1. Create a temporary, off-screen canvas to capture the pixels.
	const canvas = new OffscreenCanvas( imageBitmap.width, imageBitmap.height );

	// 2. Get the 2D context to draw the bitmap.
	const ctx = canvas.getContext( '2d' )!;

	// Draw the ImageBitmap onto the 2D canvas
	ctx.drawImage( imageBitmap, 0, 0 );

	// 3. Read the entire pixel data array (the slow step).
	const imageData = ctx.getImageData( 0, 0, canvas.width, canvas.height );
	const data = imageData.data;

	// --- 4. Pixel Checking Logic ---
	// Iterate over every pixel, checking the fundamental Premultiplied Alpha rule: R, G, B must be <= A.
	for ( let i = 0; i < data.length; i += 4 ){

		const r = data[ i ];
		const g = data[ i + 1 ];
		const b = data[ i + 2 ];
		const a = data[ i + 3 ];

		// If alpha is zero, R/G/B must be zero (if fully premultiplied).
		// If alpha is less than 255, we check the rule-breaker condition: R/G/B cannot be greater than A.
		if ( a < 255 && ( r > a || g > a || b > a ) ){

			// This pixel violates the rule for Premultiplied Alpha.
			// It is definitively Unpremultiplied (Straight) Alpha.
			return false;

		}

	}

	// If no violations were found, the image is either fully opaque 
	// or is correctly premultiplied. We resolve to 'true'.
	return true;
}