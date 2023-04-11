import { BufferGeometry } from '../geometries/BufferGeometry';
import { ParallaxGeometry } from '../geometries/ParallaxGeometry';
import { mergeGeometries } from '../helpers/mergeGeometries';
import { interleaveAttributes } from '../helpers/attributeInterleaver';

/**
 * ParallaxScene with given user options
 */
export class ParallaxScene {

	planes: Array<ParallaxItemOptions>;
	attributes: Array<IInterleavedBufferAttribute>;
	geometry: BufferGeometry;
	indices: TypedArray;
	renderBuffer: TypedArray;
	stride: number;
	fsize: number;
	renderCount: number;

	constructor( canvasSize: Resolution2, sceneData: Array<ParallaxItemOptions> ){

		/** Create parallax geometries */
		const parallaxes = [];

		for ( const sceneItem of sceneData ){

			const parallax = new ParallaxGeometry( canvasSize, sceneItem );
			parallax.name = sceneItem.imageUrl;

			if ( sceneItem.translate ){
				parallax.translate( sceneItem.translate.x, sceneItem.translate.y );
			}

			parallaxes.push( parallax );
		}

		/** Merge parallaxes */
		const mergedGeometry = mergeGeometries( parallaxes, true );
		const attributes =  Object.values( mergedGeometry.attributes ) as Array<IBufferAttribute>;
		const interleavedAttributes = interleaveAttributes( attributes );
		const buffer = interleavedAttributes[ 0 ].data;
	
		/** Assign parallax scene */
		this.planes = sceneData;
		this.geometry = mergedGeometry;
		this.indices = mergedGeometry.index.array;
		this.renderCount = mergedGeometry.index.count;
		this.attributes = interleavedAttributes;
		this.renderBuffer = buffer.array;
		this.stride = buffer.stride;
		this.fsize = buffer.array.BYTES_PER_ELEMENT;

		this.resize();
	}

	resize(): void {

		const geometry = this.geometry;
		const attribute = this.attributes.find( attribute => attribute.name === "scale" )!;
		const { innerWidth, innerHeight } = window;

		for ( const plane of this.planes ){

			/**
			 * Keep default scale of plane if 'fit' option is not defined 
			 * default scale: image source size
			 */
			if ( ! plane["fit"] ) return;

			let width, height;
				
			if ( plane["fit"]["h"] ){

				height = innerHeight * plane["fit"]["h"];
				width = height * plane["atlas"]["ratio"];

			} else if ( plane["fit"]["w"] ){

				width = innerWidth * plane["fit"]["w"];
				height = width / plane["atlas"]["ratio"];

			}

			if ( ! width || ! height ) return;
			
			const planeGeometry = geometry.groups.find( planeGeo => planeGeo.id === plane.imageUrl )!;

			for ( let i = 0; i < planeGeometry.count; i++ ){

				const indice = geometry.index.getX( planeGeometry.start + i );
				attribute.setXY( indice, width, height );

			}

		}
		
	}

}