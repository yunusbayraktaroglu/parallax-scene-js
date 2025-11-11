import { type ShaderAttributeData } from "./ProgramHelpers";
import { type BufferStorage } from "./BufferHelpers";
import { BufferAttribute } from "../../buffers/BufferAttribute";
import { InterleavedBufferAttribute } from "../../buffers/InterleavedBufferAttribute";

/**
 * Utility class for managing and binding WebGL vertex attributes and index buffers.
 * Supports standard and interleaved attribute configurations.
 */
export class AttributeHelper
{
	/**
	 * WebGL rendering context used for buffer and attribute operations.
	 */
	gl: ParallaxRenderingContext;

	/**
	 * Creates a new AttributeHelper for managing WebGL uniforms.
	 *
	 * @param gl The WebGL rendering context used for attribute binding operations.
	 */
	constructor( gl: ParallaxRenderingContext )
	{
		this.gl = gl;
	}

	/**
	 * Binds an index (element array) buffer to the current WebGL context.
	 *
	 * @param bufferData Buffer storage object containing the index data.
	 */
	bindIndices( bufferData: BufferStorage )
	{
		const gl = this.gl;
		gl.bindBuffer( gl.ELEMENT_ARRAY_BUFFER, bufferData.buffer );
	}

	/**
	 * Binds a standard (non-interleaved, non-instanced) vertex attribute to the shader.
	 *
	 * @param attribute The buffer attribute containing vertex data.
	 * @param attributeData The corresponding shader attribute metadata.
	 * @param bufferData The GPU buffer associated with the attribute data.
	 */
	bindStandardAttribute( attribute: BufferAttribute, attributeData: ShaderAttributeData, bufferData: BufferStorage )
	{
		const gl = this.gl;

		gl.bindBuffer( gl.ARRAY_BUFFER, bufferData.buffer );

		gl.enableVertexAttribArray( attributeData.location );
		gl.vertexAttribPointer(
			attributeData.location, // Shader attribute location
			attribute.itemSize, // Number of components per vertex (e.g., 2 for vec2)
			bufferData.type, // type
			false, // Normalized
			0, // Byte stride (0 if not interleaved)
			0  // Byte offset (0 if not interleaved)
		);
	}

	/**
	 * Binds a group of interleaved vertex attributes that share a single buffer.
	 * Each attribute is mapped using its offset and stride values.
	 *
	 * @param attributes Array of interleaved buffer attributes.
	 * @param attributeDatas Array of shader attribute metadata objects.
	 * @param bufferData Shared buffer containing interleaved vertex data.
	 */
	bindInterleavedAttributes( attributes: InterleavedBufferAttribute[], attributeDatas: ShaderAttributeData[], bufferData: BufferStorage )
	{
		/**
		 * @todo
		 * Verify that each attribute defined in the shader has been bound.
		 * If not, log a warning for missing attributes.
		 */
		const gl = this.gl;

		gl.bindBuffer( gl.ARRAY_BUFFER, bufferData.buffer );

		for ( const attribute of attributes ){

			const attributeData = attributeDatas.find( attributeData => attributeData.name === attribute.name );

			if ( ! attributeData ){
				console.error( `Attribute '${ attribute.name }' is not declared in the shader program.` );
				continue;
			}
			
			gl.enableVertexAttribArray( attributeData.location );
			gl.vertexAttribPointer(
				attributeData.location,	// Shader attribute location
				attribute.itemSize, // Number of components in this interleaved attribute
				bufferData.type, // type
				false, // normalized
				bufferData.bytesPerElement * attribute.data.stride, // Total byte length of one interleaved vertex entry
				bufferData.bytesPerElement * attribute.offset, // Byte offset of this attribute within an interleaved vertex
			);

		}
	}

}
