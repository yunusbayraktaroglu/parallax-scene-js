import { type ShaderAttributeData } from "./ProgramHelpers";
import { type BufferStorage } from "./BufferHelpers";
import { BufferAttribute } from "../../buffers/BufferAttribute";
import { InterleavedBufferAttribute } from "../../buffers/InterleavedBufferAttribute";

export class AttributeHelper
{
	gl: ParallaxRenderingContext;

	constructor( gl: ParallaxRenderingContext )
	{
		this.gl = gl;
	}

	/**
	 * Binding inices
	 * 
	 * @param index 
	 * @param bufferData 
	 */
	bindIndices( bufferData: BufferStorage )
	{
		const gl = this.gl;
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, bufferData.buffer );
	}

	/**
	 * Binding a standard (non-interleaved, non-instanced) attribute
	 * 
	 * @param attribute BufferAttribute
	 * @param attributeData Related attribute data
	 * @param bufferData Related buffer data
	 */
	bindStandartAttribute( attribute: BufferAttribute, attributeData: ShaderAttributeData, bufferData: BufferStorage )
	{
		const gl = this.gl;

		gl.bindBuffer( gl.ARRAY_BUFFER, bufferData.buffer );

		gl.enableVertexAttribArray( attributeData.location );
		gl.vertexAttribPointer(
			attributeData.location, // target
			attribute.itemSize, // Number of components per vertex attribute
			bufferData.type, // type
			false, // Normalized
			0, // Byte stride (0 if not interleaved)
			0  // Byte offset (0 if not interleaved)
		);
	}

	/**
	 * Interleaved attributes has the same InterleavedBuffer in their {@link InterleavedAttribute.data} property,
	 * That data instance has 1 WebGL data
	 * 
	 * @param attributes
	 * @param attributeDatas
	 * @param bufferData 
	 */
	bindInterleavedAttributes( attributes: InterleavedBufferAttribute[], attributeDatas: ShaderAttributeData[], bufferData: BufferStorage )
	{
		/**
		 * @todo
		 * Control if every attribute in the ShaderAttributeData has been setted, or display warning message
		 */

		const gl = this.gl;

		gl.bindBuffer( gl.ARRAY_BUFFER, bufferData.buffer );

		for ( const attribute of attributes ){

			const attributeData = attributeDatas.find( attributeData => attributeData.name === attribute.name );

			if ( ! attributeData ){
				console.error( `Attribute '${ attribute.name }': not used in the shader.` );
				continue;
			}
			
			gl.enableVertexAttribArray( attributeData.location );
			gl.vertexAttribPointer(
				attributeData.location,	// target
				attribute.itemSize, // interleaved data size
				bufferData.type, // type
				false, // normalized
				bufferData.bytesPerElement * attribute.data.stride, // stride (chunk size)
				bufferData.bytesPerElement * attribute.offset, // offset (position of interleaved data in chunk) 
			);

		}
	}

}
