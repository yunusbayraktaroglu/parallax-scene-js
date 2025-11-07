attribute vec2 position;
attribute vec2 uv;
attribute vec4 atlas;
attribute vec2 parallax;
attribute vec2 scale;

uniform vec2 u_resolution;
uniform vec2 u_pointer;

varying vec2 vUv;

void main()
{
	// Normalized atlas
	vec2 _tileSize = vec2( atlas.x, atlas.y );
	vec2 _tileOffset = vec2( atlas.z, atlas.w );

	vUv = uv * _tileSize + _tileOffset;

	// Add 1px to each side to test
	vec2 _testResolution =  vec2( 2.0, 0.0 );

	// @todo if width or height same with resolution, no parallax doing 
	vec2 _maxTranslate = abs( ( scale - u_resolution + _testResolution ) / scale / 2.0 );

	// oPointer = [ -1, +1 ]
	vec2 oPointer = u_pointer * 2.0 - 1.0;

	// u_pointer = [ -1, +1 ], parallax = [ 0, +1 ]
	vec2 _pointerFactor = _maxTranslate * parallax * oPointer;
	vec2 _clipSpaceFactor = u_resolution / scale;

	// convert to -1 -> +1 (clipspace)
	vec2 _position = position * scale;
	vec2 _zeroToOne = _position / u_resolution + vec2( 0.5 ) + vec2( _pointerFactor / _clipSpaceFactor );
	vec2 _clipSpace = _zeroToOne * 2.0 - 1.0;

	gl_Position = vec4( _clipSpace * vec2( 1, -1 ), 0, 1 );
}