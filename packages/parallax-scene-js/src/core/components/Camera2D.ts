import { Matrix3 } from "../math/Matrix3";

export class Camera2D
{
	width!: number;
	height!: number;
	zoom!: number;
	projectionMatrix: Matrix3;

	constructor()
	{
		this.projectionMatrix = new Matrix3();
	}

	getProjectionMatrix(): number[]
	{
		return this.projectionMatrix.elements;
	}

	/**
	 * Orthographic Camera Projection
	 * 
	 * Cartesian coordinate system
	 * @see https://en.wikipedia.org/wiki/Cartesian_coordinate_system
	 * @see https://webglfundamentals.org/webgl/lessons/webgl-2d-matrices.html
	 * @see https://webglfundamentals.org/webgl/resources/m3.js
	 */
	setProjection( width: number, height: number, zoom: number = 1 ): void
	{
		this.width = width;
		this.height = height;
		this.zoom = zoom;

		const adjustedWidth = width / zoom;
		const adjustedHeight = height / zoom;
	
		// Matrix3.set(n11: number, n12: number, n13: number, n21: number, n22: number, n23: number, n31: number, n32: number, n33: number): Matrix3
		this.projectionMatrix.set(
			2 / adjustedWidth, 0, 0,
			0, -2 / adjustedHeight, 0,
			-1, 1, 1
		);
	}
}