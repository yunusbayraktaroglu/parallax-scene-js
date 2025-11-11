attribute vec2 position;
attribute vec2 uv;
attribute vec4 atlas; // Normalized 0-1
attribute vec2 parallax; // Normalized 0-1
attribute vec2 scale; // Px value
attribute vec2 resize;
attribute float ratio;

// Normalized 0-1
uniform vec2 u_pointer;

// The resolution (width, height) of the viewport/canvas.
uniform vec2 u_resolution;

varying vec2 vUv;

void main()
{
	vec2 _actualSize = u_resolution * resize;

	// Calculate the precise UVs for the correct tile in the atlas.
    // 'uv' is scaled down by 'atlas.xy' (tile size)
    // and then shifted by 'atlas.zw' (tile offset) to map the correct sprite.
	vUv = ( uv * atlas.xy ) + atlas.zw;

	// Apply the 'scale' (e.g., sprite width/height in pixels) to the base 'position'.
    // '_position' now holds coordinates in "world" space
	vec2 _position = position * scale;

	// oPointer = [ -1, +1 ]
	vec2 _oPointer = ( u_pointer * 2.0 ) - 1.0;

	// Calculate pointer position change factor
	vec2 _maxTranslate = ( u_resolution - scale ) / 2.0;
	vec2 _pointerFactor = _maxTranslate * parallax * _oPointer;

	_position += _pointerFactor;

    // This line converts the "world" position directly to clip space [-1, 1].
    // Scales to clip space and flips the Y-axis, with Y flipped to match OpenGL's +Y-up convention)
	vec2 _clipSpace = _position / u_resolution * vec2( 2, -2 );

	gl_Position = vec4( _clipSpace, 0, 1 );
}