import { BufferGeometry } from './BufferGeometry';
import { Float32BufferAttribute } from '../buffers/BufferAttribute';
import { ParallaxLayer } from '../components/ParallaxScene';

export class ParallaxGeometry extends BufferGeometry
{
	constructor( parallaxLayer: ParallaxLayer, widthSegments = 1, heightSegments = 1 )
	{
		super();

		this.name = 'ParallaxGeometry';
		
		let verticesCount = 0;

		const width = 1;
		const height = 1;

		const width_half = width / 2;
		const height_half = height / 2;

		const gridX = Math.floor( widthSegments );
		const gridY = Math.floor( heightSegments );

		const gridX1 = gridX + 1;
		const gridY1 = gridY + 1;

		const segment_width = width / gridX;
		const segment_height = height / gridY;

		// Create vertex positions and uvs
		const vertices = [];
		const uvs = [];

		for ( let iy = 0; iy < gridY1; iy ++ ){

			const y = iy * segment_height - height_half;

			for ( let ix = 0; ix < gridX1; ix ++ ){

				const x = ix * segment_width - width_half;

				vertices.push( x, - y );

				uvs.push( ix / gridX );
				uvs.push( 1 - ( iy / gridY ) );
			}
		}

		verticesCount = vertices.length / 2;

		// Create indices
		const indices = [];

		for ( let iy = 0; iy < gridY; iy ++ ){

			for ( let ix = 0; ix < gridX; ix ++ ){

				const a = ix + gridX1 * iy;
				const b = ix + gridX1 * ( iy + 1 );
				const c = ( ix + 1 ) + gridX1 * ( iy + 1 );
				const d = ( ix + 1 ) + gridX1 * iy;

				indices.push( a, b, d );
				indices.push( b, c, d );

			}
		}

		// Create atlas attributes
		const atlas = [];

		const { w, h, x, y } = parallaxLayer.atlas.normalized;

		for ( let j = 0; j < verticesCount * 4; j += 4 ){
			atlas[ j + 0 ] = w;
			atlas[ j + 1 ] = h;
			atlas[ j + 2 ] = x;
			atlas[ j + 3 ] = y;
		}

		// Create parallax attributes
		const parallax = [];

		// Insert x, y, as vec2
		for ( let j = 0; j < verticesCount * 2; j += 2 ){
			parallax[ j + 0 ] = parallaxLayer.settings.parallax.x || 0;
			parallax[ j + 1 ] = parallaxLayer.settings.parallax.y || 0;
		}


		// Create scale attributes
		// default: image source default size
		const scale = [];

		// Insert x, y, as vec2
		for ( let j = 0; j < verticesCount * 2; j += 2 ){
			scale[ j + 0 ] = parallaxLayer.atlas.w;
			scale[ j + 1 ] = parallaxLayer.atlas.h;
		}

		this.setIndex( indices );
		this.setAttribute( "position", new Float32BufferAttribute( vertices, 2 ) );
		this.setAttribute( "uv", new Float32BufferAttribute( uvs, 2 ) );
		this.setAttribute( "atlas", new Float32BufferAttribute( atlas, 4 ) );
		this.setAttribute( "parallax", new Float32BufferAttribute( parallax, 2 ) );
		this.setAttribute( "scale", new Float32BufferAttribute( scale, 2 ) );
	}

}