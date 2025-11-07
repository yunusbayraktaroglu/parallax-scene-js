attribute vec2 position;
attribute vec2 uv;
attribute vec4 atlas; // Normalized atlas position in merged texture
attribute vec2 parallax; // Normalized
attribute vec2 scale; // Px value of the layer

uniform vec2 u_resolution; // Px value of canvas
uniform vec2 u_pointer; // Normalized
uniform mat3 u_projection;

varying vec2 vUv;

void main()
{
	// Normalized atlas
	vec2 _tileSize = vec2( atlas.x, atlas.y );
	vec2 _tileOffset = vec2( atlas.z, atlas.w );

	vUv = uv * _tileSize + _tileOffset;

	// oPointer = [ -1, +1 ]
	vec2 _oPointer = u_pointer * 2.0 - 1.0;

	float u_zoom = u_projection[ 0 ][ 0 ];
	//float u_zoom = u_projection[ 0 ][ 0 ] * ( u_resolution / 2.0 );

    // Calculate the maximum *pixel* translate in horizontal and vertical directions
	//vec2 _maxPixelTranslate = abs( ( ( scale * u_zoom ) - u_resolution ) / 2.0 );
	vec2 _maxPixelTranslate = vec2( 0 ) * u_resolution;

    // Calculate the final pixel offset from the parallax
	vec2 _pixelParallaxOffset = _maxPixelTranslate * parallax * _oPointer;

    // Calculate the world space position (in pixels)
    // (position * scale) = base scaled position of the vertex
    // _pixelParallaxOffset = parallax translation
	vec2 _worldPosition = ( position * scale ) + _pixelParallaxOffset;

    // *** PIXEL SNAPPING FIX ***
    // Round the world position to the nearest integer pixel value.
    // This eliminates sub-pixel jitter/shimmer caused by floating-point errors.
    vec2 _snappedPosition = vec2( ceil( _worldPosition.x ), ceil( _worldPosition.y ) );

    // Apply the 2D orthographic projection matrix
    // We convert our 2D world position to a vec3 (x, y, 1.0)
    // so that the translation component of the mat3 is applied.
	vec3 _projectedPosition = u_projection * vec3( _worldPosition, 1.0 );

	// The result of the mat3 multiplication is (x_clip, y_clip, w_clip)
    // We pass this to gl_Position as vec4(x_clip, y_clip, z, w_clip)
    // The z-coordinate is 0.0 because we are in 2D.
	gl_Position = vec4( _projectedPosition.xy, 0.0, 1.0 );
}