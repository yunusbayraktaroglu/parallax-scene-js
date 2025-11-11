precision mediump float;

uniform sampler2D u_texture;

varying vec2 vUv;

void main()
{
	vec4 _color = texture2D( u_texture, vUv );
	gl_FragColor = vec4( _color.rgb, _color.a );
}