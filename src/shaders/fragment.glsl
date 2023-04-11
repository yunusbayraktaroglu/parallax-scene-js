precision highp float;
uniform sampler2D u_image0;
uniform sampler2D u_image1;

varying vec2 vUv;

void main() {
	vec4 _color = texture2D( u_image0, vUv );
	gl_FragColor = vec4( _color.rgb * _color.a, _color.a );
}